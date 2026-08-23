import { create } from 'zustand';
import type { Question, ViewState } from '../types';
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toISOString().split('T')[0] === y.toISOString().split('T')[0];
}

const STORAGE_KEY = 'duo_game_state';

interface GameStore {
  currentTopic: string;
  currentQuestionIndex: number;
  questions: Question[];
  hearts: number;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  view: ViewState;
  isGenerating: boolean;
  quizResult: 'idle' | 'correct' | 'incorrect';
  selectedAnswer: number | null;
  showConfetti: boolean;
  isMuted: boolean;
  isTimed:boolean;
  timeLeft:number;

  setTimeLeft:(updater: number | ((prev: number) => number))=>void;
  setView: (view: ViewState) => void;
  setTopic: (topic: string) => void;
  setGenerating: (v: boolean) => void;
  setQuestions: (q: Question[]) => void;
  answerQuestion: (selectedIndex: number) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
  loadState: () => void;
  refillHearts: () => void;
  toggleMute:()=>void
  toggleTimer:()=>void
}

function saveToStorage(state: Partial<GameStore>) {
  try {
    const toSave: Record<string, unknown> = {};
    const keys: (keyof GameStore)[] = [
      'xp', 'level', 'streak', 'lastActiveDate', 'hearts', 'isMuted', 'isTimed'
    ];
    for (const k of keys) {
      toSave[k] = (state as any)[k];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* noop */ }
}

function loadFromStorage(): Partial<GameStore> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const XP_PER_QUESTION = 10;
const LEVEL_UP_XP = 100;
const FAST_ANSWER_XP_BONUS = 5;
const FAST_ANSWER_THRESHOLD_SECONDS = 10;
const TIMER_DURATION_SECONDS = 30;

export const useGameStore = create<GameStore>((set, get) => ({
  currentTopic: '',
  currentQuestionIndex: 0,
  questions: [],
  hearts: 5,
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  view: 'dashboard',
  isGenerating: false,
  quizResult: 'idle',
  selectedAnswer: null,
  showConfetti: false,
  isMuted: JSON.parse(localStorage.getItem('isMuted')??'false'),
  isTimed: JSON.parse(localStorage.getItem('isTimed')??'false'),
  timeLeft:30,

  setTimeLeft: (updater: number | ((prev: number) => number)) =>
  set((state) => ({
    timeLeft: typeof updater === 'function' ? updater(state.timeLeft) : updater,
  })),

  setView: (view) => set({ view }),

  setTopic: (topic) => set({ currentTopic: topic }),

  setGenerating: (v) => set({ isGenerating: v }),

  setQuestions: (questions) => set({ questions, currentQuestionIndex: 0, quizResult: 'idle', selectedAnswer: null, timeLeft:TIMER_DURATION_SECONDS }),

  answerQuestion: (selectedIndex) => {
    const state = get();
    const q = state.questions[state.currentQuestionIndex];
    let newHearts = state.hearts;
    if (!q) return;
    if (state.isTimed && state.timeLeft <= 0) {
      const newHearts = Math.max(0, state.hearts - 1);
      const nextState: Partial<GameStore> = {
        quizResult: 'incorrect',
        selectedAnswer: null, 
        hearts: newHearts,
      };
      if (newHearts === 0) nextState.view = 'refill';
      set(nextState as GameStore);
      saveToStorage(nextState);
      return;
    }

    const correct = selectedIndex === q.correctAnswer;
    const today = getToday();

    let newStreak = state.streak;
    
    let newXp = state.xp;
    let newLevel = state.level;
    let newLastDate = state.lastActiveDate;

    if (correct) {
      if (state.isTimed && state.timeLeft >= TIMER_DURATION_SECONDS - FAST_ANSWER_THRESHOLD_SECONDS) {
        newXp += FAST_ANSWER_XP_BONUS;
      }
      newXp += XP_PER_QUESTION;
      if (newXp >= newLevel * LEVEL_UP_XP) {
        newLevel++;
        set({ showConfetti: true });
        setTimeout(() => {
          const s = get();
          if (s.showConfetti) set({ showConfetti: false });
        }, 3000);
      }
      if (state.lastActiveDate === today || state.lastActiveDate === '') {
        newStreak = state.lastActiveDate === today ? state.streak : 1;
      } else if (isYesterday(state.lastActiveDate)) {
        newStreak = state.streak + 1;
      } else {
        newStreak = 1;
      }
      newLastDate = today;
    } else {
      newHearts = Math.max(0, newHearts - 1);
    }

    const nextState: Partial<GameStore> = {
      quizResult: correct ? 'correct' : 'incorrect',
      selectedAnswer: selectedIndex,
      hearts: newHearts,
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: newLastDate,
    };

    if (newHearts === 0) {
      nextState.view = 'refill';
    }

    set(nextState as GameStore);
    saveToStorage(nextState);
  },

  nextQuestion: () => {
    const state = get();
    const nextIdx = state.currentQuestionIndex + 1;
    if (nextIdx >= state.questions.length) {
      set({ view: 'dashboard', questions: [], currentQuestionIndex: 0, quizResult: 'idle', selectedAnswer: null });
    } else {
      set({ currentQuestionIndex: nextIdx, quizResult: 'idle', selectedAnswer: null,timeLeft:30 });
    }
  },

  resetQuiz: () => {
    set({
      currentTopic: '',
      questions: [],
      currentQuestionIndex: 0,
      view: 'dashboard',
      isGenerating: false,
      quizResult: 'idle',
      selectedAnswer: null,
      timeLeft:TIMER_DURATION_SECONDS
    });
  },

  loadState: () => {
    const saved = loadFromStorage();
    if (saved) {
      const today = getToday();
      let { streak, lastActiveDate } = saved as { streak: number; lastActiveDate: string };
      if (lastActiveDate && lastActiveDate !== today && !isYesterday(lastActiveDate)) {
        streak = 0;
      }
      set({
        hearts: (saved as any).hearts ?? 5,
        xp: (saved as any).xp ?? 0,
        level: (saved as any).level ?? 1,
        streak,
        lastActiveDate: lastActiveDate || '',
      });
    }
  },

  refillHearts: () => {
    set({ hearts: 5, view: 'dashboard' });
    saveToStorage({ hearts: 5 });
  },

  toggleMute:()=>set((state)=>{
    const next = !state.isMuted;
    localStorage.setItem('isMuted',JSON.stringify(next));
    return {isMuted:next};
  }),

  toggleTimer:()=>set((state)=>{
    const next = !state.isTimed;
    localStorage.setItem('isTimed',JSON.stringify(next));
    return {isTimed:next};
  })
}));
