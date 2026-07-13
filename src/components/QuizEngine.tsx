import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiRotateCcw, FiCheck, FiX } from 'react-icons/fi';
import { useGameStore } from '../store/gameStore';
import ConfettiExplosion from 'react-confetti-explosion';
import TopBar from './TopBar';
import { playCorrectSound, playIncorrectSound } from '../lib/sound';
import Timer from './Timer';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizEngine() {
  const questions = useGameStore((s) => s.questions);
  const currentIndex = useGameStore((s) => s.currentQuestionIndex);
  const quizResult = useGameStore((s) => s.quizResult);
  const selectedAnswer = useGameStore((s) => s.selectedAnswer);
  const showConfetti = useGameStore((s) => s.showConfetti);
  const answerQuestion = useGameStore((s) => s.answerQuestion);
  const nextQuestion = useGameStore((s) => s.nextQuestion);
  const resetQuiz = useGameStore((s) => s.resetQuiz);
  const isMuted = useGameStore((s) => s.isMuted);
  const isTimed = useGameStore((s)=>s.isTimed)
  const timeLeft = useGameStore((s)=>s.timeLeft)
  const setTimeLeft = useGameStore((s)=>s.setTimeLeft)

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const hasAnswered = quizResult !== 'idle';

  const handleAnswer = useCallback((idx: number) => {
    if (hasAnswered) return;
    const isCorrect = idx === question.correctAnswer;
    
    if (!isMuted) {
      if (isCorrect) playCorrectSound();
      else playIncorrectSound();
    }
    answerQuestion(idx);
  }, [hasAnswered, answerQuestion, question, isMuted]);
  
  useEffect(() => {
  if (!isTimed || hasAnswered) return;

  const timer = setInterval(() => {
    setTimeLeft((prev) => Math.max(0, prev - 1));
  }, 1000);

  return () => clearInterval(timer);
}, [isTimed, hasAnswered, setTimeLeft]);

  useEffect(()=>{
    if(!isTimed)return
    if(hasAnswered)return
    if(timeLeft===0){
      answerQuestion(-1)
    }
  },[timeLeft, hasAnswered, isTimed, answerQuestion])



  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!hasAnswered && question) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) handleAnswer(num - 1);
      }
      if (hasAnswered && e.key === 'Enter') nextQuestion();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasAnswered, question, handleAnswer, nextQuestion]);

  if (!question || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-duo-text font-bold text-lg">No questions loaded</p>
        <button
          onClick={resetQuiz}
          className="bg-duo-green text-white font-bold px-6 py-3 rounded-2xl border-b-4 border-duo-green-dark"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-duo-bg flex flex-col">
      <TopBar />
      
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col">
        <Timer 
        enabled={isTimed}
        seconds={timeLeft}
        />
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-duo-text-light bg-white px-2 py-1 rounded-lg border border-duo-border">
              {currentIndex + 1} / {questions.length}
            </span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-duo-green rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.h2
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="text-xl font-bold text-duo-text leading-snug"
            >
              {question.question}
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {question.options.map((option, idx) => {
                const isCorrect = idx === question.correctAnswer;
                const isSelected = idx === selectedAnswer;
                let bg = 'bg-white border-duo-border hover:border-gray-400';
                if (hasAnswered) {
                  if (isCorrect) bg = 'bg-green-50 border-duo-green';
                  else if (isSelected && !isCorrect) bg = 'bg-red-50 border-duo-red';
                  else bg = 'bg-gray-50 border-gray-200 opacity-50';
                }
                return (
                  <motion.button
                    key={`${currentIndex}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileTap={!hasAnswered ? { scale: 0.97 } : undefined}
                    onClick={() => handleAnswer(idx)}
                    disabled={hasAnswered}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all ${bg}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      hasAnswered && isCorrect
                        ? 'bg-duo-green text-white'
                        : hasAnswered && isSelected && !isCorrect
                        ? 'bg-duo-red text-white'
                        : 'bg-gray-100 text-duo-text border border-gray-300'
                    }`}>
                      {hasAnswered && isCorrect ? (
                        <FiCheck className="text-lg" />
                      ) : hasAnswered && isSelected && !isCorrect ? (
                        <FiX className="text-lg" />
                      ) : (
                        OPTION_LABELS[idx]
                      )}
                    </span>
                    <span className={`font-semibold text-sm leading-snug ${
                      hasAnswered && isCorrect
                        ? 'text-duo-green-dark'
                        : hasAnswered && isSelected && !isCorrect
                        ? 'text-duo-red'
                        : 'text-duo-text'
                    }`}>
                      {option}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className={`rounded-2xl p-4 border-2 ${
                  quizResult === 'correct'
                    ? 'bg-green-50 border-duo-green'
                    : 'bg-red-50 border-duo-red'
                }`}
              >
                {quizResult === 'correct' ? (
                  <div className="flex items-center gap-2">
                    <FiCheck className="text-duo-green text-xl shrink-0" />
                    <div>
                      <p className="font-bold text-duo-green-dark">Correct! +10 XP</p>
                      <p className="text-sm text-duo-text-light mt-1">{question.explanation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <FiX className="text-duo-red text-xl shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-duo-red">Incorrect! -1 Heart</p>
                      <p className="text-sm text-duo-text-light mt-1">{question.explanation}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              <button
                onClick={nextQuestion}
                className="w-full mt-3 bg-duo-green hover:bg-duo-green-dark text-white font-bold text-lg py-4 rounded-2xl border-b-4 border-duo-green-dark hover:border-duo-green-dark/80 active:border-b-2 active:mt-[18px] transition-all flex items-center justify-center gap-2"
              >
                {isLast ? 'See Results' : 'Next Question'}
                <FiArrowRight />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={resetQuiz}
          className="mt-4 self-center flex items-center gap-1 text-sm font-semibold text-duo-text-light hover:text-duo-text transition-colors"
        >
          <FiRotateCcw /> Quit
        </button>
      </div>

      {showConfetti && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <ConfettiExplosion
            force={0.8}
            duration={2500}
            particleCount={150}
            width={400}
          />
        </div>
      )}
    </div>
  );
}
