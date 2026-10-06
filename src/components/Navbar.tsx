'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Volume2, VolumeX, LogOut, User, BookOpen } from 'lucide-react';
import { toggleMute, getIsMuted, playTick } from '@/lib/sounds';

export default function Navbar() {
  const { data: session } = useSession();
  const [muted, setMuted] = useState(() => (typeof window !== 'undefined' ? getIsMuted() : false));

  const handleToggleSound = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      playTick();
    }
  };

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Playful<span className="text-yellow-400">Quiz</span>
            </span>
            <span className="block text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase">
              Realtime Class Arena
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={muted ? 'Aktifkan Suara' : 'Bisukan Suara'}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Teacher Quizzes Link */}
          <Link
            href="/teacher/quizzes"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 hover:border-purple-400/50 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Dashboard Guru
          </Link>

          {/* User Profile / Login */}
          {session?.user ? (
            <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700/80 rounded-2xl pl-2 pr-3 py-1.5">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-8 h-8 rounded-full border border-purple-400/50 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                  {session.user.name ? session.user.name[0] : 'U'}
                </div>
              )}
              <div className="hidden md:block text-left text-xs leading-tight">
                <p className="font-semibold text-slate-200 truncate max-w-[120px]">{session.user.name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                title="Keluar"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-md shadow-pink-500/20 active:scale-95 transition-all"
            >
              <User className="w-4 h-4" />
              Masuk Google
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
