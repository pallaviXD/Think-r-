# Thinkr — AI Study Companion

> **Study smart. Score high.**

Thinkr is a premium AI study companion for Indian students in Class 6–10. It reads your exact textbooks (via PDF upload), answers questions with page citations, generates quizzes, analyses your marks card, and creates personalised daily study plans.

---

## Features

- **Chat with your PDFs** — Upload any textbook or notes. Ask questions in English or Hindi. Get answers with source page citations.
- **Marks card analysis** — Upload your result sheet. Thinkr OCRs it in the browser, extracts marks, shows a chart, and flags weak subjects.
- **Smart quizzes** — MCQ, short, long, and case-study questions generated from your content.
- **Voice tutor** — Speak your doubt, hear the explanation. No paid speech API — 100% browser Web Speech API.
- **Daily planner** — AI-generated study plan based on your exam dates and weak areas.
- **Report card** — Weekly/monthly progress report, downloadable as PDF.
- **Flashcards** — Auto-generated with spaced repetition (SM-2 algorithm).
- **Works offline** — PWA, installable on any phone.
- **100% private** — Files never leave your device. All PDF/OCR processing is in-browser.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Animations | Framer Motion |
| Charts | Recharts |
| Math | KaTeX |
| Icons | lucide-react |
| Database | Dexie (IndexedDB) — no server DB |
| PDF | pdf.js (text) + Tesseract.js (OCR) |
| Search | MiniSearch (BM25) |
| AI proxy | Netlify Functions (serverless) |
| Primary LLM | Groq (free tier) |
| Fallback LLM | OpenRouter (free tier) |
| Voice | Web Speech API (browser-native) |
| PWA | vite-plugin-pwa |

---

## Setup

### Prerequisites
- Node.js 20+
- A free [Groq API key](https://console.groq.com)
- A free [OpenRouter API key](https://openrouter.ai) (for fallback)

### Local development

```bash
# Clone and install
git clone <repo-url>
cd thinkr
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys

# Start dev server (Vite on port 5173)
npm run dev
```

The dev server proxies `/api/*` to Netlify functions. To test the AI proxy locally, install the [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
netlify dev   # starts Vite + functions together
```

### Build

```bash
npm run build        # production build to dist/
npm run preview      # preview production build locally
```

---

## Environment Variables

All variables below are used **only** in `netlify/functions/chat.ts`. They are **never** bundled into client code.

| Variable | Description | Required |
|----------|-------------|----------|
| `LLM_PRIMARY_BASE_URL` | Groq API base URL | Yes |
| `LLM_PRIMARY_API_KEY` | Your Groq API key | Yes |
| `LLM_PRIMARY_MODEL` | Groq model name (e.g. `llama-3.3-70b-versatile`) | Yes |
| `LLM_FALLBACK_BASE_URL` | OpenRouter API base URL | Yes |
| `LLM_FALLBACK_API_KEY` | Your OpenRouter API key | Yes |
| `LLM_FALLBACK_MODEL` | OpenRouter model (e.g. `meta-llama/llama-3.1-8b-instruct:free`) | Yes |

Set these in Netlify's dashboard under **Site settings → Environment variables** for production.

---

## Deploy to Netlify

1. Push your code to GitHub.
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import an existing project".
3. Connect your GitHub repo.
4. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add your environment variables in **Site settings → Environment variables**.
6. Click **Deploy site**.

Your site will be live in ~2 minutes at a `*.netlify.app` URL.

---

## Architecture

```
Student (browser)
    │
    ├── PDF/Image upload
    │       │
    │       ├── pdf.js → text extraction (stays in browser)
    │       └── Tesseract.js → OCR for scanned pages (stays in browser)
    │
    ├── MiniSearch BM25 → finds top 3-4 relevant chunks
    │
    ├── POST /api/chat → Netlify function (chat.ts)
    │           │
    │           ├── Try Groq (primary, fast)
    │           └── Try OpenRouter (fallback)
    │
    └── Dexie (IndexedDB) → saves all progress locally
```

**Privacy**: Only the small retrieved text chunks (not the whole PDF) go to the proxy. The proxy doesn't log message content. Files never leave the device.

---

## Project Structure

```
thinkr/
├── src/
│   ├── pages/          # Route components (Landing, Onboarding, Tutor, etc.)
│   ├── components/
│   │   ├── layout/     # AppShell, Sidebar, Header, BottomTabBar
│   │   ├── hoot/       # Hoot mascot SVG components
│   │   ├── landing/    # Landing page sections
│   │   └── ui/         # Design system components (Button, Card, etc.)
│   ├── lib/
│   │   ├── db.ts       # Dexie IndexedDB schema
│   │   ├── pdf.ts      # PDF processing pipeline
│   │   ├── search.ts   # BM25 search index
│   │   ├── llm.ts      # AI proxy client + prompt builders
│   │   ├── voice.ts    # Web Speech API
│   │   ├── spaced.ts   # SM-2 spaced repetition
│   │   └── xp.ts       # XP / levels / badges
│   ├── data/
│   │   ├── boards.ts   # All 36+ Indian school boards
│   │   ├── subjects.ts # Subjects per class (6-10)
│   │   └── demo.ts     # Demo mode seed data
│   └── store/          # Zustand global state
├── netlify/
│   └── functions/
│       └── chat.ts     # Serverless AI proxy (API keys live here only)
├── public/
│   ├── icons/          # PWA icons
│   └── manifest.json
├── .env.example        # Environment variable template
├── netlify.toml        # Netlify build + function + redirect config
└── README.md
```

---

## For the School Exhibition

When presenting Thinkr at the exhibition:

1. **Open the app** at your Netlify URL or run locally with `netlify dev`
2. **Click "Try demo"** on the landing page — this loads a sample student (Arjun, Class 9 CBSE) with 2 weeks of data
3. **Show these screens**: Home (streak + plan), Tutor (AI chat with source chip), Study (quiz), Progress (marks chart), Library
4. **Navigate to "How It Works"** in the app to show the architecture diagram — it explains everything in simple language

---

## Contributing

This project was built by students, for students. PRs welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Submit a PR

---

*Made with ❤️ for Indian students. Free forever.*
