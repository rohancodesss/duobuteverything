import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const LEVEL_UP_XP = 100;

export default function XPProgressBar() {
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);

  const xpInLevel = xp - (level - 1) * LEVEL_UP_XP;
  const progress = Math.min(xpInLevel / LEVEL_UP_XP, 1);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-duo-text-light min-w-[32px] text-right">
        Lv.{level}
      </span>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
        <motion.div
          className="h-full bg-gradient-to-r from-duo-green to-duo-green-dark rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
      <span className="text-xs font-bold text-duo-green min-w-[40px]">
        {xp} XP
      </span>
    </div>
  );
}
