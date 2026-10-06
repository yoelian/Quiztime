'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Play,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Award,
  Copy,
  Eye,
  Search,
  Zap
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Quiz, Question } from '@/types/quiz';
import { getSocket } from '@/lib/socketClient';

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120];

const POINT_PRESETS = [
  { label: '500 Pts (Ringan)', value: 500, icon: '⚡' },
  { label: '1,000 Pts (Standar)', value: 1000, icon: '🎯' },
  { label: '1,500 Pts (Bonus)', value: 1500, icon: '🌟' },
  { label: '2,000 Pts (Ganda 🔥)', value: 2000, icon: '🔥' },
  { label: '3,000 Pts (Super 👑)', value: 3000, icon: '👑' }
];

export default function TeacherQuizzesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [isLaunching, setIsLaunching] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for creating / editing quiz
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [globalPoints, setGlobalPoints] = useState<number>(500);
  const [globalDuration, setGlobalDuration] = useState<number>(20);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q-1',
      question: 'Apa ibukota negara Indonesia saat ini?',
      options: ['Jakarta', 'Nusantara', 'Surabaya', 'Bandung'],
      correctIndex: 1,
      durationSeconds: 20,
      points: 500
    }
  ]);

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const openCreateModal = () => {
    setQuizId(null);
    setQuizTitle('Kuis Tematik Kelas');
    setQuizDesc('Pertanyaan seru untuk melatih pemahaman materi');
    setGlobalPoints(500);
    setGlobalDuration(20);
    setQuestions([
      {
        id: `q-${Date.now()}-1`,
        question: 'Berapakah hasil dari 7 x 8?',
        options: ['54', '56', '58', '64'],
        correctIndex: 1,
        durationSeconds: 20,
        points: 500
      },
      {
        id: `q-${Date.now()}-2`,
        question: 'Gas apa yang paling dibutuhkan tumbuhan untuk fotosintesis?',
        options: ['Oksigen', 'Karbon Dioksida', 'Nitrogen', 'Helium'],
        correctIndex: 1,
        durationSeconds: 20,
        points: 500
      }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (q: Quiz) => {
    setQuizId(q.id);
    setQuizTitle(q.title);
    setQuizDesc(q.description || '');
    const firstPts = q.questions[0]?.points ?? 500;
    const firstDur = q.questions[0]?.durationSeconds ?? 20;
    setGlobalPoints(firstPts);
    setGlobalDuration(firstDur);
    // ensure all questions have these values
    setQuestions(
      q.questions.map((item) => ({
        ...item,
        points: item.points ?? firstPts,
        durationSeconds: item.durationSeconds ?? firstDur
      }))
    );
    setIsModalOpen(true);
  };

  const handleGlobalPointsChange = (pts: number) => {
    setGlobalPoints(pts);
    setQuestions((prev) => prev.map((q) => ({ ...q, points: pts })));
  };

  const handleGlobalDurationChange = (dur: number) => {
    setGlobalDuration(dur);
    setQuestions((prev) => prev.map((q) => ({ ...q, durationSeconds: dur })));
  };

  const handleDuplicateQuiz = async (q: Quiz) => {
    const duplicated: Quiz = {
      ...q,
      id: `quiz-${Date.now()}`,
      title: `${q.title} (Salinan)`,
      createdAt: new Date().toISOString()
    };
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated)
      });
      const data = await res.json();
      if (data.success) {
        fetchQuizzes();
      }
    } catch (err) {
      console.error('Failed to duplicate quiz', err);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${questions.length + 1}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        durationSeconds: globalDuration,
        points: globalPoints
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Kuis minimal harus memiliki 1 pertanyaan.');
      return;
    }
    const updated = [...questions];
    updated.splice(idx, 1);
    setQuestions(updated);
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].question = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectSelect = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctIndex = optIdx;
    setQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert('Judul kuis tidak boleh kosong');
      return;
    }

    // Validate that questions and options are filled
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        alert(`Pertanyaan ke-${i + 1} belum diisi.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].trim()) {
          alert(`Pilihan ${String.fromCharCode(65 + j)} pada soal ke-${i + 1} belum diisi.`);
          return;
        }
      }
    }

    // Ensure all questions carry the chosen global points and duration
    const questionsToSave = questions.map((q) => ({
      ...q,
      points: globalPoints,
      durationSeconds: globalDuration
    }));

    const payload: Quiz = {
      id: quizId || `quiz-${Date.now()}`,
      title: quizTitle,
      description: quizDesc,
      teacherEmail: session?.user?.email || 'guru@sekolah.sch.id',
      teacherName: session?.user?.name || 'Pak Guru Ceria',
      createdAt: new Date().toISOString(),
      questions: questionsToSave
    };

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchQuizzes();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan kuis.');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus kuis ini?')) return;
    try {
      await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
      fetchQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  // Launch live room
  const handleLaunchRoom = (quiz: Quiz) => {
    setIsLaunching(quiz.id);
    const socket = getSocket();

    socket.emit(
      'create_room',
      {
        quizId: quiz.id,
        teacherName: session?.user?.name || 'Pak Guru Ceria',
        teacherEmail: session?.user?.email || 'guru@sekolah.sch.id'
      },
      (res: { success: boolean; code?: string; error?: string }) => {
        setIsLaunching(null);
        if (res.success && res.code) {
          router.push(`/room/${res.code}/host`);
        } else {
          alert(res.error || 'Gagal membuat room.');
        }
      }
    );
  };

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                👨‍🏫 Bank Soal & Dashboard Guru
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">Kelola Bank Soal & Pengaturan Kuis</h1>
            <p className="text-slate-400 text-sm">
              Atur poin flat per soal, tentukan durasi timer kuis, dan luncurkan ke kelas secara langsung.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold shadow-lg shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Buat Paket Soal Baru
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari paket kuis..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span>📦 Total: <strong className="text-white">{quizzes.length}</strong> Paket Kuis</span>
            <span>📝 Total: <strong className="text-pink-400">{quizzes.reduce((acc, q) => acc + q.questions.length, 0)}</strong> Soal Tersimpan</span>
          </div>
        </div>

        {/* Quizzes List */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">Memuat daftar kuis...</div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">
              {searchQuery ? 'Kuis Tidak Ditemukan' : 'Belum Ada Kuis'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery
                ? 'Tidak ada paket kuis yang cocok dengan pencarian kata kunci tersebut.'
                : 'Klik tombol di atas untuk membuat paket soal kuis pertamamu dan atur poin serta timernya!'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm cursor-pointer"
              >
                Buat Kuis Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => {
              const totalPoints = quiz.questions.reduce((acc, q) => acc + (q.points || 1000), 0);
              const totalDuration = quiz.questions.reduce((acc, q) => acc + (q.durationSeconds || 20), 0);

              return (
                <div
                  key={quiz.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {quiz.questions.length} Soal
                        </span>
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-yellow-400" />
                          {totalPoints.toLocaleString()} Pts
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewQuiz(quiz)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Preview Bank Soal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateQuiz(quiz)}
                          className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Duplikat Kuis"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(quiz)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Edit Kuis"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Kuis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1.5 group-hover:text-pink-300 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {quiz.description || 'Tidak ada deskripsi'}
                    </p>

                    <div className="space-y-1.5 mb-6 text-xs text-slate-500">
                      <p>Oleh: <span className="text-slate-400 font-semibold">{quiz.teacherName}</span></p>
                      <p>
                        Estimasi Durasi:{' '}
                        <span className="text-slate-400 font-semibold">
                          ~{totalDuration} detik ({Math.ceil(totalDuration / 60)} menit)
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Host Launch Button */}
                  <button
                    onClick={() => handleLaunchRoom(quiz)}
                    disabled={isLaunching === quiz.id}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {isLaunching === quiz.id ? 'Membuka Room...' : 'Luncurkan Room Kuis (Host)'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create / Edit Quiz */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Sticky / Pinned Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 shrink-0 bg-slate-900/95 backdrop-blur">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {quizId ? 'Edit Paket Kuis' : 'Buat Paket Kuis Baru'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tentukan nilai poin seragam dan durasi timer kuis dalam satu pengaturan terpusat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form wrapping scrollable content and pinned footer */}
              <form onSubmit={handleSaveQuiz} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Judul Kuis
                    </label>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Contoh: Kuis Matematika Cepat Bab 3"
                      required
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Deskripsi Singkat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={quizDesc}
                      onChange={(e) => setQuizDesc(e.target.value)}
                      placeholder="Contoh: Untuk kelas 8A materi aljabar dasar"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    />
                  </div>

                  {/* Unified Global Settings Card for Point & Timer */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-pink-900/20 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-extrabold text-white">
                        Pengaturan Serentak Kuis (Satu Tempat)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Poin Per Soal */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-yellow-400" />
                          Nilai Poin Per Soal
                        </label>
                        <select
                          value={globalPoints}
                          onChange={(e) => handleGlobalPointsChange(parseInt(e.target.value, 10))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500 font-bold cursor-pointer"
                        >
                          {POINT_PRESETS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Berlaku flat untuk semua soal di paket ini.
                        </p>
                      </div>

                      {/* Timer Per Soal */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          Durasi Waktu / Timer
                        </label>
                        <select
                          value={globalDuration}
                          onChange={(e) => handleGlobalDurationChange(parseInt(e.target.value, 10))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold cursor-pointer"
                        >
                          {DURATION_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              ⏱️ {d} Detik per Soal
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Durasi menjawab serentak untuk semua siswa.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Question List in Form */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        Daftar Pertanyaan ({questions.length})
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/50 hover:bg-purple-600 text-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Soal
                      </button>
                    </div>

                    {questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4 relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-300 font-extrabold flex items-center justify-center text-sm">
                              #{qIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              Pertanyaan {qIdx + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors flex items-center gap-1 text-xs"
                            title="Hapus Soal Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus</span>
                          </button>
                        </div>

                        {/* Question Text */}
                        <div>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                            placeholder={`Tulis pertanyaan soal ke-${qIdx + 1}...`}
                            required
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                          />
                        </div>

                        {/* 4 Options */}
                        <div>
                          <p className="text-xs text-slate-400 mb-2 font-semibold">
                            Pilihan Jawaban (Pilih jawaban yang BENAR):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { letter: 'A', bg: 'border-rose-500/40 focus-within:border-rose-400' },
                              { letter: 'B', bg: 'border-blue-500/40 focus-within:border-blue-400' },
                              { letter: 'C', bg: 'border-amber-500/40 focus-within:border-amber-400' },
                              { letter: 'D', bg: 'border-emerald-500/40 focus-within:border-emerald-400' }
                            ].map((optConfig, optIdx) => (
                              <div
                                key={optIdx}
                                onClick={() => handleCorrectSelect(qIdx, optIdx)}
                                className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border transition-all cursor-pointer ${
                                  q.correctIndex === optIdx
                                    ? 'border-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-400'
                                    : optConfig.bg
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                    q.correctIndex === optIdx
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {optConfig.letter}
                                </div>

                                <input
                                  type="text"
                                  value={q.options[optIdx]}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleOptionChange(qIdx, optIdx, e.target.value);
                                  }}
                                  placeholder={`Opsi ${optConfig.letter}`}
                                  required
                                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-600 font-medium"
                                />

                                {q.correctIndex === optIdx && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sticky / Pinned Footer */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 backdrop-blur shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-lg shadow-pink-500/20 cursor-pointer active:scale-95 transition-all"
                  >
                    Simpan Kuis
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Preview Bank Soal */}
        {previewQuiz && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 shrink-0 bg-slate-900/95 backdrop-blur">
                <div>
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">
                    👁️ Preview Bank Soal
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{previewQuiz.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{previewQuiz.description || 'Tanpa deskripsi'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewQuiz(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Questions list */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {previewQuiz.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-purple-400">
                        Soal #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 text-[11px] font-bold">
                          🎯 {(q.points || 1000).toLocaleString()} Pts
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[11px] font-bold">
                          ⏳ {q.durationSeconds || 20}s
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-white text-sm mb-3">{q.question}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </span>
                            {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-4 sm:p-5 border-t border-slate-800 shrink-0 bg-slate-900/95 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setPreviewQuiz(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
