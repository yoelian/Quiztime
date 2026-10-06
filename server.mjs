import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import fs from 'node:fs';
import path from 'node:path';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Helper to read quizzes
function getQuizFromDisk(quizId) {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'quizzes.json');
    if (fs.existsSync(dataFile)) {
      const list = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      return list.find((q) => q.id === quizId);
    }
  } catch (err) {
    console.error('Error reading quiz from disk:', err);
  }
  return null;
}

// In-memory Room storage
const rooms = new Map();

function sanitizeRoomState(room) {
  const currentQ = room.questions[room.currentQuestionIndex];
  return {
    code: room.code,
    quizId: room.quizId,
    quizTitle: room.quizTitle,
    teacherName: room.teacherName,
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
    previewSecondsLeft: room.previewSecondsLeft,
    timeRemaining: room.timeRemaining,
    durationSeconds: room.durationSeconds,
    answerDistribution: (room.status === 'REVEAL' || room.status === 'LEADERBOARD' || room.status === 'FINISHED') ? room.answerDistribution : [0, 0, 0, 0],
    participants: Array.from(room.participants.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      hasAnsweredCurrent: p.hasAnsweredCurrent,
      selectedOption: p.selectedOption,
      lastPointsAwarded: (room.status === 'REVEAL' || room.status === 'LEADERBOARD' || room.status === 'FINISHED') ? p.lastPointsAwarded : 0,
      isLastCorrect: (room.status === 'REVEAL' || room.status === 'LEADERBOARD' || room.status === 'FINISHED') ? p.isLastCorrect : undefined,
      previousRank: p.previousRank,
      currentRank: p.currentRank
    })),
    currentQuestion: currentQ ? {
      id: currentQ.id,
      question: currentQ.question,
      options: currentQ.options,
      durationSeconds: currentQ.durationSeconds,
      points: currentQ.points || 1000,
      // Only include correctIndex if REVEAL or FINISHED
      correctIndex: (room.status === 'REVEAL' || room.status === 'LEADERBOARD' || room.status === 'FINISHED') ? currentQ.correctIndex : undefined
    } : null
  };
}

function clearRoomTimers(room) {
  if (room.previewTimer) {
    clearInterval(room.previewTimer);
    room.previewTimer = null;
  }
  if (room.answeringTimer) {
    clearInterval(room.answeringTimer);
    room.answeringTimer = null;
  }
  if (room.botTimeouts) {
    room.botTimeouts.forEach(t => clearTimeout(t));
    room.botTimeouts = [];
  }
}

function startQuestionPhase(room, io) {
  clearRoomTimers(room);

  // Record previous rank based on scores before this question starts
  const sortedBefore = Array.from(room.participants.values()).sort((a, b) => b.score - a.score);
  sortedBefore.forEach((p, idx) => {
    p.previousRank = idx + 1;
  });

  // Reset participant round status
  for (const p of room.participants.values()) {
    p.hasAnsweredCurrent = false;
    p.selectedOption = undefined;
    p.lastPointsAwarded = 0;
    p.isLastCorrect = undefined;
  }
  room.answerDistribution = [0, 0, 0, 0];
  room.status = 'PREVIEW';
  room.previewSecondsLeft = 4;

  const currentQ = room.questions[room.currentQuestionIndex];
  room.durationSeconds = currentQ?.durationSeconds || 20;
  room.timeRemaining = room.durationSeconds;

  io.to(`room:${room.code}`).emit('room_state', sanitizeRoomState(room));

  room.previewTimer = setInterval(() => {
    room.previewSecondsLeft--;
    io.to(`room:${room.code}`).emit('preview_tick', { secondsLeft: room.previewSecondsLeft });

    if (room.previewSecondsLeft <= 0) {
      clearInterval(room.previewTimer);
      room.previewTimer = null;
      startAnsweringPhase(room, io);
    }
  }, 1000);
}

function startAnsweringPhase(room, io) {
  clearRoomTimers(room);
  room.status = 'ANSWERING';
  io.to(`room:${room.code}`).emit('room_state', sanitizeRoomState(room));

  room.answeringTimer = setInterval(() => {
    room.timeRemaining--;
    io.to(`room:${room.code}`).emit('answering_tick', { timeRemaining: room.timeRemaining });

    if (room.timeRemaining <= 0) {
      clearInterval(room.answeringTimer);
      room.answeringTimer = null;
      revealAnswerPhase(room, io);
    }
  }, 1000);
}

function revealAnswerPhase(room, io) {
  clearRoomTimers(room);
  room.status = 'REVEAL';
  io.to(`room:${room.code}`).emit('room_state', sanitizeRoomState(room));
}

function showLeaderboardPhase(room, io) {
  clearRoomTimers(room);
  room.status = 'LEADERBOARD';

  // Calculate currentRank based on new scores
  const sortedNow = Array.from(room.participants.values()).sort((a, b) => b.score - a.score);
  sortedNow.forEach((p, idx) => {
    p.currentRank = idx + 1;
  });

  io.to(`room:${room.code}`).emit('room_state', sanitizeRoomState(room));
}

