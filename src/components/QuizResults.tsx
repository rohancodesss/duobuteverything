import { motion } from 'framer-motion';
import { FiAward, FiArrowRight } from 'react-icons/fi';
import { useGameStore } from '../store/gameStore';
import TopBar from './TopBar';

export default function QuizResults() {
  const topic = useGameStore((s) => s.currentTopic);
  const total = useGameStore((s) => s.questions.length);
  const correctCount = useGameStore((s) => s.correctCount);
  const quizXpEarned = useGameStore((s) => s.quizXpEarned);
  const resetQuiz = useGameStore((s) => s.resetQuiz);

  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const message =
    percent === 100 ? 'Perfect score!' : percent >= 70 ? 'Great job!' : percent >= 40 ? 'Nice effort!' : 'Keep practicing!';

  return (
    <div className="min-h-screen bg-duo-bg flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-duo-white rounded-3xl border-2 border-duo-border p-8 max-w-sm w-full text-center shadow-sm"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-duo-green/10 mb-6">
            <FiAward className="text-5xl text-duo-green" aria-hidden="true" />
          </div>

          <h2 className="text-2xl font-black text-duo-text mb-1">{message}</h2>
          {topic && <p className="text-duo-text-light font-medium mb-6">{topic}</p>}

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-2xl border-2 border-duo-border p-3">
              <p className="text-2xl font-black text-duo-text">
                {correctCount} / {total}
              </p>
              <p className="text-xs font-bold text-duo-text-light">CORRECT</p>
            </div>
            <div className="rounded-2xl border-2 border-duo-border p-3">
              <p className="text-2xl font-black text-duo-green">+{quizXpEarned}</p>
              <p className="text-xs font-bold text-duo-text-light">XP EARNED</p>
            </div>
          </div>

          {/* Focused on mount so Enter (used to advance during the quiz) continues here too. */}
          <button
            autoFocus
            onClick={resetQuiz}
            className="w-full bg-duo-green hover:bg-duo-green-dark text-white font-bold text-lg py-4 rounded-2xl border-b-4 border-duo-green-dark hover:border-duo-green-dark/80 active:border-b-2 active:mt-[18px] transition-all flex items-center justify-center gap-2"
          >
            Back to Dashboard <FiArrowRight />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
