# Thinkr — Product Spec

> "Study smart. Score high."  
> Premium AI study companion for Indian students, Class 6–10.

---

## 1. User Flows

### 1.1 First-time user
1. Land on `/` → stunning landing page → click "Start free"
2. Onboarding wizard (4 animated steps):
   - Step 1: Name + preferred language (English / Hindi)
   - Step 2: Board (CBSE / ICSE / State board selector) + Class (6–10)
   - Step 3: Subjects (auto-populated, toggle to select)
   - Step 4: Optional marks card upload → OCR → editable table → save
3. Redirected to `/dashboard` (Home tab)

### 1.2 Returning user
- IndexedDB profile loaded silently → straight to dashboard
- Today's planner card visible immediately
- Streak counter, XP shown in header

### 1.3 Upload & Chat
1. Library tab → drag/drop or pick PDF → tag subject + chapter
2. pdf.js extracts text; Tesseract OCR for scanned pages (progress shown)
3. Text chunked (300–500 words, with page numbers) + BM25-indexed
4. Chat tab → pick subject scope → type or speak question
5. BM25 retrieves top 3–4 chunks → proxy sends to LLM (streaming)
6. Answer rendered with source chips → click chip → opens PDF page

### 1.4 Quiz flow
1. Study tab → "Generate Quiz" → pick subject/chapter/count/difficulty
2. MCQ / short / long / case-based generated → answer inline
3. Submit → instant feedback, XP earned, weak topics flagged
4. Progress updated

### 1.5 Marks card analysis
1. Library → "Upload Marks Card" (PDF or image)
2. OCR in browser → extracted text sent to LLM → strict JSON response
3. Validated → editable table → confirm
4. Chart + weak subjects + improvement plan generated

### 1.6 Daily planner
1. Home → "Today's Plan" card (AI-generated from exam dates + weak topics)
2. Check off tasks → streak updated → XP earned

### 1.7 Report card
1. Progress tab → "View Report Card"
2. Weekly/monthly auto-generated PDF-downloadable report
3. Teacher/Parent view toggle (read-only)

---

## 2. Data Model (IndexedDB via Dexie)

```typescript
// db.ts — Dexie schema

interface StudentProfile {
  id: 1; // singleton
  name: string;
  language: 'en' | 'hi';
  board: string;        // e.g. 'CBSE', 'ICSE', 'Karnataka'
  classLevel: number;   // 6–10
  subjects: string[];
  xp: number;
  level: number;
  streak: number;
  lastStudiedDate: string; // ISO date
  reminderTime: string;    // 'HH:MM'
  ownGroqKey?: string;
  textSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'system';
}

interface PDFDocument {
  id: string;           // uuid
  name: string;
  subject: string;
  chapter?: string;
  type: 'textbook' | 'notes' | 'question_paper' | 'marks_card';
  status: 'processing' | 'ready' | 'error';
  uploadedAt: number;   // timestamp
  pageCount: number;
  thumbnail?: string;   // base64 of page 1
  rawText?: string;     // full extracted text (for small docs)
}

interface TextChunk {
  id: string;
  docId: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  // BM25 index lives in memory, rebuilt from chunks on startup
}

interface ChatSession {
  id: string;
  subject: string;
  docIds: string[];     // scoped PDFs
  createdAt: number;
  updatedAt: number;
  title: string;        // auto-generated from first message
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Array<{ docId: string; docName: string; pageNumber: number }>;
  timestamp: number;
  mode: 'guide' | 'explain' | 'exam';
  level: 'simple' | 'class' | 'topper';
}

interface QuizResult {
  id: string;
  subject: string;
  chapter?: string;
  score: number;
  total: number;
  questions: Array<{
    q: string;
    type: 'mcq' | 'short' | 'long' | 'case';
    options?: string[];
    correct: string;
    studentAnswer: string;
    isCorrect: boolean;
  }>;
  timestamp: number;
  xpEarned: number;
}

interface MarksEntry {
  id: string;
  uploadedAt: number;
  examName?: string;
  entries: Array<{
    subject: string;
    marks_obtained: number;
    max_marks: number;
  }>;
}

interface ChapterMastery {
  id: string;           // `${subject}-${chapter}`
  subject: string;
  chapter: string;
  mastery: number;      // 0–100
  lastPracticed: number;
  nextReviewDue: number; // spaced repetition
  quizCount: number;
  chatCount: number;
}

interface DailyPlan {
  id: string;           // ISO date
  tasks: Array<{
    id: string;
    subject: string;
    topic: string;
    durationMin: number;
    type: 'study' | 'quiz' | 'revision' | 'flashcard';
    done: boolean;
  }>;
  generatedAt: number;
}

interface Flashcard {
  id: string;
  docId?: string;
  subject: string;
  chapter?: string;
  front: string;
  back: string;
  interval: number;      // spaced repetition days
  easeFactor: number;
  nextReviewDue: number;
  createdAt: number;
}
```

