import StreakCounter from './StreakCounter';
import HeartsDisplay from './HeartsDisplay';
import XPProgressBar from './XPProgressBar';
import { useGameStore } from '../store/gameStore';
import { CiVolumeHigh, CiVolumeMute} from 'react-icons/ci';


export default function TopBar() {
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  return (
    <div className="w-full bg-duo-white border-b-2 border-duo-border px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
        {
          isMuted?(
            <button onClick={toggleMute}><CiVolumeMute /></button>
          ):(
            <button onClick={toggleMute}><CiVolumeHigh /></button>
          )
        }
        <StreakCounter />
        <HeartsDisplay />
        <div className="flex-1 max-w-[160px]">
          <XPProgressBar />
        </div>
      </div>
    </div>
  );
}