function finishQuizPhase(room, io) {
  clearRoomTimers(room);
  room.status = 'FINISHED';
  io.to(`room:${room.code}`).emit('room_state', sanitizeRoomState(room));
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create Room (Host)
    socket.on('create_room', ({ quizId, teacherName, teacherEmail }, callback) => {
      const quiz = getQuizFromDisk(quizId);
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        if (callback) callback({ success: false, error: 'Kuis tidak ditemukan atau belum memiliki soal.' });
        return;
      }

      // Generate 6-digit PIN
      let code;
      do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      } while (rooms.has(code));
      const room = {
        code,
        quizId,
        quizTitle: quiz.title,
        teacherSocketId: socket.id,
        teacherName: teacherName || 'Guru',
        teacherEmail: teacherEmail || '',
        status: 'LOBBY',
        currentQuestionIndex: 0,
        questions: quiz.questions,
        participants: new Map(),
        previewTimer: null,
        previewSecondsLeft: 4,
        answeringTimer: null,
        timeRemaining: 20,
        durationSeconds: 20,
        answerDistribution: [0, 0, 0, 0]
      };

      rooms.set(code, room);
      socket.join(`room:${code}`);
      socket.data = { role: 'teacher', roomCode: code };

      console.log(`Room created: ${code} by ${room.teacherName}`);
      if (callback) callback({ success: true, code, state: sanitizeRoomState(room) });
    });

    // Reconnect Host / Get Room State
    socket.on('get_room_state', ({ code }, callback) => {
      const room = rooms.get(code);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room tidak ditemukan' });
        return;
      }
      socket.join(`room:${code}`);
      if (callback) callback({ success: true, state: sanitizeRoomState(room) });
    });

    // Join Room (Student)
    socket.on('join_room', ({ code, studentName, studentEmail, studentAvatar }, callback) => {
      const room = rooms.get(code);
      if (!room) {
        if (callback) callback({ success: false, error: 'Kode PIN room tidak valid atau kuis belum dimulai oleh guru.' });
        return;
      }
      if (room.status === 'FINISHED') {
        if (callback) callback({ success: false, error: 'Kuis di room ini sudah selesai.' });
        return;
      }

      // Check if already in participants by email/name or add new
      let participantId = socket.id;
      let existingP = null;
      for (const p of room.participants.values()) {
        if (studentEmail && p.email === studentEmail) {
          existingP = p;
          break;
        }
      }

      const participant = {
        id: participantId,
        name: studentName || 'Siswa Hebat',
        email: studentEmail || '',
        avatar: studentAvatar || '🦊',
        score: existingP ? existingP.score : 0,
        streak: existingP ? existingP.streak : 0,
        hasAnsweredCurrent: existingP ? existingP.hasAnsweredCurrent : false,
        selectedOption: existingP ? existingP.selectedOption : undefined
      };

      room.participants.set(participantId, participant);
      socket.join(`room:${code}`);
      socket.data = { role: 'student', roomCode: code, participantId };

      console.log(`Student ${participant.name} (${socket.id}) joined room ${code}`);
      io.to(`room:${code}`).emit('room_state', sanitizeRoomState(room));

      if (callback) callback({ success: true, participantId, state: sanitizeRoomState(room) });
    });

    // Teacher Starts Quiz
    socket.on('start_quiz', ({ code }) => {
      const room = rooms.get(code);
      if (!room) return;
      console.log(`Starting quiz for room ${code}`);
      room.currentQuestionIndex = 0;
      startQuestionPhase(room, io);
    });

    // Student Submits Answer
    socket.on('submit_answer', ({ code, optionIndex }, callback) => {
      const room = rooms.get(code);
      if (!room || room.status !== 'ANSWERING') {
        if (callback) callback({ success: false, error: 'Waktu menjawab belum mulai atau sudah berakhir.' });
        return;
      }

      const participantId = socket.data?.participantId || socket.id;
      const participant = room.participants.get(participantId);
      if (!participant || participant.hasAnsweredCurrent) {
        if (callback) callback({ success: false, error: 'Sudah menjawab.' });
        return;
      }

      const currentQ = room.questions[room.currentQuestionIndex];
      const isCorrect = optionIndex === currentQ.correctIndex;

      participant.hasAnsweredCurrent = true;
      participant.selectedOption = optionIndex;
      participant.isLastCorrect = isCorrect;
      room.answerDistribution[optionIndex] = (room.answerDistribution[optionIndex] || 0) + 1;

      let points = 0;
      if (isCorrect) {
        participant.streak = (participant.streak || 0) + 1;
        points = currentQ.points ?? 1000;
        participant.score += points;
      } else {
        participant.streak = 0;
      }
      participant.lastPointsAwarded = points;

      // Do not return isCorrect or points until timer finishes
      if (callback) callback({ success: true });

      // Notify host of live answer count update
      io.to(`room:${code}`).emit('answer_update', {
        studentName: participant.name,
        studentAvatar: participant.avatar,
        answeredCount: Array.from(room.participants.values()).filter(p => p.hasAnsweredCurrent).length,
        totalParticipants: room.participants.size
      });
    });

    // Teacher Next Step (Reveal -> Leaderboard -> Next Question or Finish)
    socket.on('next_step', ({ code }) => {
      const room = rooms.get(code);
      if (!room) return;

      if (room.status === 'REVEAL') {
        showLeaderboardPhase(room, io);
      } else if (room.status === 'LEADERBOARD') {
        if (room.currentQuestionIndex + 1 < room.questions.length) {
          room.currentQuestionIndex++;
          startQuestionPhase(room, io);
        } else {
          finishQuizPhase(room, io);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const { role, roomCode, participantId } = socket.data || {};
      if (role === 'student' && roomCode && participantId) {
        const room = rooms.get(roomCode);
        if (room && room.status === 'LOBBY') {
          room.participants.delete(participantId);
          io.to(`room:${roomCode}`).emit('room_state', sanitizeRoomState(room));
        }
      }
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