---

## 3. Component Tree

```
App
├── ThemeProvider (CSS vars, localStorage, no-flash script)
├── Router
│   ├── LandingPage /
│   │   ├── Navbar
│   │   ├── HeroSection (animated chat preview)
│   │   ├── HowItWorksSection (3 steps)
│   │   ├── FeatureGrid
│   │   ├── MockScreenshots
│   │   ├── MadeByStudents
│   │   ├── FAQSection
│   │   └── Footer
│   │
│   ├── OnboardingWizard /onboarding
│   │   ├── StepName
│   │   ├── StepBoard
│   │   ├── StepSubjects
│   │   └── StepMarksCard
│   │
│   └── AppShell /app/*  (after onboarding)
│       ├── Sidebar (desktop, collapsible)
│       ├── BottomTabBar (mobile)
│       ├── Header (logo, XP, streak, theme toggle)
│       │
│       ├── HomePage /app/home
│       │   ├── TodayPlanCard
│       │   ├── StreakCard
│       │   ├── HootGreeting (mascot, expression changes)
│       │   ├── QuickActions
│       │   └── ExamCountdown
│       │
│       ├── TutorPage /app/tutor
│       │   ├── ChatSessionList (sidebar panel)
│       │   ├── ChatWindow
│       │   │   ├── ChatBubble (user / assistant)
│       │   │   ├── SourceChip
│       │   │   ├── KaTeXRenderer
│       │   │   ├── MarkdownRenderer
│       │   │   └── HootThinkingIndicator
│       │   └── ChatInputBar
│       │       ├── ModeChips (Guide / Explain / Exam)
│       │       ├── LevelChips (Simple / Class / Topper)
│       │       ├── VoiceInputButton
│       │       └── ScopeSelector (subject/PDF)
│       │
│       ├── StudyPage /app/study
│       │   ├── QuizGenerator
│       │   ├── FlashcardDeck
│       │   └── RevisionQueue
│       │
│       ├── LibraryPage /app/library
│       │   ├── UploadDropzone
│       │   ├── PDFCard (thumbnail, status, tag)
│       │   └── ProcessingProgress
│       │
│       ├── ProgressPage /app/progress
│       │   ├── MasteryHeatmap
│       │   ├── RadarChart (Recharts)
│       │   ├── WeakTopicsList
│       │   └── ReportCard
│       │       ├── ReportStats
│       │       ├── QuizScoreTrend (Recharts)
│       │       └── DownloadPDFButton
│       │
│       └── ProfilePage /app/profile
│           ├── SettingsForm
│           ├── DataExportImport
│           └── HowThinkrWorksPage
│
├── HootMascot (global, animated expressions)
├── ConfettiOverlay (triggered on achievements)
├── PWAInstallPrompt
└── NotificationScheduler
```

---

## 4. Design Tokens

```css
/* tokens.css */

:root {
  /* Light mode */
  --bg: #FFFFFF;
  --bg-soft: #FFF7F0;
  --surface: #FFFFFF;
  --elevated: #FFF1E6;
  --border: #F3DFCF;
  --text: #1A1208;
  --text-muted: #6B5B4D;
  --primary: #FF6B00;
  --primary-hover: #E85D04;
  --primary-soft: #FFE8D6;
  --success: #16A34A;
  --warning: #F59E0B;
  --danger: #DC2626;
  --radius-card: 20px;
  --radius-btn: 12px;
  --shadow-sm: 0 1px 3px rgba(255,107,0,0.08);
  --shadow-md: 0 4px 16px rgba(255,107,0,0.12);
  --shadow-lg: 0 8px 32px rgba(255,107,0,0.16);
  --gradient-brand: linear-gradient(135deg, #FF8A00, #FF5A00);
  --transition-theme: 200ms ease;
}

[data-theme="dark"] {
  --bg: #0A0A0A;
  --bg-soft: #111111;
  --surface: #141414;
  --elevated: #1E1E1E;
  --border: #2B2B2B;
  --text: #F5F5F5;
  --text-muted: #A3A3A3;
  --primary: #FF7A1A;
  --primary-hover: #FF8F40;
  --primary-soft: #2A1A0D;
  --success: #4ADE80;
  --warning: #FBBF24;
  --danger: #F87171;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  --glow-orange: 0 0 60px rgba(255,122,26,0.15);
}
```

---

## 5. File Structure

