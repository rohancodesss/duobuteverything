import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiAlertCircle, FiCheckCircle, FiDownload } from 'react-icons/fi';
import { useGameStore } from '../store/gameStore';
import { checkOllama, listModels, pullModel, generateQuiz, parseQuizResponse } from '../lib/ollama';

export default function Dashboard() {
  const [topicInput, setTopicInput] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [statusMsg, setStatusMsg] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const setTopic = useGameStore((s) => s.setTopic);
  const setQuestions = useGameStore((s) => s.setQuestions);
  const setView = useGameStore((s) => s.setView);
  const setGenerating = useGameStore((s) => s.setGenerating);
  const isGenerating = useGameStore((s) => s.isGenerating);

  const checkConnection = async () => {
    setOllamaStatus('checking');
    const ok = await checkOllama();
    setOllamaStatus(ok ? 'online' : 'offline');
  };

  const handleStartSetup = async () => {
    setShowSetup(true);
    setStatusMsg('Checking Ollama...');
    const ok = await checkOllama();
    if (!ok) {
      setStatusMsg('Ollama is not running. Please start Ollama first (ollama serve).');
      return;
    }
    setOllamaStatus('online');
    setStatusMsg('Ollama is running. Checking for llama3.2:1b...');
    const models = await listModels();
    const hasModel = models.some((m: string) => m.startsWith('llama3.2:1b'));
    if (!hasModel) {
      setStatusMsg('Downloading llama3.2:1b (~650MB)... This may take a few minutes.');
      try {
        await pullModel();
        setStatusMsg('Model downloaded successfully!');
      } catch {
        setStatusMsg('Failed to download model. Check Ollama logs.');
        return;
      }
    } else {
      setStatusMsg('Model already cached. Ready!');
    }
  };

  const handleGenerate = async () => {
    const topic = topicInput.trim();
    if (!topic) return;

    setTopic(topic);
    setGenerating(true);
    setStatusMsg(`Generating quiz about "${topic}"...`);

    try {
      const raw = await generateQuiz(topic);
      const parsed = parseQuizResponse(raw);
      if (!parsed || !parsed.questions || parsed.questions.length === 0) {
        setStatusMsg('Failed to parse quiz. The model returned invalid JSON. Try again.');
        setGenerating(false);
        return;
      }
      setQuestions(parsed.questions);
      setGenerating(false);
      setStatusMsg('');
      setView('quiz');
    } catch (err) {
      setStatusMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        >
          <FiZap className="text-6xl text-duo-green" />
        </motion.div>
        <p className="text-duo-text font-semibold text-lg">{statusMsg || 'Generating quiz...'}</p>
        <p className="text-duo-text-light text-sm">The local AI model is crafting your questions</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-duo-green/10 mb-4">
          <FiZap className="text-4xl text-duo-green" />
        </div>
        <h1 className="text-3xl font-black text-duo-text mb-2">
          Duo for Everything
        </h1>
        <p className="text-duo-text-light font-medium">
          Type any topic. Learn anything. All on-device.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="bg-duo-white rounded-2xl border-2 border-duo-border p-6 shadow-sm mb-4"
      >
        <label className="block text-sm font-bold text-duo-text mb-2">
          WHAT DO YOU WANT TO LEARN?
        </label>
        <input
          type="text"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g. Advanced Git, Baking Science, Roman History..."
          className="w-full px-4 py-3 text-lg border-2 border-duo-border rounded-xl focus:border-duo-green focus:outline-none transition-colors bg-gray-50"
        />
        <button
          onClick={handleGenerate}
          disabled={!topicInput.trim() || ollamaStatus === 'offline'}
          className="w-full mt-4 bg-duo-green hover:bg-duo-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl border-b-4 border-duo-green-dark hover:border-duo-green-dark/80 active:border-b-2 active:mt-[18px] transition-all"
        >
          GENERATE QUIZ
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        className="bg-duo-white rounded-2xl border-2 border-duo-border p-4 shadow-sm"
      >
        <button
          onClick={checkConnection}
          className="flex items-center gap-2 text-sm font-semibold text-duo-text-light hover:text-duo-text mb-3"
        >
          {ollamaStatus === 'checking' && <FiAlertCircle className="animate-pulse text-duo-yellow" />}
          {ollamaStatus === 'online' && <FiCheckCircle className="text-duo-green" />}
          {ollamaStatus === 'offline' && <FiAlertCircle className="text-duo-red" />}
          Ollama: {ollamaStatus === 'checking' ? 'Checking...' : ollamaStatus === 'online' ? 'Connected' : 'Offline'}
        </button>

        {ollamaStatus === 'offline' && (
          <div className="text-sm text-duo-red font-medium mb-2">
            Start Ollama with <code className="bg-red-50 px-1 rounded">ollama serve</code>
          </div>
        )}

        <button
          onClick={handleStartSetup}
          className="flex items-center gap-2 text-sm font-semibold text-duo-blue hover:text-duo-blue/80"
        >
          <FiDownload />
          Setup local model (pull llama3.2:1b)
        </button>

        {statusMsg && (
          <p className="mt-2 text-sm text-duo-text-light bg-gray-50 rounded-lg p-2">{statusMsg}</p>
        )}
      </motion.div>
    </div>
  );
}
