'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  Users,
  Sparkles,
  Home,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { RoomState, Participant } from '@/types/quiz';
import { getSocket } from '@/lib/socketClient';
import {
  playTick,
  playCorrect,
  playWrong,
  playPodiumVictory
} from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

const OPTION_BUTTONS = [
  {
    letter: 'A',
    shape: '▲',
    color: 'bg-rose-500 hover:bg-rose-600 active:scale-95 border-rose-400 text-white shadow-rose-500/30'
  },
  {
    letter: 'B',
    shape: '◆',
    color: 'bg-blue-600 hover:bg-blue-700 active:scale-95 border-blue-400 text-white shadow-blue-500/30'
  },
  {
    letter: 'C',
    shape: '●',
    color: 'bg-amber-500 hover:bg-amber-600 active:scale-95 border-amber-400 text-white shadow-amber-500/30'
  },
  {
    letter: 'D',
    shape: '■',
    color: 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 border-emerald-400 text-white shadow-emerald-500/30'
  }
];

export default function StudentPlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.emit('get_room_state', { code }, (res: { success: boolean; state?: RoomState; error?: string }) => {
      if (res.success && res.state) {
        setRoom(res.state);
        // Find me in participants
        const me = res.state.participants.find((p) => p.id === socket.id);
        if (me) setMyParticipant(me);
      }
    });

    const handleRoomState = (newState: RoomState) => {
      setRoom((prev) => {
        // Phase transition audio cues
        if (prev?.status !== newState.status) {
          if (newState.status === 'ANSWERING') {
            setSelectedOption(null);
          } else if (newState.status === 'REVEAL') {
            const me = newState.participants.find((p) => p.id === socket.id);
            if (me?.isLastCorrect) {
              playCorrect();
            } else {
              playWrong();
            }
          } else if (newState.status === 'FINISHED') {
            playPodiumVictory();
            fireConfetti();
          }
        }
        return newState;
      });

      const me = newState.participants.find((p) => p.id === socket.id);
      if (me) setMyParticipant(me);
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

    socket.on('room_state', handleRoomState);
    socket.on('preview_tick', handlePreviewTick);
    socket.on('answering_tick', handleAnsweringTick);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('preview_tick', handlePreviewTick);
      socket.off('answering_tick', handleAnsweringTick);
    };
  }, [code]);

  const handleSelectAnswer = (optIndex: number) => {
    if (selectedOption !== null || isSubmitting || room?.status !== 'ANSWERING') return;

    setSelectedOption(optIndex);
    setIsSubmitting(true);
    playTick();

    const socket = getSocket();
    socket.emit('submit_answer', { code, optionIndex: optIndex }, () => {
      setIsSubmitting(false);
    });
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-300">Menghubungkan ke Room {code}...</p>
      </div>
    );
  }

  const currentQ = room.currentQuestion;

  // Compute student rank
  const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);
  const myRank = myParticipant
    ? sortedParticipants.findIndex((p) => p.id === myParticipant.id) + 1
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col select-none">
      {/* Student Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {myParticipant && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl">
              <span className="text-xl">{myParticipant.avatar}</span>
              <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                {myParticipant.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {myParticipant && (
            <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/30 px-3 py-1 rounded-xl text-xs font-extrabold text-pink-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{myParticipant.score} Pts</span>
            </div>
          )}
          <span className="text-[11px] font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">
            PIN: {code}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg w-full mx-auto">
        {/* =========================================
            LOBBY: WAITING ROOM
        ========================================= */}
        {room.status === 'LOBBY' && (
          <div className="w-full text-center py-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-6"
            >
              <div className="text-5xl mb-3 animate-bounce">
                {myParticipant?.avatar || '🎉'}
              </div>
              <h2 className="text-xl font-black text-white mb-1">
                Halo, {myParticipant?.name || 'Siswa'}!
              </h2>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-6">
                Kamu sudah masuk di Room Kuis!
              </p>

              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 mb-6">
                <p className="text-sm font-bold text-indigo-200 animate-pulse">
                  ⏳ Menunggu Pak/Bu Guru memulai kuis...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Perhatikan layar proyektor atau dengarkan instruksi guru.
                </p>
              </div>

              {/* Classmates in lobby */}
              <div className="text-left">
                <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-pink-400" />
                  Teman Sekelas yang Sudah Hadir ({room.participants.length}):
                </p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {room.participants.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* =========================================
            PREVIEW: 3 - 5 DETIK FULLSCREEN
        ========================================= */}
        {room.status === 'PREVIEW' && currentQ && (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-slate-900 border-2 border-pink-500 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-pink-500/20 text-pink-300 font-extrabold text-xs">
                    Soal #{room.currentQuestionIndex + 1}
                  </span>
                  {(currentQ.points || 1000) >= 2000 && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/40 animate-pulse">
                      🔥 Double Points!
                    </span>
                  )}
                  {(currentQ.points || 1000) === 1500 && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/40">
                      🌟 Bonus (1,500 Pts)
                    </span>
                  )}
                </div>
                <span className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center font-black text-xl text-white shadow-lg animate-pulse">
                  {room.previewSecondsLeft}
                </span>
              </div>

              <p className="text-xs uppercase tracking-widest text-slate-400 font-extrabold mb-3">
                👀 PERHATIKAN SOAL:
              </p>

              <h2 className="text-2xl font-black text-white leading-snug mb-6">
                {currentQ.question}
              </h2>

              <p className="text-xs text-pink-400 font-semibold animate-pulse">
                Siap-siap, pilihan jawaban akan segera muncul!
              </p>
            </motion.div>
          </div>
        )}

        {/* =========================================
            ANSWERING: PILIH A / B / C / D
        ========================================= */}
        {room.status === 'ANSWERING' && currentQ && (
          <div className="w-full flex-1 flex flex-col justify-between py-2">
            {/* Shrunk Question Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4 text-center">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                    Soal #{room.currentQuestionIndex + 1}
                  </span>
                  {(currentQ.points || 1000) >= 2000 && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 animate-pulse">
                      🔥 2x Pts!
                    </span>
                  )}
                  {(currentQ.points || 1000) === 1500 && (
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                      🌟 1.5k Pts
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 font-mono font-bold text-xs text-emerald-400 border border-slate-700">
                  <Clock className="w-3 h-3" />
                  <span>{room.timeRemaining}s</span>
                </div>
              </div>
              <h3 className="text-base font-extrabold text-white leading-tight">
                {currentQ.question}
              </h3>
            </div>

            {/* Answer State: If already answered vs Not yet answered */}
            {selectedOption !== null ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-3xl animate-bounce">
                  🔒
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-1">
                    Jawabanmu Terkunci!
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilihan kamu:{' '}
                    <span className="font-extrabold text-pink-400">
                      Opsi {OPTION_BUTTONS[selectedOption].letter}: {currentQ.options[selectedOption]}
                    </span>
                  </p>
                </div>

                {/* Big Live Countdown Banner */}
                <div className="px-5 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 font-mono font-black text-base flex items-center justify-center">
                    {room.timeRemaining}s
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold text-slate-200">Menunggu Timer Selesai</p>
                    <p className="text-slate-400 text-[11px]">Hasil benar/salah muncul setelah waktu habis.</p>
                  </div>
                </div>

                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mt-2" />
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3 flex-1 items-stretch">
                {currentQ.options.map((optText, idx) => {
                  const btn = OPTION_BUTTONS[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-xl ${btn.color}`}
                    >
                      <span className="text-3xl font-black drop-shadow-md">{btn.shape}</span>
                      <span className="text-sm sm:text-base font-extrabold text-center leading-tight line-clamp-3">
                        {optText}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================
            REVEAL: FEEDBACK BENAR / SALAH
        ========================================= */}
        {room.status === 'REVEAL' && currentQ && (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center">
            {(() => {
              const me = room.participants.find((p) => p.id === myParticipant?.id);
              const isCorrect = me?.isLastCorrect;
              const points = me?.lastPointsAwarded || 0;
              const correctLetter =
                typeof currentQ.correctIndex === 'number'
                  ? OPTION_BUTTONS[currentQ.correctIndex].letter
                  : '-';
              const correctText =
                typeof currentQ.correctIndex === 'number'
                  ? currentQ.options[currentQ.correctIndex]
                  : '';

              return (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 shadow-2xl ${
                    isCorrect
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                      : 'bg-rose-950/80 border-rose-500 text-rose-100'
                  }`}
                >
                  <div className="mb-4">
                    {isCorrect ? (
                      <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto animate-bounce" />
                    ) : (
                      <XCircle className="w-20 h-20 text-rose-400 mx-auto animate-pulse" />
                    )}
                  </div>

                  <h2 className="text-3xl font-black mb-1">
                    {isCorrect ? 'Luar Biasa! Benar! 🎉' : 'Aduh, Belum Tepat! 😅'}
                  </h2>

                  {isCorrect ? (
                    <div className="my-4">
                      <span className="text-2xl font-black font-mono text-yellow-300">
                        +{points} Poin
                      </span>
                      {me && me.streak > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-1 text-xs font-bold text-orange-400">
                          <Flame className="w-4 h-4 fill-orange-400" />
                          <span>Combo Streak {me.streak}x!</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="my-4 p-3 rounded-2xl bg-black/30 border border-white/10 text-xs text-left">
                      <p className="text-slate-400 mb-1">Kunci Jawaban yang Benar:</p>
                      <p className="font-bold text-emerald-300 text-sm">
                        {correctLetter}. {correctText}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 mt-4 animate-pulse">
                    Tunggu gurumu menekan tombol Next di layar depan...
                  </p>
                </motion.div>
              );
            })()}
          </div>
        )}

        {/* =========================================
            LEADERBOARD: PERINGKAT SEMENTARA SISWA
        ========================================= */}
        {room.status === 'LEADERBOARD' && (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-white mb-1">
                Posisi Kamu di Kelas
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Setelah Soal #{room.currentQuestionIndex + 1}
              </p>

              {(() => {
                const prevRank = myParticipant?.previousRank || myRank;
                const myRankDiff = prevRank - myRank;

                return (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-purple-500/40 mb-6 flex flex-col items-center">
                    {/* Rank delta indicator */}
                    {myRankDiff > 0 ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.25, 1] }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-xs mb-3 shadow-md shadow-emerald-500/20"
                      >
                        <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Naik +{myRankDiff} Peringkat! 🚀</span>
                      </motion.div>
                    ) : myRankDiff < 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs mb-3">
                        <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Turun {Math.abs(myRankDiff)} Peringkat</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[11px] mb-3">
                        <Minus className="w-3 h-3" />
                        <span>Peringkat Tetap</span>
                      </div>
                    )}

                    <span className="text-4xl font-black text-white font-mono">
                      #{myRank}
                    </span>
                    <span className="text-xs font-bold text-purple-300 block mt-1">
                      dari {room.participants.length} Siswa
                    </span>
                    <span className="text-lg font-black text-pink-400 font-mono mt-2 block">
                      {myParticipant?.score || 0} Poin
                    </span>
                  </div>
                );
              })()}

              <p className="text-xs text-slate-400 animate-pulse">
                Siap-siap untuk soal berikutnya! 🚀
              </p>
            </motion.div>
          </div>
        )}

        {/* =========================================
            FINISHED: FINAL PODIUM & SKOR AKHIR
        ========================================= */}
        {room.status === 'FINISHED' && (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <span className="text-5xl mb-3 block">🏆</span>
              <h2 className="text-2xl font-black text-white mb-1">
                Kuis Telah Selesai!
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Kerja bagus! Berikut hasil akhir pencapaianmu:
              </p>

              <div className="p-5 rounded-2xl bg-purple-950/60 border border-purple-800/60 mb-6 space-y-2">
                <div className="text-xs text-purple-300 font-bold uppercase">
                  Peringkat Akhir
                </div>
                <div className="text-4xl font-black text-yellow-300 font-mono">
                  #{myRank}
                </div>
                <div className="text-base font-extrabold text-pink-300 font-mono">
                  Total Skor: {myParticipant?.score || 0} Pts
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Kembali ke Halaman Utama
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
