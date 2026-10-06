'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  Users,
  Timer,
  Trophy,
  Zap,
  Gamepad2,
  CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [pin, setPin] = useState('');

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    router.push(`/join?pin=${pin.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-6xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs sm:text-sm font-extrabold mb-6 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Kuis Kelas Interaktif & Realtime Ala Kahoot!</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            Bikin Belajar di Kelas Jadi{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-yellow-400">
              Super Playful & Seru!
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto">
            Guru login akun Google, buat soal & bagikan token room. Siswa gabung dari HP masing-masing dan berkompetisi secara *live* dengan timer & podium juara!
          </p>
        </div>

        {/* Dual Actions Grid: Siswa vs Guru */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-16">
          {/* Card Siswa: Join Room via PIN */}
          <div className="bg-slate-900/90 border-2 border-pink-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all pointer-events-none" />

            <div>
              <div className="inline-flex p-3 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30 mb-4">
                <Gamepad2 className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-black text-white mb-2">
                Siswa / Peserta
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-6">
                Punya kode PIN dari gurumu? Masukkan di bawah dan langsung bergabung ke arena permainan!
              </p>

              <form onSubmit={handleJoinPin} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Masukkan 6-Digit PIN..."
                    maxLength={6}
                    className="w-full px-4 py-3.5 bg-slate-800 border-2 border-slate-700 focus:border-pink-500 rounded-2xl text-center text-xl font-mono font-black tracking-widest text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black text-base shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Gabung ke Room Kuis 🚀</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>✓ Sinkronisasi Realtime</span>
              <span>✓ Suara & Haptic Seru</span>
            </div>
          </div>

          {/* Card Guru: Dashboard & Host */}
          <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

            <div>
              <div className="inline-flex p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-4">
                <GraduationCap className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-black text-white mb-2">
                Guru (Host Room)
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-6">
                Login akun Google untuk membuat soal pilihan ganda, atur timer per soal, dan kendalikan kuis di layar proyektor kelas.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Preview soal fullscreen 3-5 detik otomatis</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pilihan A/B/C/D & durasi timer custom (10-60 detik)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Top score sementara & podium juara 1, 2, 3</span>
                </div>
              </div>
            </div>

            <Link
              href={session?.user ? '/teacher/quizzes' : '/auth/signin?callbackUrl=/teacher/quizzes'}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>{session?.user ? 'Masuk ke Dashboard Guru 👨‍🏫' : 'Login Akun Google Guru 👨‍🏫'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Feature Icons Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
            <Timer className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Timer Dinamis</h4>
            <p className="text-[11px] text-slate-400">Atur durasi per soal (10-60s) sesuai kesulitan.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Realtime Presisi</h4>
            <p className="text-[11px] text-slate-400">Sinkronisasi detik demi detik guru & siswa.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Lobby Interaktif</h4>
            <p className="text-[11px] text-slate-400">Daftar siswa masuk tampil live di proyektor.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
            <Trophy className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Podium & Konfeti</h4>
            <p className="text-[11px] text-slate-400">Selebrasi animasi juara 1, 2, dan 3.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
