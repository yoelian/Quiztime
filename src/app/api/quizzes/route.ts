import { NextResponse } from 'next/server';
import { getQuizzes, saveQuiz } from '@/lib/quizStore';
import { Quiz } from '@/types/quiz';

export async function GET() {
  try {
    const quizzes = getQuizzes();
    return NextResponse.json({ success: true, quizzes });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newQuiz: Quiz = {
      id: body.id || `quiz-${Date.now()}`,
      title: body.title || 'Kuis Tanpa Judul',
      description: body.description || '',
      teacherEmail: body.teacherEmail || 'guru@sekolah.sch.id',
      teacherName: body.teacherName || 'Guru',
      createdAt: new Date().toISOString(),
      questions: body.questions || []
    };
    const saved = saveQuiz(newQuiz);
    return NextResponse.json({ success: true, quiz: saved });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
