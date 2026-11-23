import type { Question, Quiz } from '../types';

const OLLAMA_BASE = 'http://localhost:11434';
export const DEFAULT_MODEL = 'llama3.2:1b';
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
  if (!res.ok) {
    const reason = await describeFailure(res);
    // A fresh Ollama install has no models yet; point at the in-app fix
    // instead of only echoing "model 'llama3.2:1b' not found".
    if (res.status === 404 || /not found/i.test(reason)) {
      throw new Error(`Model "${model}" isn't installed. Click "Setup local model" below to download it, then try again.`);
    }
    throw new Error(`Ollama generate failed: ${reason}`);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error('Ollama sent back an unreadable response. Try again.');
  }
  const response = data && typeof data === 'object' ? (data as { response?: unknown }).response : undefined;
  return typeof response === 'string' ? response : '';
}

// A letter label in front of option text: "A) Paris", "b. Rome", and the
// parenthesized "(C) Berlin" some models use.
const OPTION_LABEL = /^(?:\(([A-Da-d])\)|([A-Da-d])\s*[).:])\s+(.+)$/;

// Small models don't always follow the 0-based index rule: besides 2 they
// emit "2", a letter ("C", "c)", "(C)"), the text of the correct option itself, or
// both ("C) Paris"). Some also wrap the answer in a one-item array ([2],
// ["C"]); unwrap that, but a list of several answers is ambiguous.
function resolveCorrectAnswer(raw: unknown, options: string[]): number | null {
  if (Array.isArray(raw)) {
    if (raw.length !== 1 || Array.isArray(raw[0])) return null;
    raw = raw[0];
  }
  if (typeof raw === 'number' || (typeof raw === 'string' && /^\s*\d+\s*$/.test(raw))) {
    const idx = Number(raw);
    if (Number.isInteger(idx) && idx >= 0 && idx < options.length) return idx;
    // Math quizzes have numeric options, and models often give the answer's
    // value instead of its index: 8 for ["2", "4", "6", "8"]. An out-of-range
    // index can't be meant as one, so fall back to matching the option text.
    const byValue = options.findIndex((o) => o === String(raw).trim());
    return byValue >= 0 ? byValue : null;
  }
  if (typeof raw !== 'string') return null;
  const answer = raw.trim();
  // Check the option text before reading a letter: when the options are
  // letters themselves (notes ["C", "G", "E", "B"], grades), "B" names that
  // option, not the second position.
  const idx = options.findIndex((o) => o.toLowerCase() === answer.toLowerCase());
  if (idx >= 0) return idx;
  // Models also spell the letter out: "Option C", "Answer: b", "Choice (D)".
  const bareLetter = answer.replace(/^(?:option|answer|choice)\s*[:#-]?\s*/i, '');
  const letter = bareLetter.match(/^(?:\(([A-Da-d])\)|([A-Da-d])[).:]?)$/);
  if (letter) return (letter[1] ?? letter[2]).toUpperCase().charCodeAt(0) - 65;
  // Only trust a "letter + text" answer when both halves agree, so a
  // contradictory "B) Paris" (Paris being C) drops the question instead.
  const labelled = answer.match(OPTION_LABEL);
  if (labelled) {
    const letterIdx = (labelled[1] ?? labelled[2]).toUpperCase().charCodeAt(0) - 65;
    if (options[letterIdx]?.toLowerCase() === labelled[3].trim().toLowerCase()) return letterIdx;
  }
  return null;
}

// Models often label options themselves ("A) Paris", "b. Rome"), which the UI
// then shows next to its own A-D badge. Strip the labels only when every
// option has one, in order, so real text like "A. Lincoln" alone is kept.
function stripOptionLabels(options: string[]): string[] {
  const labelled = options.map((o, i) => {
    const m = o.match(OPTION_LABEL);
    return m && (m[1] ?? m[2]).toUpperCase().charCodeAt(0) - 65 === i ? m[3].trim() : null;
  });
  return labelled.every((o) => o !== null) ? (labelled as string[]) : options;
}

// The prompt's example uses correctAnswer 0 and small models copy it, so the
// right answer is nearly always A. Shuffle (Fisher-Yates) and move the index
// along with its option. "All/None of the above" only makes sense where the
// model put it, and "Both A and B" points at positions, so those questions
// keep their order. Letters are matched in capitals to skip ordinary "a or b".
const POSITION_DEPENDENT = [/\bof the above\b/i, /\b[A-D](?:\s*,\s*[A-D])*,?\s*(?:and|or|nor|&)\s*[A-D]\b/];

export function shuffleOptions(options: string[], correctAnswer: number): { options: string[]; correctAnswer: number } {
  if (options.some((o) => POSITION_DEPENDENT.some((re) => re.test(o)))) return { options, correctAnswer };
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => options[i]), correctAnswer: order.indexOf(correctAnswer) };
}

