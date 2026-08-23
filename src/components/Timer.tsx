import { type TimerProps } from "../types/Timer.ts";
import { motion } from "framer-motion"
export default function Timer({
    seconds,
    maxSeconds = 30,
    enabled,
}:TimerProps){
    if(!enabled)return null

    const percentage = (seconds/maxSeconds)*100

    const barColor = percentage>60?'bg-green-500':
                     percentage>30?'bg-yellow-500':
                                    'bg-red-500'

    const pulse = seconds<=10

    return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-duo-text-light">
          Time Left
        </span>

        <span
          className={`font-bold text-lg ${
            pulse ? 'text-red-500 animate-pulse' : 'text-duo-text'
          }`}
        >
          {seconds}s
        </span>
      </div>

      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${barColor} ${
            pulse ? 'animate-pulse' : ''
          }`}
          animate={{
            width: `${percentage}%`,
          }}
          transition={{
            duration: 0.25,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  );

}