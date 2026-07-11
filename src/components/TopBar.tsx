import StreakCounter from './StreakCounter';
import HeartsDisplay from './HeartsDisplay';
import XPProgressBar from './XPProgressBar';

export default function TopBar() {
  return (
    <div className="w-full bg-duo-white border-b-2 border-duo-border px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
        <StreakCounter />
        <HeartsDisplay />
        <div className="flex-1 max-w-[160px]">
          <XPProgressBar />
        </div>
      </div>
    </div>
  );
}
