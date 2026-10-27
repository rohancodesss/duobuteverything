import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import Dashboard from './components/Dashboard';
import QuizEngine from './components/QuizEngine';
import RefillHearts from './components/RefillHearts';
import QuizResults from './components/QuizResults';

export default function App() {
  const view = useGameStore((s) => s.view);
  const loadState = useGameStore((s) => s.loadState);

  useEffect(() => {
    loadState();
  }, [loadState]);

  if (view === 'quiz') return <QuizEngine />;
  if (view === 'results') return <QuizResults />;
  if (view === 'refill') return <RefillHearts />;
  return <Dashboard />;
}