// Models sometimes key the options by letter instead of using an array:
// {"A": "Paris", "B": "Rome", ...}. Accept that only when the keys are
// exactly A-D (any case), and read them in A-D order.
function readOptions(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return null;
  const byLetter = new Map(Object.entries(raw).map(([k, v]) => [k.trim().toUpperCase(), v]));
  if (byLetter.size !== 4 || !['A', 'B', 'C', 'D'].every((l) => byLetter.has(l))) return null;
  return ['A', 'B', 'C', 'D'].map((l) => byLetter.get(l));
}

// Some models wrap each option in an object, e.g. {"text": "Paris"} or
// {"option": "Paris"}. Read the text out of those; anything else becomes ''
// so the question is dropped rather than showing "[object Object]".
function readOptionText(o: unknown): string {
  if (typeof o === 'string' || typeof o === 'number') return String(o).trim();
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    const { text, option, value, label } = o as Record<string, unknown>;
    const inner = [text, option, value, label].find((v) => typeof v === 'string' || typeof v === 'number');
    if (inner !== undefined) return String(inner).trim();
  }
  return '';
}

// Small models don't always reuse the exact field names from the prompt's
// example: "choices" for options, "answer" or "correct_answer" for
// correctAnswer, and so on. Take the first alias the question actually has.
const FIELD_ALIASES = {
  question: ['question', 'questionText', 'prompt', 'text'],
  options: ['options', 'choices', 'answers'],
  correctAnswer: ['correctAnswer', 'correct_answer', 'correctIndex', 'answer', 'correct'],
  explanation: ['explanation', 'reason', 'rationale'],
} as const;

function pickField(q: Record<string, unknown>, field: keyof typeof FIELD_ALIASES): unknown {
  for (const key of FIELD_ALIASES[field]) {
    if (q[key] !== undefined && q[key] !== null) return q[key];
  }
  return undefined;
}

// Models often number their questions ("1. What is...", "Q3: Which...",
// "Question 2) Who..."), which duplicates the UI's own "3 / 10" counter and
// stops the duplicate check from spotting the same question under a new number.
function stripQuestionNumber(text: string): string {
  // Require whitespace after the delimiter so "3.14 is roughly..." is kept.
  const stripped = text.replace(/^\s*(?:question\s*|q)?\d{1,2}\s*[).:-]\s+/i, '').trim();
  return stripped || text.trim();
}

function normalizeQuestion(raw: unknown): Omit<Question, 'id'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Record<string, unknown>;
  const rawQuestion = pickField(q, 'question');
  if (typeof rawQuestion !== 'string' || !rawQuestion.trim()) return null;
  const questionText = stripQuestionNumber(rawQuestion);
  const rawOptions = readOptions(pickField(q, 'options'));
  if (!rawOptions || rawOptions.length !== 4) return null;
  const options = stripOptionLabels(rawOptions.map(readOptionText));
  if (options.some((o) => !o)) return null;
  // Repeated options (e.g. "Paris" twice) make the question ambiguous: picking
  // the "other" copy of the right answer would be marked wrong.
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return null;
  const correctAnswer = resolveCorrectAnswer(pickField(q, 'correctAnswer'), options);
  if (correctAnswer === null) return null;
  const explanation = pickField(q, 'explanation');
  return {
    question: questionText.trim(),
    ...shuffleOptions(options, correctAnswer),
    explanation: typeof explanation === 'string' ? explanation.trim() : '',
  };
}

