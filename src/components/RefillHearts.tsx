import { motion } from 'framer-motion';
import { FiHeart, FiRotateCcw } from 'react-icons/fi';
import { useGameStore } from '../store/gameStore';

export default function RefillHearts() {
  const refillHearts = useGameStore((s) => s.refillHearts);

  return (
    <div className="min-h-screen bg-duo-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-duo-white rounded-3xl border-2 border-duo-border p-8 max-w-sm w-full text-center shadow-sm"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-50 mb-6"
        >
          <FiHeart className="text-5xl text-duo-red" style={{ fill: '#FF4B4B' }} />
        </motion.div>

        <h2 className="text-2xl font-black text-duo-text mb-2">No Hearts Left!</h2>
        <p className="text-duo-text-light font-medium mb-8">
          You ran out of hearts. Practice more to earn them back!
        </p>

        <button
          onClick={refillHearts}
          className="w-full bg-duo-green hover:bg-duo-green-dark text-white font-bold text-lg py-4 rounded-2xl border-b-4 border-duo-green-dark hover:border-duo-green-dark/80 active:border-b-2 active:mt-[18px] transition-all flex items-center justify-center gap-2"
        >
          <FiRotateCcw /> Refill Hearts (5)
        </button>

        <p className="mt-4 text-xs text-duo-text-light">
          Hearts refill to full. Keep practicing to improve!
        </p>
      </motion.div>
    </div>
  );
}
