'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Share2,
  Users,
  Play,
  ArrowRight,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Flame,
  Home,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { RoomState } from '@/types/quiz';
import { getSocket } from '@/lib/socketClient';
import {
  playTick,
  playJoinPop,
  playStartFanfare,
  playCorrect,
  playPodiumVictory
} from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

const OPTION_STYLES = [
  {
    letter: 'A',
    shape: '▲',
    color: 'bg-rose-500 hover:bg-rose-600 border-rose-400 text-white shadow-rose-500/25',
    ring: 'ring-rose-400',
    chartBg: 'bg-rose-500'
  },
  {
    letter: 'B',
    shape: '◆',
    color: 'bg-blue-600 hover:bg-blue-700 border-blue-400 text-white shadow-blue-500/25',
    ring: 'ring-blue-400',
    chartBg: 'bg-blue-600'
  },
  {
    letter: 'C',
    shape: '●',
    color: 'bg-amber-500 hover:bg-amber-600 border-amber-400 text-white shadow-amber-500/25',
    ring: 'ring-amber-400',
    chartBg: 'bg-amber-500'
  },
  {
    letter: 'D',
    shape: '■',
    color: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400 text-white shadow-emerald-500/25',
    ring: 'ring-emerald-400',
    chartBg: 'bg-emerald-600'
  }
];

