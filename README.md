# Duo for Everything

A **fully offline, on-device** Duolingo-style micro-learning app for any topic. Powered by Ollama + local LLMs.

![Duo for Everything](public/favicon.svg)

## How It Works

1. Type **any topic** you want to learn (e.g., "Advanced Git Commands", "Baking Science", "Ancient Rome")
2. The app sends your topic to a **local AI model** running via **Ollama** on your machine
3. The model generates a 10-question multiple-choice quiz
4. Answer questions, earn XP, build your streak, and level up — **all offline**

## Prerequisites

- [Ollama](https://ollama.com) installed and running on your machine
- A local LLM model (the app pulls **llama3.2:1b** automatically, or you can use any Ollama-compatible model)

## Setup

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows - download from https://ollama.com
```

### 2. Start Ollama

```bash
ollama serve
```

### 3. Launch the App

```bash
npm install
npm run dev
```

### 4. Connect to local model

Open the app in your browser (default: `http://localhost:5173`). Click **"Setup local model"** to pull the `llama3.2:1b` model (~650MB). This only needs to happen once.

### 5. Generate your first quiz!

Type a topic, hit "Generate Quiz", and start learning!

## Project Structure

```
src/
  components/
    Dashboard.tsx      # Topic input & model setup
    QuizEngine.tsx     # Quiz UI with questions/answers
    TopBar.tsx         # Streak, hearts, XP bar
    StreakCounter.tsx  # Daily streak fire icon
    HeartsDisplay.tsx  # Lives system
    XPProgressBar.tsx  # XP & level progress
    RefillHearts.tsx   # Hearts refill screen
  lib/
    ollama.ts          # Local AI controller (Ollama API)
  store/
    gameStore.ts       # Zustand state (gamification + persistence)
  types/
    index.ts           # TypeScript type definitions
  App.tsx              # Root component with view routing
```

## Architecture

### On-Device AI

The app uses **Ollama** as the local inference engine. The `ollama.ts` module handles:
- Checking if Ollama is available
- Listing and pulling models
- Sending structured prompts to generate quizzes
- Parsing the JSON response into quiz format

The prompt is carefully engineered to force the local model to output clean, parseable JSON with a strict schema.

### Gamification (Persisted via LocalStorage)

| Feature | Details |
|---------|---------|
| **Hearts** | Start with 5. Lose 1 per wrong answer. At 0, locked to refill screen |
| **XP** | +10 per correct answer. 100 XP per level |
| **Streak** | Tracks consecutive daily activity with a fire icon |
| **Level-Up** | Confetti animation on level up |

### Tech Stack

- **Vite + React + TypeScript** — Fast dev and type-safe UI
- **TailwindCSS v4** — Duolingo-inspired styling
- **Zustand** — Lightweight state management with persistence
- **Framer Motion** — Smooth animations and transitions
- **Ollama** — Local LLM inference

## Offline Usage

Once the model is downloaded, the entire app works offline. No internet connection or API keys needed. Your data (XP, hearts, streak) is saved in your browser's LocalStorage.

## Customizing the Model

To use a different Ollama model, edit `src/lib/ollama.ts`:

```typescript
const DEFAULT_MODEL = 'llama3.2:1b'; // Change to any model you have
```

Larger models (like `llama3.1:8b`, `phi4`, `mistral`) produce better quizzes but are slower on CPU.
