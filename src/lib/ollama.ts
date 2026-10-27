import type { Question, Quiz } from '../types';

const OLLAMA_BASE = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2:1b';
const PULL_TIMEOUT = 300_000;
const GENERATE_TIMEOUT = 120_000;

export async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels(): Promise<string[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Failed to list models: ${res.statusText}`);
  const data = await res.json();
  return (data.models ?? []).map((m: { name: string }) => m.name);
}

export async function pullModel(model: string = DEFAULT_MODEL): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false }),
      signal: AbortSignal.timeout(PULL_TIMEOUT),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error(`Download took longer than ${PULL_TIMEOUT / 60_000} minutes. Run "ollama pull ${model}" in a terminal instead.`);
    }
    throw new Error('Could not reach Ollama. Make sure it is running (ollama serve).');
  }
  if (!res.ok) throw new Error(`Failed to pull model: ${await describeFailure(res)}`);
}

// Ollama reports failures as `{ "error": "..." }` (e.g. "model 'x' not found"),
// which is far more useful than the bare HTTP status text.
async function describeFailure(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === 'object') {
      const { error } = data as { error?: unknown };
      if (typeof error === 'string' && error.trim()) return error.trim();
    }
  } catch { /* body wasn't JSON */ }
  return res.statusText || `HTTP ${res.status}`;
}

function buildQuizPrompt(topic: string): string {
  // A topic like `The "Big Bang" theory` would otherwise break the JSON
  // example below, and small models copy that broken JSON verbatim.
  const quotedTopic = JSON.stringify(topic);
  return `You are a quiz generator. Generate a 10-question multiple-choice quiz about: ${quotedTopic}.

Return ONLY valid JSON with NO markdown formatting, NO code blocks, and NO extra text. The JSON must match this exact structure:
{
  "topic": ${quotedTopic},
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation why this is correct."
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- correctAnswer must be the 0-based index of the correct option (0, 1, 2, or 3)
- Questions should range from easy to hard
- Explanations should be 1-2 sentences
- Output ONLY the JSON, nothing else before or after`;
}

export async function generateQuiz(topic: string, model: string = DEFAULT_MODEL): Promise<string> {
  const prompt = buildQuizPrompt(topic);
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        // Ollama ignores top-level sampling params; they must go in `options`.
        options: {
          temperature: 0.7,
          num_predict: 4096,
        },
      }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error(`Ollama took longer than ${GENERATE_TIMEOUT / 1000}s to respond. Try a shorter topic or a smaller model.`);
    }
    throw new Error('Could not reach Ollama. Make sure it is running (ollama serve).');
  }
  if (!res.ok) throw new Error(`Ollama generate failed: ${await describeFailure(res)}`);
  const data = await res.json();
  return data.response ?? '';
}

// Small models don't always follow the 0-based index rule: besides 2 they
// emit "2", a letter ("C", "c)") or the text of the correct option itself.
function resolveCorrectAnswer(raw: unknown, options: string[]): number | null {
  if (typeof raw === 'number' || (typeof raw === 'string' && /^\s*\d+\s*$/.test(raw))) {
    const idx = Number(raw);
    return Number.isInteger(idx) && idx >= 0 && idx < options.length ? idx : null;
  }
  if (typeof raw !== 'string') return null;
  const answer = raw.trim();
  const letter = answer.match(/^([A-Da-d])[).:]?$/);
  if (letter) return letter[1].toUpperCase().charCodeAt(0) - 65;
  const idx = options.findIndex((o) => o.toLowerCase() === answer.toLowerCase());
  return idx >= 0 ? idx : null;
}

function normalizeQuestion(raw: unknown): Omit<Question, 'id'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Record<string, unknown>;
  if (typeof q.question !== 'string' || !q.question.trim()) return null;
  if (!Array.isArray(q.options) || q.options.length !== 4) return null;
  const options = q.options.map((o) => (typeof o === 'string' || typeof o === 'number' ? String(o).trim() : ''));
  if (options.some((o) => !o)) return null;
  const correctAnswer = resolveCorrectAnswer(q.correctAnswer, options);
  if (correctAnswer === null) return null;
  return {
    question: q.question.trim(),
    options,
    correctAnswer,
    explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
  };
}

/**
 * Extracts and validates a quiz from raw model output. Malformed questions
 * (wrong option count, out-of-range answer index, missing text) are dropped
 * so they can't break the quiz UI. Returns null if nothing usable remains.
 */
export function parseQuizResponse(text: string): Quiz | null {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.questions)) return null;
  const questions: Question[] = obj.questions
    .map(normalizeQuestion)
    .filter((q): q is Omit<Question, 'id'> => q !== null)
    .map((q, i) => ({ id: i + 1, ...q }));
  if (questions.length === 0) return null;
  return {
    topic: typeof obj.topic === 'string' ? obj.topic : '',
    questions,
  };
}
