'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, User, GraduationCap } from 'lucide-react';
import Navbar from '@/components/Navbar';

const AVATARS = ['🦊', '🐼', '🚀', '🦄', '🐯', '🐸', '🐙', '🦁', '🤖', '🦖', '🍕', '⭐'];

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickLogin = async (name: string, email: string, avatar: string, userRole: 'teacher' | 'student') => {
    setIsLoading(true);
    await signIn('quick-login', {
      name,
      email,
      image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      role: userRole,
      callbackUrl,
    });
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const email = `${customName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    await handleQuickLogin(customName, email, selectedAvatar, role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white shadow-lg shadow-pink-500/25 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">Masuk ke PlayfulQuiz</h1>
            <p className="text-slate-400 text-sm mt-1">
              Gunakan Akun Google untuk mengakses kuis sebagai Guru atau Siswa.
            </p>
          </div>

          {/* Real Google OAuth Button */}
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer border border-slate-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            Masuk dengan Google Resmi
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              atau simulasi cepat
            </span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* Quick preset buttons */}
          <div className="space-y-2 mb-6">
            <p className="text-xs font-semibold text-slate-400 mb-2">Pilih Profil Siap Pakai:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('Pak Budi Santoso', 'budi.guru@gmail.com', '👨‍🏫', 'teacher')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 hover:border-purple-500 text-left text-xs text-purple-200 transition-all hover:scale-102 cursor-pointer"
              >
                <span className="text-xl">👨‍🏫</span>
                <div className="truncate">
                  <p className="font-bold truncate">Pak Budi</p>
                  <p className="text-[10px] text-purple-400">Guru (Host)</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('Bu Siti Rahma', 'siti.guru@gmail.com', '👩‍🏫', 'teacher')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-950/40 border border-pink-800/40 hover:border-pink-500 text-left text-xs text-pink-200 transition-all hover:scale-102 cursor-pointer"
              >
                <span className="text-xl">👩‍🏫</span>
                <div className="truncate">
                  <p className="font-bold truncate">Bu Siti</p>
                  <p className="text-[10px] text-pink-400">Guru (Host)</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('Kevin Pratama', 'kevin.siswa@gmail.com', '🦊', 'student')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 hover:border-blue-500 text-left text-xs text-blue-200 transition-all hover:scale-102 cursor-pointer"
              >
                <span className="text-xl">🦊</span>
                <div className="truncate">
                  <p className="font-bold truncate">Kevin Pratama</p>
                  <p className="text-[10px] text-blue-400">Siswa (Peserta)</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('Nadia Aurelia', 'nadia.siswa@gmail.com', '🦄', 'student')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 hover:border-emerald-500 text-left text-xs text-emerald-200 transition-all hover:scale-102 cursor-pointer"
              >
                <span className="text-xl">🦄</span>
                <div className="truncate">
                  <p className="font-bold truncate">Nadia Aurelia</p>
                  <p className="text-[10px] text-emerald-400">Siswa (Peserta)</p>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Name Sign In Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-4 border-t border-slate-800/80 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Atau Ketik Nama Kamu:
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Contoh: Andi Wijaya"
                required
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
            </div>

            {/* Role picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Masuk Sebagai:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'teacher'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Guru (Host)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'student'
                      ? 'bg-pink-600 border-pink-400 text-white shadow-md shadow-pink-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Siswa (Peserta)
                </button>
              </div>
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Avatar Lucu:</label>
              <div className="flex flex-wrap gap-2">
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
              disabled={isLoading || !customName.trim()}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? 'Sedang Masuk...' : 'Lanjut Masuk 🚀'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Memuat...</div>}>
      <SignInContent />
    </Suspense>
  );
}
