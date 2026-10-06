import fs from 'fs';
import path from 'path';
import { Quiz } from '../types/quiz';

const DATA_FILE = path.join(process.cwd(), 'data', 'quizzes.json');

const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-seru-1',
    title: 'Kuis Cerdas Ceria & Seru 🌟',
    description: 'Kuis pembuka kelas yang seru dan menantang untuk menguji ketangkasan berpikir!',
    teacherEmail: 'guru@sekolah.sch.id',
    teacherName: 'Pak Guru Ceria',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-1',
        question: 'Planet apakah yang paling dekat dengan Matahari di tata surya kita?',
        options: ['Venus', 'Merkurius', 'Mars', 'Bumi'],
        correctIndex: 1, // Merkurius
        durationSeconds: 20
      },
      {
        id: 'q-2',
        question: 'Ibu kota negara Indonesia yang baru di Kalimantan Timur adalah...?',
        options: ['Nusantara (IKN)', 'Balikpapan', 'Samarinda', 'Banjarmasin'],
        correctIndex: 0, // Nusantara
        durationSeconds: 20
      },
      {
        id: 'q-3',
        question: 'Hewan mamalia terbesar di dunia saat ini adalah...?',
        options: ['Gajah Afrika', 'Hiu Paus', 'Paus Biru', 'Jerapah'],
        correctIndex: 2, // Paus Biru
        durationSeconds: 15
      },
      {
        id: 'q-4',
        question: 'Gas apa yang paling banyak dihirup manusia saat bernapas secara alami di bumi?',
        options: ['Oksigen murni', 'Nitrogen', 'Karbon Dioksida', 'Helium'],
        correctIndex: 1, // Nitrogen (sekitar 78% udara)
        durationSeconds: 20
      }
    ]
  }
];

export function getQuizzes(): Quiz[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_QUIZZES, null, 2), 'utf-8');
      return INITIAL_QUIZZES;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading quizzes.json:', err);
    return INITIAL_QUIZZES;
  }
}

export function getQuizById(id: string): Quiz | undefined {
  const quizzes = getQuizzes();
  return quizzes.find(q => q.id === id);
}

export function saveQuiz(quiz: Quiz): Quiz {
  const quizzes = getQuizzes();
  const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
  if (existingIndex >= 0) {
    quizzes[existingIndex] = quiz;
  } else {
    quizzes.unshift(quiz);
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');
  return quiz;
}

export function deleteQuiz(id: string): boolean {
  let quizzes = getQuizzes();
  quizzes = quizzes.filter(q => q.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');
  return true;
}