// Parses the reply as-is, else the outermost {...} or [...] in it (to skip
// code fences or chatter around the JSON). A bare array of questions has to
// be tried as an array: its first-to-last brace span is "{...},{...}".
function extractJson(text: string): unknown {
  const candidates = [text, text.match(/\{[\s\S]*\}/)?.[0], text.match(/\[[\s\S]*\]/)?.[0]];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch { /* try the repaired candidate */ }
    try {
      return JSON.parse(removeTrailingCommas(candidate));
    } catch { /* try the next candidate */ }
  }
  const salvaged = closeTruncatedJson(text);
  if (salvaged) {
    try {
      return JSON.parse(removeTrailingCommas(salvaged));
    } catch { /* nothing usable */ }
  }
  return null;
}

// When the model hits its token limit the reply stops mid-question, and the
// whole quiz used to be thrown away. Cut the text back to the last array
// element that was fully closed and append the brackets still open, so the
// questions that did finish are kept. Returns null if nothing was truncated.
function closeTruncatedJson(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start < 0) return null;
  const stack: string[] = [];
  let inString = false;
  let cut = -1;
  let openAtCut: string[] = [];
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') {
      stack.pop();
      if (stack.length === 0) return null; // the JSON closed normally
      if (ch === '}' && stack[stack.length - 1] === '[') {
        cut = i + 1;
        openAtCut = [...stack];
      }
    }
  }
  if (cut < 0) return null;
  const closers = openAtCut.reverse().map((b) => (b === '{' ? '}' : ']')).join('');
  return text.slice(start, cut) + closers;
}

// Small models often leave a trailing comma after the last option or
// question (`"D",]` / `},]`), which JSON.parse rejects outright. Commas
// inside string values are skipped so text like "a, ]" is left untouched.
function removeTrailingCommas(json: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (inString) {
      out += ch;
      if (ch === '\\') out += json[++i] ?? '';
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    if (ch === ',') {
      const rest = json.slice(i + 1).match(/^\s*([}\]])/);
      if (rest) continue;
    }
    out += ch;
  }
  return out;
}

// Models don't always call the list "questions": {"quiz": [...]},
// {"items": [...]}, or one level deeper as {"quiz": {"questions": [...]}}.
const QUESTION_LIST_KEYS = ['questions', 'quiz', 'items', 'data'];

function findQuestionList(obj: Record<string, unknown>, depth = 0): unknown[] | null {
  for (const key of QUESTION_LIST_KEYS) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    if (depth === 0 && value && typeof value === 'object') {
      const nested = findQuestionList(value as Record<string, unknown>, 1);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Extracts and validates a quiz from raw model output. Malformed questions
 * (wrong option count, out-of-range answer index, missing text) are dropped
 * so they can't break the quiz UI. Returns null if nothing usable remains.
 */
export function parseQuizResponse(text: string): Quiz | null {
  const data = extractJson(text.trim());
  if (!data || typeof data !== 'object') return null;
  // Small models sometimes skip the wrapper object and return the questions
  // array on its own.
  const obj = (Array.isArray(data) ? { questions: data } : data) as Record<string, unknown>;
  // Some replies are just one question object with no list around it; a short
  // quiz beats failing the whole generation.
  const rawQuestions = findQuestionList(obj) ?? (normalizeQuestion(obj) ? [obj] : null);
  if (!rawQuestions) return null;
  // Small models often loop and emit the same question more than once.
  const seen = new Set<string>();
  const questions: Question[] = rawQuestions
    .map(normalizeQuestion)
    .filter((q): q is Omit<Question, 'id'> => q !== null)
    .filter((q) => {
      // Ignore case, spacing and trailing punctuation, so "Capital of
      // France?" and "capital of France" count as the same question.
      const key = q.question.toLowerCase().replace(/\s+/g, ' ').replace(/[\s?.!:]+$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((q, i) => ({ id: i + 1, ...q }));
  if (questions.length === 0) return null;
  return {
    topic: typeof obj.topic === 'string' ? obj.topic : '',
    questions,
  };
}
