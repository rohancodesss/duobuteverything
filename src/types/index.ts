export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  topic: string;
  questions: Question[];
}

export type ViewState = 'dashboard' | 'quiz' | 'refill';

export interface GameState {
  currentTopic: string;
  currentQuestionIndex: number;
  questions: Question[];
  hearts: number;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  view: ViewState;
  isGenerating: boolean;
  quizResult: 'idle' | 'correct' | 'incorrect';
  selectedAnswer: number | null;
  showConfetti: boolean;
}
