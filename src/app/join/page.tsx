'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { ArrowRight, KeyRound } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getSocket } from '@/lib/socketClient';
import { RoomState } from '@/types/quiz';

const AVATARS = ['🦊', '🐼', '🚀', '🦄', '🐯', '🐸', '🐙', '🦁', '🤖', '🦖', '🍕', '⭐'];

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [pin, setPin] = useState(searchParams.get('pin') || '');
  const [studentName, setStudentName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync initial student name from session once available
  const sessionName = session?.user?.name;
  useEffect(() => {
    if (sessionName) {
      setStudentName((prev) => (prev ? prev : sessionName));
    }
  }, [sessionName]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setErrorMsg('Masukkan kode PIN room.');
      return;
    }

    const nameToUse = studentName.trim() || session?.user?.name || 'Siswa Ceria';
    const emailToUse = session?.user?.email || `${nameToUse.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

    setIsJoining(true);
    const socket = getSocket();

    socket.emit(
      'join_room',
      {
        code: cleanPin,
        studentName: nameToUse,
        studentEmail: emailToUse,
        studentAvatar: selectedAvatar
      },
      (res: { success: boolean; error?: string; participantId?: string; state?: RoomState }) => {
        setIsJoining(false);
        if (res.success) {
          router.push(`/room/${cleanPin}/play`);
        } else {
          setErrorMsg(res.error || 'Gagal masuk ke room. Pastikan PIN benar.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20 mb-3">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">Gabung ke Kuis</h1>
            <p className="text-slate-400 text-sm mt-1">
              Masukkan PIN dari guru untuk masuk ke arena kuis.
            </p>
          </div>

          {/* Not signed in prompt */}
          {!session?.user && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-center">
              <p className="text-xs text-indigo-300 font-semibold mb-3">
                Kamu belum login dengan akun Google.
              </p>
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: `/join?pin=${pin}` })}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-md cursor-pointer mb-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Masuk Akun Google Resmi
              </button>
              <p className="text-[11px] text-slate-400">
                Atau langsung ketik nama di bawah untuk langsung bergabung:
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Kode PIN Room
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="6-digit PIN (contoh: 123456)"
                required
                maxLength={6}
                className="w-full px-4 py-3.5 bg-slate-800 border-2 border-slate-700 focus:border-pink-500 rounded-2xl text-center text-2xl font-mono font-black tracking-widest text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Siswa / Panggilan
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ketik nama kamu..."
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Pilih Karakter Avatar:
              </label>
              <div className="flex flex-wrap gap-2 justify-center py-1">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-transform cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 scale-110 shadow-md ring-2 ring-white/50'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-base shadow-lg shadow-pink-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>{isJoining ? 'Menghubungkan...' : 'Masuk ke Room Kuis 🚀'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Memuat...</div>}>
      <JoinContent />
    </Suspense>
  );
}