export default function HostRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [answeredLiveCount, setAnsweredLiveCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    // Join room channel as host
    socket.emit('get_room_state', { code }, (res: { success: boolean; state?: RoomState; error?: string }) => {
      if (res.success && res.state) {
        setRoom(res.state);
        setAnsweredLiveCount(res.state.participants.filter(p => p.hasAnsweredCurrent).length);
      }
    });

    const handleRoomState = (newState: RoomState) => {
      setRoom((prev) => {
        // Reset answered counter on new question phase
        if (prev?.currentQuestionIndex !== newState.currentQuestionIndex || prev?.status !== newState.status) {
          if (newState.status === 'PREVIEW' || newState.status === 'ANSWERING') {
            setAnsweredLiveCount(0);
          }
        }

        // Play audio cues on phase change
        if (prev?.status !== newState.status) {
          if (newState.status === 'PREVIEW') {
            playStartFanfare();
          } else if (newState.status === 'REVEAL') {
            playCorrect();
          } else if (newState.status === 'FINISHED') {
            playPodiumVictory();
            fireConfetti();
          }
        }
        // Play pop sound if student count increases
        if (newState.participants.length > (prev?.participants.length || 0)) {
          playJoinPop();
        }
        return newState;
      });
    };

    const handlePreviewTick = ({ secondsLeft }: { secondsLeft: number }) => {
      playTick();
      setRoom((prev) => (prev ? { ...prev, previewSecondsLeft: secondsLeft } : null));
    };

    const handleAnsweringTick = ({ timeRemaining }: { timeRemaining: number }) => {
      if (timeRemaining <= 5 && timeRemaining > 0) {
        playTick();
      }
      setRoom((prev) => (prev ? { ...prev, timeRemaining } : null));
    };

    const handleAnswerUpdate = (data: { answeredCount: number }) => {
      setAnsweredLiveCount(data.answeredCount);
      playJoinPop();
    };

    socket.on('room_state', handleRoomState);
    socket.on('preview_tick', handlePreviewTick);
    socket.on('answering_tick', handleAnsweringTick);
    socket.on('answer_update', handleAnswerUpdate);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('preview_tick', handlePreviewTick);
      socket.off('answering_tick', handleAnsweringTick);
      socket.off('answer_update', handleAnswerUpdate);
    };
  }, [code]);

  const copyRoomLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/join?pin=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyPinOnly = () => {
    navigator.clipboard.writeText(code);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleStartQuiz = () => {
    const socket = getSocket();
    socket.emit('start_quiz', { code });
  };

  const handleNextStep = () => {
    const socket = getSocket();
    socket.emit('next_step', { code });
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-300">Menghubungkan ke Room {code}...</p>
      </div>
    );
  }

  const currentQ = room.currentQuestion;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col select-none">
      {/* Host Top Status Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
            Layar Guru (Host)
          </div>
          <h2 className="font-extrabold text-sm text-slate-300 hidden sm:block truncate max-w-xs">
            {room.quizTitle}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-pink-400" />
            <span>{room.participants.length} Siswa</span>
          </div>

          <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 px-3 py-1.5 rounded-xl text-xs font-black text-pink-400">
            <span>PIN:</span>
            <span className="text-white tracking-widest">{room.code}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area Based on Status */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {/* =========================================
            PHASE 1: LOBBY
        ========================================= */}
        {room.status === 'LOBBY' && (
          <div className="w-full flex flex-col items-center text-center">
            {/* PIN & Share Link Showcase */}
            <div className="bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-2xl w-full mb-8 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

              <p className="text-xs sm:text-sm uppercase tracking-widest font-black text-indigo-400 mb-2">
                Bergabung di HP / Browser kamu:
              </p>

              <div className="flex items-center justify-center gap-3 my-4">
                <span className="text-5xl sm:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 font-mono">
                  {room.code}
                </span>
                <button
                  onClick={copyPinOnly}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Salin PIN"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              {copiedPin && (
                <p className="text-xs font-bold text-emerald-400 mb-4 animate-fade-in">
                  ✓ Kode PIN berhasil disalin!
                </p>
              )}

              {/* Action Buttons to Share */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <button
                  onClick={copyRoomLink}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600 text-indigo-200 text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  {copiedLink ? 'Link Tersalin! 📋' : 'Salin Link Room Ujian'}
                </button>
              </div>
            </div>

            {/* Waiting Participants Box */}
            <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Siswa di Ruang Tunggu ({room.participants.length})
                </h3>
              </div>

              {room.participants.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm animate-pulse">
                    Bagikan Kode PIN atau Link di atas ke siswa untuk mulai bergabung...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-1">
                  <AnimatePresence>
                    {room.participants.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="bg-slate-800/80 border border-purple-500/30 rounded-2xl p-3 flex items-center gap-2.5 shadow-md"
                      >
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="font-extrabold text-xs text-slate-200 truncate">
                          {p.name}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Big Start Quiz Button */}
            <button
              onClick={handleStartQuiz}
              disabled={room.participants.length === 0}
              className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-xl shadow-2xl shadow-pink-500/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white" />
              Mulai Kuis Sekarang (Start Quiz)
            </button>
          </div>
        )}

        {/* =========================================
            PHASE 2: PREVIEW SOAL (3 - 5 DETIK FULLSCREEN)
        ========================================= */}
        {room.status === 'PREVIEW' && currentQ && (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-4xl bg-slate-900 border-2 border-pink-500/60 rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-4 py-1.5 rounded-2xl bg-pink-500/20 text-pink-300 font-black text-sm border border-pink-500/40">
                    Soal {room.currentQuestionIndex + 1} dari {room.totalQuestions}
                  </span>
                  {(currentQ.points || 1000) >= 2000 && (
                    <span className="px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40 flex items-center gap-1 animate-bounce">
                      🔥 Double Points ({(currentQ.points || 1000).toLocaleString()} Pts)
                    </span>
                  )}
                  {(currentQ.points || 1000) === 1500 && (
                    <span className="px-3 py-1.5 rounded-2xl bg-purple-500/20 text-purple-300 font-black text-xs border border-purple-500/40 flex items-center gap-1">
                      🌟 Bonus (1,500 Pts)
                    </span>
                  )}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center font-black text-2xl text-white shadow-lg animate-pulse">
                  {room.previewSecondsLeft}
                </div>
              </div>

              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">
                👀 PERHATIKAN SOAL DI LAYAR:
              </p>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-8">
                {currentQ.question}
              </h1>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* =========================================
            PHASE 3: ANSWERING (SOAL MENGEZIL + OPSI A/B/C/D + TIMER)
        ========================================= */}
        {room.status === 'ANSWERING' && currentQ && (
          <div className="w-full flex-1 flex flex-col justify-between">
            {/* Shrunk Question Header */}
            <motion.div
              initial={{ y: 50, scale: 1.1 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-6 text-center relative"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                    Soal #{room.currentQuestionIndex + 1}
                  </span>
                  {(currentQ.points || 1000) >= 2000 && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-black text-[11px] border border-amber-500/40 animate-pulse">
                      🔥 Double Points ({(currentQ.points || 1000).toLocaleString()} Pts)
                    </span>
                  )}
                  {(currentQ.points || 1000) === 1500 && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-black text-[11px] border border-purple-500/40">
                      🌟 Bonus (1,500 Pts)
                    </span>
                  )}
                </div>

                {/* Circular / Linear Countdown */}
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-xl font-mono font-black text-base border ${
                    room.timeRemaining <= 5
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-bounce'
                      : 'bg-slate-800 border-slate-700 text-emerald-400'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{room.timeRemaining}s</span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {currentQ.question}
              </h2>

              {/* Progress bar timer */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-6">
                <div
                  className={`h-full transition-all duration-1000 ${
                    room.timeRemaining <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  }`}
                  style={{
                    width: `${Math.max(0, (room.timeRemaining / (room.durationSeconds || 20)) * 100)}%`
                  }}
                />
              </div>
            </motion.div>

            {/* Simple Realtime Answer Status Badge */}
            <div className="flex justify-center mb-6">
              <motion.div
                key={answeredLiveCount}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-slate-900/90 border border-indigo-500/50 shadow-xl backdrop-blur-md"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-black text-sm text-pink-300">
                  {answeredLiveCount} Menjawab
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  (dari {room.participants.length} Siswa)
                </span>
              </motion.div>
            </div>

            {/* 4 Options Grid (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQ.options.map((option, idx) => {
                const optStyle = OPTION_STYLES[idx];
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all shadow-lg ${optStyle.color}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center font-black text-2xl shrink-0">
                      {optStyle.shape}
                    </div>
                    <span className="text-lg sm:text-xl font-bold leading-tight">
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            PHASE 4: REVEAL (JAWABAN BENAR / SALAH TERBUKA)
        ========================================= */}
        {room.status === 'REVEAL' && currentQ && (
          <div className="w-full flex-1 flex flex-col justify-between">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center mb-6">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">
                Jawaban Soal #{room.currentQuestionIndex + 1}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {currentQ.question}
              </h2>
            </div>

            {/* Options with Highlight and Answer Distribution Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {currentQ.options.map((option, idx) => {
                const optStyle = OPTION_STYLES[idx];
                const isCorrect = idx === currentQ.correctIndex;
                const count = room.answerDistribution[idx] || 0;
                const totalAnswers = room.participants.length || 1;
                const percentage = Math.round((count / totalAnswers) * 100);

                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border-2 flex flex-col justify-between relative overflow-hidden transition-all shadow-xl ${
                      isCorrect
                        ? 'bg-emerald-600/90 border-emerald-400 text-white ring-4 ring-emerald-400/50 scale-102'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 z-10">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center font-black text-lg">
                          {optStyle.letter}
                        </span>
                        <span className="text-lg font-bold">{option}</span>
                      </div>

                      {isCorrect ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-200 fill-emerald-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-slate-500" />
                      )}
                    </div>

                    <div className="z-10 flex items-center justify-between text-xs font-extrabold pt-2 border-t border-white/10">
                      <span>{count} Siswa Memilih</span>
                      <span>{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Step Button */}
            <div className="flex justify-end">
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-lg shadow-xl shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Lihat Papan Skor (Next)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            PHASE 5: LEADERBOARD SEMENTARA
        ========================================= */}
        {room.status === 'LEADERBOARD' && (
          <div className="w-full max-w-3xl flex-1 flex flex-col justify-between">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 mb-2">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-white">Top Score Sementara</h2>
              <p className="text-xs text-slate-400">
                Setelah Soal #{room.currentQuestionIndex + 1} dari {room.totalQuestions}
              </p>
            </div>

            {/* Ranking List with Rank Climb/Fall Animations */}
            <div className="space-y-3 mb-8">
              {[...room.participants]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((p, index) => {
                  const currentRank = index + 1;
                  const prevRank = p.previousRank || currentRank;
                  const rankDiff = prevRank - currentRank; // > 0 = naik, < 0 = turun

                  return (
                    <motion.div
                      key={p.id}
                      initial={{
                        y: rankDiff > 0 ? 35 * Math.min(3, rankDiff) : rankDiff < 0 ? -25 : 0,
                        opacity: 0,
                        scale: rankDiff > 0 ? 0.96 : 1
                      }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 140,
                        damping: 15,
                        delay: index * 0.12
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-md ${
                        rankDiff > 0
                          ? 'ring-2 ring-emerald-400/50 shadow-emerald-500/10'
                          : ''
                      } ${
                        index === 0
                          ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border-yellow-500/40 text-yellow-300'
                          : index === 1
                          ? 'bg-slate-800/80 border-slate-600 text-slate-200'
                          : index === 2
                          ? 'bg-slate-800/60 border-amber-800/50 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Number + Up/Down Indicator */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-8 h-8 rounded-xl font-black flex items-center justify-center text-sm bg-black/40 border border-white/10">
                            #{currentRank}
                          </span>

                          {/* Arrow indicator for rank changes */}
                          {rankDiff > 0 ? (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-xs shadow-md shadow-emerald-500/20"
                              title={`Naik ${rankDiff} peringkat dari #${prevRank}`}
                            >
                              <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                              <span>+{rankDiff}</span>
                            </motion.span>
                          ) : rankDiff < 0 ? (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs"
                              title={`Turun ${Math.abs(rankDiff)} peringkat dari #${prevRank}`}
                            >
                              <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{Math.abs(rankDiff)}</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-1 py-0.5 rounded-full text-slate-500 text-xs font-bold"
                              title="Peringkat tidak berubah"
                            >
                              <Minus className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <span className="text-2xl">{p.avatar}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-base text-white">{p.name}</p>
                            {rankDiff > 0 && (
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Naik! 🚀
                              </span>
                            )}
                          </div>
                          {p.streak > 1 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400">
                              <Flame className="w-3 h-3 fill-orange-400" />
                              {p.streak}x Combo!
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-xl text-pink-400">
                          {p.score.toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Poin</span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {/* Next Question / Finish Button */}
            <div className="flex justify-end">
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-lg shadow-xl shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
              >
                {room.currentQuestionIndex + 1 < room.totalQuestions ? (
                  <>
                    <span>Lanjut ke Soal Berikutnya</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span>Lihat Pemenang Akhir 🏆</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            PHASE 6: FINISHED (PODIUM JUARA AKHIR)
        ========================================= */}
        {room.status === 'FINISHED' && (
          <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 mb-2">
              🎉 Kuis Selesai! 🎉
            </h1>
            <p className="text-slate-400 text-sm mb-10">
              Selamat kepada para juara dan semua siswa yang telah berpartisipasi dengan luar biasa!
            </p>

            {/* 3D-styled Podium */}
            {(() => {
              const sorted = [...room.participants].sort((a, b) => b.score - a.score);
              const rank1 = sorted[0];
              const rank2 = sorted[1];
              const rank3 = sorted[2];

              return (
                <div className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-2xl mb-12">
                  {/* Rank 2 */}
                  {rank2 && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <span className="text-3xl sm:text-4xl mb-2">{rank2.avatar}</span>
                      <p className="font-extrabold text-sm text-slate-200 truncate max-w-[100px]">{rank2.name}</p>
                      <span className="text-xs text-pink-400 font-mono font-bold mb-2">{rank2.score} pts</span>
                      <div className="w-full h-32 sm:h-40 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700 border-t-4 border-slate-400 flex flex-col items-center justify-center shadow-lg">
                        <span className="text-3xl font-black text-slate-300">2</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Silver</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Rank 1 */}
                  {rank1 && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex-1 flex flex-col items-center -mt-6"
                    >
                      <div className="relative">
                        <span className="text-4xl sm:text-6xl mb-2 block">{rank1.avatar}</span>
                        <span className="absolute -top-3 -right-2 text-2xl animate-bounce">👑</span>
                      </div>
                      <p className="font-extrabold text-base text-yellow-300 truncate max-w-[120px]">{rank1.name}</p>
                      <span className="text-sm text-pink-400 font-mono font-black mb-2">{rank1.score} pts</span>
                      <div className="w-full h-44 sm:h-56 rounded-t-2xl bg-gradient-to-t from-yellow-600/70 to-amber-500 border-t-4 border-yellow-300 flex flex-col items-center justify-center shadow-2xl shadow-yellow-500/20">
                        <span className="text-4xl font-black text-white">1</span>
                        <span className="text-xs uppercase font-extrabold text-yellow-200">Champion</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Rank 3 */}
                  {rank3 && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <span className="text-3xl sm:text-4xl mb-2">{rank3.avatar}</span>
                      <p className="font-extrabold text-sm text-slate-200 truncate max-w-[100px]">{rank3.name}</p>
                      <span className="text-xs text-pink-400 font-mono font-bold mb-2">{rank3.score} pts</span>
                      <div className="w-full h-24 sm:h-32 rounded-t-2xl bg-gradient-to-t from-amber-900/60 to-amber-800 border-t-4 border-amber-600 flex flex-col items-center justify-center shadow-lg">
                        <span className="text-2xl font-black text-amber-300">3</span>
                        <span className="text-[10px] uppercase font-bold text-amber-400">Bronze</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })()}

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/teacher/quizzes')}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Kembali ke Bank Soal
              </button>

              <button
                onClick={() => fireConfetti()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Ledakkan Konfeti Lagi 🎊
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
