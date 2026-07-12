import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function StreakCounter() {
  const streak = useGameStore((s) => s.streak);

  return (
    <div className="flex items-center gap-1 bg-duo-orange/10 rounded-xl px-3 py-1.5 border-2 border-duo-orange/30">
      <motion.div
        key={streak}
        initial={{ scale: 1.5, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <span className="text-lg">🔥</span>
      </motion.div>
      <span className="font-bold text-duo-orange text-sm">{streak}</span>
    </div>
  );
}