```
thinkr/
├── public/
│   ├── icons/           # PWA icons (192, 512, maskable)
│   ├── manifest.json
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── hoot/        # SVG mascot expressions
│   ├── components/
│   │   ├── ui/          # shadcn base components
│   │   ├── hoot/        # Mascot components
│   │   ├── chat/        # Chat UI
│   │   ├── pdf/         # PDF pipeline UI
│   │   ├── quiz/        # Quiz components
│   │   ├── progress/    # Charts, heatmap
│   │   └── layout/      # Sidebar, BottomTabBar, Header
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Home.tsx
│   │   ├── Tutor.tsx
│   │   ├── Study.tsx
│   │   ├── Library.tsx
│   │   ├── Progress.tsx
│   │   ├── Profile.tsx
│   │   └── HowItWorks.tsx
│   ├── lib/
│   │   ├── db.ts        # Dexie schema + hooks
│   │   ├── pdf.ts       # pdf.js + Tesseract pipeline
│   │   ├── search.ts    # MiniSearch BM25
│   │   ├── llm.ts       # Proxy caller, streaming, fallback
│   │   ├── voice.ts     # Web Speech API
│   │   ├── spaced.ts    # SM-2 spaced repetition
│   │   └── xp.ts        # XP / level / badge logic
│   ├── data/
│   │   ├── boards.ts    # All Indian boards
│   │   ├── subjects.ts  # Subjects per class
│   │   └── demo.ts      # Demo mode seed data
│   ├── hooks/           # React hooks
│   ├── store/           # Zustand global state
│   ├── styles/
│   │   ├── tokens.css
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── netlify/functions/
│   └── chat.ts          # Serverless proxy
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 6. API Proxy Contract

```typescript
// POST /api/chat  (Netlify function)
// Request:
{
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  stream: true;
  userApiKey?: string; // optional personal Groq key
}
// Response: SSE stream of delta tokens
// Error: { error: string; code: 'primary_failed' | 'both_failed' }

// Token budget: system prompt ~400 tokens + 3-4 chunks ~1200 tokens
//               + last 4 turns ~600 tokens = ~2200 tokens (safe under 3000)
```

---

## 7. Board Data (excerpt)

```typescript
export const BOARDS = [
  { id: 'cbse',   name: 'CBSE', fullName: 'Central Board of Secondary Education' },
  { id: 'icse',   name: 'ICSE', fullName: 'Council for the Indian School Certificate Examinations' },
  { id: 'kseeb',  name: 'Karnataka (KSEEB)', state: 'Karnataka' },
  { id: 'tnsb',   name: 'Tamil Nadu (TNSB)', state: 'Tamil Nadu' },
  { id: 'msbshse',name: 'Maharashtra (SSC)', state: 'Maharashtra' },
  { id: 'kbpe',   name: 'Kerala (KBPE)',     state: 'Kerala' },
  { id: 'bseap',  name: 'Andhra Pradesh (BSEAP)', state: 'Andhra Pradesh' },
  { id: 'bsets',  name: 'Telangana (BSETS)', state: 'Telangana' },
  { id: 'upmsp',  name: 'Uttar Pradesh (UPMSP)', state: 'Uttar Pradesh' },
  { id: 'bseb',   name: 'Bihar (BSEB)',      state: 'Bihar' },
  { id: 'wbbse',  name: 'West Bengal (WBBSE)', state: 'West Bengal' },
  { id: 'gseb',   name: 'Gujarat (GSEB)',    state: 'Gujarat' },
  { id: 'rbse',   name: 'Rajasthan (RBSE)',  state: 'Rajasthan' },
  { id: 'mpbse',  name: 'Madhya Pradesh (MPBSE)', state: 'Madhya Pradesh' },
  { id: 'pseb',   name: 'Punjab (PSEB)',     state: 'Punjab' },
  { id: 'hbse',   name: 'Haryana (HBSE)',    state: 'Haryana' },
  { id: 'chse',   name: 'Odisha (CHSE)',     state: 'Odisha' },
  { id: 'seba',   name: 'Assam (SEBA)',      state: 'Assam' },
  // ... all remaining state boards
];
```

---

## 8. System Prompts

### Chat (injected by proxy, never sent to client)
```
You are Thinkr's AI tutor. You help Indian students in Class {classLevel} ({board} board).
Reply in {language}. Answer from the provided PDF chunks first.
If the answer is NOT in the chunks, say "Not from your book:" then give a general answer.
Never invent page numbers, marks, or chapter names.
Be encouraging, use everyday Indian examples. Never shame the student.
Age-appropriate for ages 11–16. Politely refuse off-topic/unsafe requests.
Current mode: {mode}. Level: {level}.
Chunks: {chunks}
```

### Marks extraction
```
Extract marks from the following text. Return ONLY valid JSON:
{"entries": [{"subject": "...", "marks_obtained": N, "max_marks": N}]}
No explanation. No markdown. Only JSON.
Text: {text}
```

### Quiz generation
```
Generate {count} {type} questions from the following content.
Board pattern: {board}. Difficulty: {difficulty}. Class: {classLevel}.
Return ONLY valid JSON: {"questions": [{...}]}
Content: {chunks}
```
