export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, 3
  durationSeconds: number; // e.g. 20
  points?: number; // e.g. 1000 (standard), 2000 (double points), etc.
  image?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  teacherEmail: string;
  teacherName: string;
  createdAt: string;
  questions: Question[];
}

export interface Participant {
  id: string; // socket.id or user id
  name: string;
  email?: string;
  avatar: string;
  score: number;
  streak: number;
  hasAnsweredCurrent: boolean;
  selectedOption?: number;
  lastPointsAwarded?: number;
  isLastCorrect?: boolean;
  previousRank?: number;
  currentRank?: number;
}

export type RoomStatus =
  | 'LOBBY'
  | 'PREVIEW'
  | 'ANSWERING'
  | 'REVEAL'
  | 'LEADERBOARD'
  | 'FINISHED';

export interface RoomState {
  code: string;
  quizId: string;
  quizTitle: string;
  teacherSocketId: string;
  teacherName: string;
  teacherEmail: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  previewSecondsLeft: number;
  timeRemaining: number;
  durationSeconds: number;
  participants: Participant[];
  currentQuestion?: {
    id: string;
    question: string;
    options: [string, string, string, string];
    durationSeconds: number;
    points?: number;
    // Note: correctIndex is only revealed when status === 'REVEAL'
    correctIndex?: number;
  };
  answerDistribution: [number, number, number, number]; // counts for [A, B, C, D]
}
