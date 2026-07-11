import { motion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import { useGameStore } from '../store/gameStore';

export default function HeartsDisplay() {
  const hearts = useGameStore((s) => s.hearts);
  const maxHearts = 5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxHearts }, (_, i) => (
        <motion.div
          key={i}
          initial={i >= hearts ? { scale: 1 } : false}
          animate={i >= hearts ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: (i - hearts) * 0.1 }}
        >
          <FiHeart
            className={`text-lg ${i < hearts ? 'text-duo-red fill-duo-red' : 'text-gray-300'}`}
            style={i < hearts ? { fill: '#FF4B4B' } : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}
