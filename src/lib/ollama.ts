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
  const res = await fetch(`${OLLAMA_BASE}/api/tags`);
  const data = await res.json();
  return (data.models ?? []).map((m: { name: string }) => m.name);
}

export async function pullModel(model: string = DEFAULT_MODEL): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model, stream: false }),
    signal: AbortSignal.timeout(PULL_TIMEOUT),
  });
  if (!res.ok) throw new Error(`Failed to pull model: ${res.statusText}`);
}

function buildQuizPrompt(topic: string): string {
  return `You are a quiz generator. Generate a 10-question multiple-choice quiz about: "${topic}".

Return ONLY valid JSON with NO markdown formatting, NO code blocks, and NO extra text. The JSON must match this exact structure:
{
  "topic": "${topic}",
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
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      temperature: 0.7,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(GENERATE_TIMEOUT),
  });
  if (!res.ok) throw new Error(`Ollama generate failed: ${res.statusText}`);
  const data = await res.json();
  return data.response ?? '';
}

export function parseQuizResponse(text: string): { topic: string; questions: any[] } | null {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
