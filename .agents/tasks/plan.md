# Thinkr — Implementation Plan

> "Study smart. Score high."  
> 19 phases, ordered by dependency. Each phase leaves the project in a buildable state.

---

## Project Context

- **Workspace**: `c:\Users\PALLAVI M\Desktop\Thinkr`
- **Stack**: React 18 + Vite 5 + TypeScript (strict) + Tailwind 3 + Framer Motion + Recharts + KaTeX + lucide-react + shadcn Radix base + Dexie + MiniSearch + pdfjs-dist + Tesseract.js + Zustand + canvas-confetti
- **Build**: `npm run build` (uses `ROLLUP_WASM=true` already set in vite.config.ts)
- **Type-check**: `npm run build:typecheck`
- **Dev**: `npm run dev`
- **No test framework installed** — verification is `npm run build:typecheck` (zero TS errors) + `npm run build` (zero build errors) after each phase
- **Tailwind config**: `tailwind.config.js` (JS, not TS) — extend, do not replace
- **Path alias**: `@/` → `src/` (already configured in tsconfig.json + vite.config.ts)
- **PWA**: already set up via `vite-plugin-pwa` in vite.config.ts
- **Fonts**: Plus Jakarta Sans + Inter already loaded in index.html via Google Fonts
- **No-flash theme script**: already in index.html — sets `data-theme="dark"|"light"` on `<html>`
- **Netlify functions dir**: `netlify/functions/` (empty, ready)
- **Windows/PowerShell**: use forward slashes in import paths; file paths in commands need quoting

---

## PHASE 1 — Tailwind config + design system

**Goal**: Complete CSS token system (both themes), Tailwind brand tokens, global styles, font imports.

**Files to create/modify**:
- `tailwind.config.js` — extend with ALL CSS variable tokens, dark mode via `[data-theme="dark"]` selector, brand gradient, shadow utilities, animate utilities
- `src/styles/tokens.css` — full `:root` + `[data-theme="dark"]` token definitions from spec §4
- `src/styles/global.css` — base resets, scrollbar styling, selection colour, noise/grid texture utility, `prefers-reduced-motion` rule, KaTeX font import
- `src/index.css` — replace stub with `@import` of tokens.css, global.css, then `@tailwind` directives
- `src/main.tsx` — no changes needed (already imports index.css)

**Key implementation notes**:
- Tailwind `darkMode` must be `['selector', '[data-theme="dark"]']` (not `class`) so the existing no-flash script works
- All token values must map to CSS variables: e.g. `colors.bg: 'var(--bg)'`, `colors.surface: 'var(--surface)'`, `colors.primary: 'var(--primary)'`, etc.
- Add `fontFamily.heading` and `fontFamily.body` (already started in tailwind.config.js — confirm they exist)
- Brand gradient: `backgroundImage: { 'gradient-brand': 'linear-gradient(135deg, #FF8A00, #FF5A00)' }`
- Shadow tokens: map `--shadow-sm/md/lg` as custom `boxShadow` extensions
- Add `animation` and `keyframes` for: `fade-in`, `slide-up`, `slide-in-left`, `skeleton-pulse`, `spin-slow`, `bounce-gentle`
- Noise texture: a small base64 SVG filter or CSS `background-image: url("data:image/svg+xml,...")` utility class `.texture-noise`

**Dependencies**: none

**Verify**: `npm run build:typecheck` — 0 errors; `npm run build` — 0 errors; visually confirm tokens apply by checking compiled CSS contains `--bg` and `--primary`.

---

## PHASE 2 — Core data layer

**Goal**: All lib utilities and Zustand stores that every page depends on.

**Files to create**:
- `src/lib/db.ts` — Dexie database with full schema from spec §2 (StudentProfile, PDFDocument, TextChunk, ChatSession, ChatMessage, QuizResult, MarksEntry, ChapterMastery, DailyPlan, Flashcard). Export typed hooks: `useProfile()`, `useLiveQuery` wrappers for each table.
- `src/lib/pdf.ts` — PDF pipeline: (1) pdf.js text extraction with per-page progress callback; (2) Tesseract.js OCR fallback for pages with <50 chars of text (English + Hindi lang pack); (3) chunking to 300–500 words with page numbers; (4) thumbnail generation (canvas render of page 1 → base64). Export `processPDF(file: File, onProgress: (msg: string) => void): Promise<ProcessedPDF>`.
- `src/lib/search.ts` — MiniSearch BM25 index. `buildIndex(chunks: TextChunk[]): MiniSearch`, `search(query: string, index: MiniSearch, topK=4): TextChunk[]`. Index rebuilt from DB on startup. Keep in memory only (not persisted).
- `src/lib/llm.ts` — Proxy caller. `streamChat(payload, onDelta, onDone, onError)`: POST to `/api/chat`, read SSE stream, auto-fallback on 429/5xx, exponential backoff (1s, 2s, 4s). Token budget comment: system ~400 + chunks ~1200 + history ~600 = ~2200 tokens. Export `buildSystemPrompt(profile, mode, level, chunks)` and `buildMarksPrompt(text)` and `buildQuizPrompt(chunks, type, count, board, difficulty, classLevel)`.
- `src/lib/voice.ts` — Web Speech API wrapper. `startSTT(lang, onResult, onError)`, `stopSTT()`, `speak(text, lang, rate, onHighlight)`. Sentence-boundary highlighting: split text by sentence, use `SpeechSynthesisUtterance.onboundary` to track word index. Graceful no-op when API unavailable.
- `src/lib/spaced.ts` — SM-2 algorithm. `updateCard(card: Flashcard, grade: 0|1|2|3|4|5): Flashcard` returns updated interval/easeFactor/nextReviewDue. `getDueCards(cards: Flashcard[]): Flashcard[]`. `calculateMastery(quizResults: QuizResult[], chatCount: number): number` returns 0–100.
- `src/lib/xp.ts` — XP/level/badge logic. `XP_TABLE` (level thresholds), `awardXP(action: XPAction): number` (quiz complete, chat answered, flashcard reviewed, streak maintained, upload). `getLevelFromXP(xp: number)`, `getBadges(profile, quizResults, masteries): Badge[]`. Export badge definitions with ids, names, descriptions, icon names.
- `src/data/boards.ts` — All Indian boards from spec §7, all state boards listed (complete, not excerpt). Export `BOARDS: Board[]`.
- `src/data/subjects.ts` — Subjects per class (6–10): Math, Science, Social Science, English, Hindi, Computer Science, Sanskrit (where applicable), EVS (where applicable). Physics/Chemistry/Biology as Science sub-subjects from class 8. Export `getSubjects(classLevel: number, board: string): Subject[]`.
- `src/data/demo.ts` — Demo mode seed data: a fake StudentProfile (Arjun, Class 9, CBSE), 3 demo PDFs (metadata only, no actual file), demo chat history (5 messages), demo quiz results (2), demo marks entry, demo daily plan. Export `DEMO_DATA` and `seedDemoData(db: ThinkrDB)`.
- `src/store/appStore.ts` — Zustand store: `theme`, `setTheme`, `demoMode`, `setDemoMode`, `sidebarOpen`, `setSidebarOpen`, `language` ('en'|'hi'), `setLanguage`. Persisted to localStorage via `zustand/middleware` `persist`.
- `src/store/chatStore.ts` — Zustand store: `activeSessionId`, `messages`, `isStreaming`, `streamingContent`, `mode` ('guide'|'explain'|'exam'), `level` ('simple'|'class'|'topper'), `scopeDocIds: string[]`, `scopeSubject: string`. Actions: `setMode`, `setLevel`, `setScope`, `appendDelta`, `finalizeMessage`, `clearStream`.
- `src/store/uiStore.ts` — Zustand store: transient UI state — `hootExpression` ('thinking'|'happy'|'celebrating'|'sleeping'|'encouraging'), `confettiActive`, `toasts: Toast[]`. Actions: `setHootExpression`, `triggerConfetti`, `addToast`, `removeToast`.

**Key implementation notes**:
- `db.ts` Dexie v4 schema: use `++id` for auto-increment where appropriate, `&id` for explicit string UUIDs. Upgrade path with `db.version(1).stores({...})`.
- `pdf.ts`: pdf.js v4 — `GlobalWorkerOptions.workerSrc` must be set to the CDN URL or local worker: use `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href`. Tesseract.js v5 — `createWorker(['eng', 'hin'])` once; reuse across pages.
- `llm.ts`: SSE parsing — `fetch` with `ReadableStream`, `TextDecoder`, split on `\n`, parse `data: {...}` lines, handle `[DONE]` sentinel. The proxy is at `/api/chat` (Netlify rewrites).

**Dependencies**: PHASE 1 (CSS tokens must exist before stores can read theme)

**Verify**: `npm run build:typecheck` — 0 errors. All imports resolve.

---

## PHASE 3 — SVG assets (Logo + Hoot mascot)

**Goal**: Original brand assets for all contexts.

**Files to create**:
- `src/assets/logo-light.svg` — Full logo, light mode: rounded-square orange gradient icon (lightbulb filament forming a spark/grad-cap) + wordmark "Thinkr" in Plus Jakarta Sans 800, dark text
- `src/assets/logo-dark.svg` — Same icon + wordmark in white/light text for dark mode
- `src/assets/logo-icon.svg` — Icon only (no wordmark), for favicon and compact use
- `public/favicon.svg` — Copy/symlink of logo-icon.svg with orange bg
- `public/icons/icon-192.png` — 192×192 PNG (note: since we can't run ImageMagick easily, generate via an inline canvas approach or use SVG for PWA icons with `purpose: 'any maskable'` and add a 192/512 SVG-based manifest entry — see vite.config.ts PWA manifest)
- `src/assets/hoot/hoot-thinking.svg` — Owl with glasses, thinking expression (finger on chin, thought bubble)
- `src/assets/hoot/hoot-happy.svg` — Owl with glasses, happy (wings raised, big smile)
- `src/assets/hoot/hoot-celebrating.svg` — Owl with glasses, celebrating (confetti, party hat, wings up)
- `src/assets/hoot/hoot-sleeping.svg` — Owl with glasses, sleeping (Zzz, eyes closed)
- `src/assets/hoot/hoot-encouraging.svg` — Owl with glasses, encouraging (thumbs up, one wing raised)
- `src/components/hoot/HootMascot.tsx` — React component: `<HootMascot expression="thinking|happy|celebrating|sleeping|encouraging" size="sm|md|lg" animate />`. Uses Framer Motion for expression transitions (crossfade). Reads `hootExpression` from uiStore.

**Key implementation notes**:
- SVG logos must be purely original — a rounded rect with orange gradient `defs/linearGradient`, a simple lightbulb path (teardrop shape + base lines), filament as a small graduation-cap-shaped squiggle, wordmark as `<text>` or `<path>` with Plus Jakarta Sans embedded as a `@font-face` reference
- Hoot must be clearly owl-shaped: round head, two ear tufts, large circular eyes with tiny round glasses frames, orange/white palette, no Disney/Pixar likeness. Each expression varies only: eye shape, beak angle, wing position, accessory (hat, Zzz, thought bubble)
- For PWA icons: update `vite.config.ts` manifest to include SVG icons with `purpose: 'any maskable'`; also keep PNG entries for maximum compatibility. Generate `public/icons/icon-192.png` and `icon-512.png` using a Node script or note they need to be created via any SVG-to-PNG tool. As a practical alternative, include them as inline SVG-based files and add a `<link rel="apple-touch-icon">` in index.html.

**Dependencies**: PHASE 1 (brand colours)

**Verify**: `npm run build:typecheck` — 0 errors. SVG files are valid XML.

---

## PHASE 4 — Layout + shared UI components

**Goal**: AppShell, navigation, theme toggle, and all reusable UI primitives.

**Files to create**:
- `src/components/ui/button.tsx` — Button with variants: `primary` (orange gradient), `secondary` (outline), `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Uses `class-variance-authority`. Min 44px tap target.
- `src/components/ui/card.tsx` — Card container with `surface`/`elevated` variants, 20px radius, appropriate shadow.
- `src/components/ui/badge.tsx` — Badge: `default`, `success`, `warning`, `danger`, `muted` variants.
- `src/components/ui/input.tsx` — Input with focus ring (orange), error state, label slot.
- `src/components/ui/select.tsx` — Radix Select styled to brand tokens.
- `src/components/ui/dialog.tsx` — Radix Dialog styled to brand tokens, 20px radius.
- `src/components/ui/tabs.tsx` — Radix Tabs styled with orange active indicator.
- `src/components/ui/progress.tsx` — Radix Progress bar + ring variant with brand gradient.
- `src/components/ui/switch.tsx` — Radix Switch styled orange.
- `src/components/ui/tooltip.tsx` — Radix Tooltip with surface card styling.
- `src/components/ui/skeleton.tsx` — Animated skeleton loader (pulsing bg-elevated).
- `src/components/ui/toast.tsx` — Radix Toast, four severity variants.
- `src/components/ui/index.ts` — Re-export all ui components.
- `src/lib/utils.ts` — `cn(...classes)` using `clsx` + `tailwind-merge`.
- `src/components/layout/ThemeProvider.tsx` — Reads `appStore.theme`, syncs `data-theme` on `<html>`, listens to `prefers-color-scheme` media query. Animated 200ms transition on theme change.
- `src/components/layout/ThemeToggle.tsx` — Animated sun/moon SVG toggle button (Framer Motion rotate+scale). Calls `appStore.setTheme`.
- `src/components/layout/Header.tsx` — Logo (links to `/`), XP/level pill (animated counter), streak flame icon + count, theme toggle, optional back button. Responsive: compact on mobile.
- `src/components/layout/Sidebar.tsx` — Desktop only (hidden on <768px). Collapsible (icon-only → full). Nav items: Home, Tutor, Study, Library, Progress, Profile. Active item highlighted with orange accent. Framer Motion collapse animation.
- `src/components/layout/BottomTabBar.tsx` — Mobile only (hidden on ≥768px). 5 tabs: Home, Tutor, Study, Progress, Profile. 44px+ tap targets, orange active indicator. Safe area inset for notched phones.
- `src/components/layout/AppShell.tsx` — Wrapper for authenticated routes: `<ThemeProvider> + <Header> + <Sidebar> + <Outlet> + <BottomTabBar>`. Checks `db.profile` exists; redirects to `/onboarding` if not. Reads `demoMode` from appStore.
- `src/components/layout/DemoBanner.tsx` — Orange sticky banner: "Demo mode — no AI calls, sample data only. Exit demo →". Shown when `demoMode` is true.
- `src/App.tsx` — Full router setup: `<BrowserRouter>` + routes: `/` → `<LandingPage>`, `/onboarding` → `<OnboardingWizard>`, `/app/*` → `<AppShell>` with nested routes for home, tutor, study, library, progress, profile. Import `ThemeProvider` at root. Lazy-load all page components with `React.lazy` + `<Suspense fallback={<SkeletonPage />}>`.

**Key implementation notes**:
- `AppShell` must check if profile exists in Dexie on mount; if not and not in demo mode, redirect to `/onboarding`
- All nav items use `<NavLink>` from react-router-dom for active class management
- Sidebar collapse state persisted to `appStore.sidebarOpen`
- `ThemeProvider` must set `document.documentElement.setAttribute('data-theme', ...)` matching the no-flash script convention already in index.html
- Glass-like panel effect: `backdrop-filter: blur(12px)` on Header and Sidebar with semi-transparent surface bg
- SkeletonPage: full-screen skeleton with header + sidebar outlines for the Suspense fallback

**Dependencies**: PHASE 1 (tokens), PHASE 2 (db, stores), PHASE 3 (logo/assets)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors. Confirm routes resolve without crash.

---

## PHASE 5 — Landing page

**Goal**: Stunning first impression — sticky navbar, hero with live chat animation, feature sections, FAQ, footer.

**Files to create**:
- `src/pages/Landing.tsx` — Main landing page component, assembles all sections
- `src/components/landing/Navbar.tsx` — Sticky navbar: logo (links to `/`), nav links (How it works, Features, Demo), theme toggle, "Start free" button (orange gradient). Transparent → frosted-glass on scroll. Mobile: hamburger menu with slide-down drawer.
- `src/components/landing/HeroSection.tsx` — Full-viewport hero. Left: headline "Study smart. Score high." (Plus Jakarta Sans 800, animated word-by-word reveal), subheadline, two CTA buttons ("Start free" → `/onboarding`, "Watch demo" → triggers demo mode). Right: animated live chat preview — a mock ChatWindow that typewriter-animates a question ("What is photosynthesis?") then streams an answer with a source chip ("Source: Science Ch. 6, page 42"). Orange radial glow in dark mode behind the preview.
- `src/components/landing/HowItWorksSection.tsx` — 3 steps with numbered circles: (1) Upload your PDF, (2) Ask or get quizzed, (3) Track your progress. Each step has an illustration (simple SVG inline or Hoot expression), animated entry on scroll (Framer Motion `whileInView`).
- `src/components/landing/FeatureGrid.tsx` — 7 feature cards in a responsive grid: Chat with PDFs, Marks-card analysis, Smart quizzes, Voice tutor, Daily study plan, Report card, Works on phone. Each card has a lucide icon, title, 1-line description. Hover: card lifts, orange glow border. Staggered entrance animation.
- `src/components/landing/MockScreenshots.tsx` — 2–3 device mockups (phone frame + desktop frame, pure CSS/SVG frames) showing dashboard and report card UI. Parallax scroll effect.
- `src/components/landing/MadeByStudents.tsx` — Social proof section: "Made by students, for students" headline, 3 student testimonial cards (demo data), Hoot celebrating mascot.
- `src/components/landing/FAQSection.tsx` — Accordion FAQ, 8 questions about privacy, free tier, boards supported, offline use, etc. Animated expand/collapse.
- `src/components/landing/Footer.tsx` — Logo, tagline, links (Privacy, About, GitHub), "Built with ❤️ for Indian students".
- `src/components/landing/index.ts` — Re-exports.

**Key implementation notes**:
- ALL scroll animations use Framer Motion `useInView` / `whileInView` with `once: true` to avoid re-triggering
- Respect `prefers-reduced-motion`: when reduced motion is preferred, skip animations (use CSS `@media (prefers-reduced-motion: reduce)` to remove transitions, or check the media query in JS)
- Hero animated chat preview: use `useEffect` with `setTimeout` chains or a custom `useTypingEffect` hook; not an actual LLM call
- Landing page has NO AppShell — it has its own Navbar and no sidebar/bottom-tab-bar
- "Watch demo" button: sets `demoMode = true` in appStore, then navigates to `/app/home`

**Dependencies**: PHASE 1, PHASE 3 (Hoot for testimonials section), PHASE 4 (Button, Card, ThemeToggle)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 6 — Onboarding wizard

**Goal**: 4-step animated onboarding that collects profile data and optionally processes a marks card.

**Files to create**:
- `src/pages/Onboarding.tsx` — Wizard shell: progress indicator (4 dots/steps), Framer Motion slide transitions between steps, "Back" / "Next" / "Finish" navigation. On finish: saves profile to Dexie, navigates to `/app/home`.
- `src/components/onboarding/StepName.tsx` — Step 1: animated greeting with Hoot (encouraging expression), name input, language toggle (English/Hindi). Validation: name required, 2–40 chars.
- `src/components/onboarding/StepBoard.tsx` — Step 2: Board selector (searchable dropdown from `BOARDS` data, grouped: National, State), Class selector (6–10 as large clickable chips). Animated transitions.
- `src/components/onboarding/StepSubjects.tsx` — Step 3: Subjects auto-populated from `getSubjects(classLevel, board)`, toggle chips to select/deselect. "Select all" shortcut. Hoot expression: thinking while selecting.
- `src/components/onboarding/StepMarksCard.tsx` — Step 4: Optional upload. Dropzone for image/PDF. If uploaded: runs `processPDF` or image OCR → shows progress → sends extracted text to LLM via llm.ts `buildMarksPrompt` → parses JSON response → shows editable table of subject/marks. User confirms or skips. Hoot expression: thinking during OCR, happy on success.
- `src/components/onboarding/OnboardingProgress.tsx` — Step dot indicator with Framer Motion transitions.

**Key implementation notes**:
- Wizard state lives in local React state (useState/useReducer), NOT in Zustand — it's ephemeral
- Marks card step: if LLM unavailable (network error), still allow skip gracefully
- After onboarding, set `profile.id = 1` in Dexie (singleton row)
- Animate the Hoot mascot expression change between steps using `AnimatePresence`
- Board selector: group boards as "National" (CBSE, ICSE) and "State Boards" alphabetically
- Language choice saves to `profile.language`; also update `appStore.language`

**Dependencies**: PHASE 2 (db, boards, subjects, llm, pdf), PHASE 3 (Hoot), PHASE 4 (UI components)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 7 — Library page

**Goal**: PDF upload, processing pipeline UI, file management.

**Files to create**:
- `src/pages/Library.tsx` — Library page: upload zone at top, grid of PDFCards below, empty state with Hoot.
- `src/components/pdf/UploadDropzone.tsx` — Drag-and-drop zone (react-based, no external drag library needed — use HTML5 drag events). Accepts PDF + image (PNG, JPG for marks card). Shows file type icon, file name, size. On drop/select: calls `processPDF` from `lib/pdf.ts`. Shows live processing progress: "Extracting text...", "Reading page 3 of 12 (OCR)...", "Indexing...". Animated progress bar. On completion: saves chunks to Dexie, updates PDFDocument status to `ready`.
- `src/components/pdf/PDFCard.tsx` — Card per uploaded document: thumbnail (page 1 base64), name, subject badge, type badge, page count, status indicator (processing/ready/error). Actions: "Chat with this PDF" (navigates to tutor with doc scoped), "Delete" (confirm dialog). Hover: subtle lift.
- `src/components/pdf/ProcessingProgress.tsx` — Modal or inline progress with step-by-step status and estimated time. Hoot thinking expression during processing.
- `src/components/pdf/TagSelector.tsx` — Subject + chapter tag assignment after upload. Subject dropdown (from profile subjects), chapter text input or AI-suggested chapter names.
- `src/hooks/usePDFProcessor.ts` — React hook wrapping the `processPDF` lib function, managing loading state, progress messages, and Dexie writes.

**Key implementation notes**:
- Privacy note must be shown prominently on the upload dropzone: "Your files never leave your device. Only small text snippets are sent to the AI."
- Marks card type PDFs go to `type: 'marks_card'` — trigger marks card analysis flow automatically on upload
- Max recommended file size: 50MB warning (PDF.js handles large files but Tesseract OCR is slow — warn user for large scanned PDFs)
- Thumbnail: render page 1 to an offscreen canvas, `canvas.toDataURL('image/jpeg', 0.5)` → stored in Dexie as `thumbnail`
- BM25 index rebuilt after each new document is added: call `search.ts` `buildIndex` and store result in module-level variable

**Dependencies**: PHASE 2 (db, pdf, search), PHASE 4 (AppShell, UI)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 8 — Tutor / Chat page

**Goal**: Streaming AI chat with source chips, KaTeX, Socratic mode, voice input.

**Files to create**:
- `src/pages/Tutor.tsx` — Tutor page: `ChatSessionList` on left panel (desktop) or as a drawer (mobile), `ChatWindow` as main area, `ChatInputBar` pinned at bottom.
- `src/components/chat/ChatSessionList.tsx` — List of past chat sessions from Dexie, grouped by subject. "New chat" button. Click to load session. Delete session action.
- `src/components/chat/ChatWindow.tsx` — Scrollable message list. User bubbles: orange gradient, right-aligned. Assistant bubbles: surface card, left-aligned with Hoot avatar and orange left border. Auto-scrolls to bottom. `AnimatePresence` for new message entrance. Shows `HootThinkingIndicator` while streaming.
- `src/components/chat/ChatBubble.tsx` — Renders a single message: Markdown via a simple renderer (parse `**bold**`, `*italic*`, `` `code` ``, `\n` → `<br>`), KaTeX for `$...$` and `$$...$$` via `react-katex`, tables, code blocks with syntax highlighting (use `<pre>` with orange accent border). Source chips rendered below assistant messages.
- `src/components/chat/SourceChip.tsx` — Clickable chip: "Source: {docName}, page {N}". Click opens a modal/drawer showing the extracted page text with the relevant sentence highlighted.
- `src/components/chat/HootThinkingIndicator.tsx` — Animated Hoot (thinking expression) with 3 pulsing dots. Shown while LLM is streaming.
- `src/components/chat/SuggestedFollowUps.tsx` — 2–3 follow-up question chips rendered after each assistant message. Clicking one populates the input.
- `src/components/chat/ChatInputBar.tsx` — Pinned bottom bar: ModeChips (Guide/Explain/Exam), LevelChips (Simple/Class/Topper), ScopeSelector (subject + optional PDF filter), text input (auto-resize textarea), voice input button, send button. Sends message on Enter (Shift+Enter for newline). Disabled while streaming.
- `src/components/chat/ModeChips.tsx` — 3 chip buttons for mode. Active = orange fill. Tooltip explaining each mode.
- `src/components/chat/LevelChips.tsx` — 3 chip buttons for level.
- `src/components/chat/ScopeSelector.tsx` — Popover/dropdown: select active subject, optionally filter to specific PDFs from library.
- `src/components/chat/VoiceInputButton.tsx` — Mic button. Press-and-hold or toggle: calls `voice.ts` `startSTT`, streams transcript to input field. Animated pulse ring while recording. Shows "Hindi" or "English" language indicator.
- `src/hooks/useChat.ts` — React hook: manages sending a message (BM25 retrieval → build payload → `llm.streamChat`), appending deltas to `chatStore`, saving completed message to Dexie, handling errors, managing Socratic mode logic.

**Key implementation notes**:
- Socratic "Guide me" mode: first 3 responses give hints only (prompt instructs LLM accordingly). After 3 user messages without correct answer, show "Show full solution" button which resends with `mode: 'explain'` override.
- KaTeX: `react-katex` with `throwOnError: false`. Detect LaTeX by looking for `$` delimiters; wrap in `<InlineMath>` or `<BlockMath>` accordingly.
- Source chips: when streaming completes, parse source references from a JSON block at end of LLM response (instruct LLM to append `<!-- sources: [{...}] -->` comment). Fallback: show no chips if parsing fails.
- Suggested follow-ups: after each complete assistant message, make a separate lightweight LLM call with `{"role":"system","content":"Suggest 3 follow-up questions as JSON array: [\"...\"]"}`. This is a small call (~500 tokens).
- Chat sessions: auto-title from first user message (truncated to 40 chars).
- Error state: if `both_failed`, show Hoot sleeping with friendly message and retry button.
- History sent to LLM: last 4 turns only (8 messages). Older messages in Dexie but NOT in API payload.

**Dependencies**: PHASE 2 (db, llm, voice, search), PHASE 3 (Hoot), PHASE 4 (AppShell), PHASE 7 (Library for scope selector)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 9 — Study page (quiz, flashcards, spaced repetition)

**Goal**: Quiz generator, flashcard deck, revision queue with SM-2.

**Files to create**:
- `src/pages/Study.tsx` — Study page: tabs for Quiz, Flashcards, Revision.
- `src/components/quiz/QuizGenerator.tsx` — Configuration panel: subject/chapter picker, question type (MCQ, short, long, case-based), count (5/10/15/20), difficulty (Easy/Medium/Hard), "Previous year style" toggle (enabled when a question paper PDF is in scope). "Generate" button triggers LLM call.
- `src/components/quiz/QuizSession.tsx` — Quiz in progress: one question at a time (or all at once for MCQ). MCQ: 4 options as large tap-friendly chips. Short/Long: textarea. Case-based: passage + sub-questions. Submit → instant feedback with correct answer shown, explanation, marks awarded.
- `src/components/quiz/QuizResults.tsx` — Results screen: score, XP earned, weak topics flagged, Hoot celebrating (if score ≥ 70%) or encouraging (if <70%). "Try again" and "Back to study" buttons. Confetti on ≥90%.
- `src/components/quiz/QuestionCard.tsx` — Individual question display with question number, type badge, text (supports KaTeX).
- `src/components/quiz/FlashcardDeck.tsx` — Card flip animation (Framer Motion `rotateY`). Front: question/term. Back: answer/definition. Swipe left = "Hard" (grade 2), swipe right = "Easy" (grade 5), tap space = flip. Shows due count and total.
- `src/components/quiz/RevisionQueue.tsx` — List of flashcards due for review today, sorted by urgency. Badges for overdue cards. "Start revision session" launches FlashcardDeck in due-cards-only mode.
- `src/hooks/useQuiz.ts` — React hook: calls `llm.ts` `buildQuizPrompt`, parses JSON response, manages quiz session state, saves `QuizResult` to Dexie, awards XP.
- `src/hooks/useFlashcards.ts` — React hook: CRUD for Flashcard table, SM-2 updates via `spaced.ts`, syncs mastery to `ChapterMastery` table.

**Key implementation notes**:
- Quiz LLM response must be parsed as JSON. If parsing fails, show error and allow retry. Use `JSON.parse` in a try/catch; if it fails, attempt to extract the JSON block from between first `{` and last `}`.
- Flashcard generation: separate button "Generate flashcards from PDF" in QuizGenerator — calls LLM with `buildFlashcardPrompt` returning `{"flashcards": [{"front":"...","back":"..."}]}`.
- Quiz results update `ChapterMastery.mastery` in Dexie — call `spaced.ts` `calculateMastery`.
- XP: awarded immediately on quiz submit; triggers `triggerConfetti` in uiStore if ≥90%.
- "Previous year style" mode: detected by presence of a `type: 'question_paper'` PDF in scope — changes LLM prompt instruction.

**Dependencies**: PHASE 2 (db, llm, spaced, xp), PHASE 3 (Hoot), PHASE 4 (AppShell, UI), PHASE 7 (Library for scope)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 10 — Marks card analysis

**Goal**: Upload marks card → OCR → LLM JSON parsing → editable table → charts.

**Files to create**:
- `src/components/progress/MarksCardUpload.tsx` — Upload widget for marks card (image or PDF). Triggers `processPDF` / image OCR, then sends text to LLM with `buildMarksPrompt`. Shows progress. On success: calls `setExtractedMarks`.
- `src/components/progress/MarksTable.tsx` — Editable table of extracted marks: columns Subject, Obtained, Maximum, Percentage. Cells editable inline. Add/remove row. "Confirm & Save" saves to `MarksEntry` in Dexie.
- `src/components/progress/MarksChart.tsx` — Bar chart (Recharts `BarChart`) showing marks per subject. Bars coloured: green ≥80%, orange 60–79%, red <60%. Responsive.
- `src/components/progress/ImprovementPlan.tsx` — After marks confirmed: LLM call to generate a text improvement plan (what to focus on, in 200 words). Rendered in a Card with Hoot encouraging expression.

**Key implementation notes**:
- Marks card OCR: image files (JPG/PNG) go directly to Tesseract.js; skip pdf.js for non-PDF uploads
- LLM marks extraction: response MUST be JSON only — the proxy system prompt instructs no markdown. Parse with try/catch. If JSON invalid, show raw text in a text area for manual entry.
- Validation: `marks_obtained` must be ≤ `max_marks`; both must be numbers. Surface errors in the editable table rows.
- After confirming marks: update `ChapterMastery` for each subject with the marks-derived mastery estimate (obtained/max * 100).
- The marks card upload is accessible from both the Library page (special "Upload Marks Card" button) and the Progress page.

**Dependencies**: PHASE 2 (db, pdf, llm), PHASE 4 (UI), PHASE 7 (upload pipeline)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 11 — Progress + Report Card page

**Goal**: Heatmap, radar chart, weak topics, weekly stats, downloadable PDF report card.

**Files to create**:
- `src/pages/Progress.tsx` — Progress page: assembles MasteryHeatmap, RadarChart, WeakTopicsList, ReportCard sections. Tabs: Overview, Report Card.
- `src/components/progress/MasteryHeatmap.tsx` — GitHub-style contribution heatmap: 7 columns (days of week) × N weeks (last 12 weeks). Each cell coloured by study activity level (0–4). Built as a custom SVG/div grid — no additional library needed. Tooltip on hover.
- `src/components/progress/MasteryRadar.tsx` — Recharts `RadarChart` with one axis per subject. Data: mastery values from `ChapterMastery`. Responsive, orange fill with 40% opacity.
- `src/components/progress/WeakTopicsList.tsx` — Sorted list of `ChapterMastery` entries with mastery <60%, each with a "Practice now" button that navigates to Study tab with that chapter scoped.
- `src/components/progress/QuizScoreTrend.tsx` — Recharts `LineChart` of last 10 quiz scores over time. Orange line with dots.
- `src/components/progress/ReportCard.tsx` — Full report card view: student name, board, class, date range, subjects with mastery bars, quiz score trend, strengths and weak areas. "Download PDF" button uses `window.print()` with a print-specific CSS stylesheet (clean layout, no dark mode, no sidebar).
- `src/components/progress/StatsCounter.tsx` — Animated counter (Framer Motion `useMotionValue` + `animate`) for: total study days, quizzes taken, PDFs uploaded, XP earned.
- `src/styles/print.css` — Print stylesheet: white background, no nav, no sidebar, clean typography, Thinkr logo at top.

**Key implementation notes**:
- `window.print()` approach for PDF export: `@media print` CSS shows only the report card section. The download button adds a class to `<body>` to trigger print-specific styles, calls `window.print()`, then removes the class.
- MasteryHeatmap: query Dexie for `ChatMessage.timestamp` and `QuizResult.timestamp` grouped by date to compute activity counts per day.
- RadarChart: if fewer than 3 subjects, show a simple bar chart instead (radar charts look odd with <3 axes).
- Animate counter numbers on page enter using Framer Motion.

**Dependencies**: PHASE 2 (db, xp), PHASE 4 (AppShell, UI), PHASE 10 (MarksEntry data)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 12 — Daily Planner + PWA notifications

**Goal**: AI-generated daily study plan on Home page, task completion, streak tracking, PWA push notifications.

**Files to create**:
- `src/pages/Home.tsx` — Home dashboard: `HootGreeting`, `StreakCard`, `TodayPlanCard`, `QuickActions`, `ExamCountdown`. Responsive single-column on mobile.
- `src/components/home/HootGreeting.tsx` — Personalized greeting card: "Good morning, {name}! Ready to study?" Hoot expression changes by time of day (morning: happy, evening: encouraging, night: sleepy). Animated entrance.
- `src/components/home/StreakCard.tsx` — Current streak with flame icon (orange animated gradient), best streak, "Keep it up!" badge. XP level progress bar.
- `src/components/home/TodayPlanCard.tsx` — Today's plan from `DailyPlan` Dexie table. If no plan for today: generate one (LLM call with weak topics + exam dates → JSON `DailyPlan`). Task list with checkboxes. Check off task → updates Dexie, awards XP, updates streak. Progress bar.
- `src/components/home/QuickActions.tsx` — 3–4 quick action buttons: "Chat with tutor", "Take a quiz", "Review flashcards", "Upload PDF". Large, touch-friendly, with icons.
- `src/components/home/ExamCountdown.tsx` — Countdown to next exam date (if set in profile). Days remaining with urgency colour coding (green → orange → red).
- `src/hooks/useDailyPlan.ts` — React hook: checks Dexie for today's plan, generates if missing, handles task toggle, XP award, streak update logic.
- `src/hooks/useStreak.ts` — React hook: computes streak from `profile.lastStudiedDate`, detects breaks, awards streak XP.
- `src/lib/notifications.ts` — PWA notification utility: `requestPermission()`, `scheduleReminder(time: string, message: string)` using `Notification` API + `ServiceWorker` postMessage. Daily reminder at `profile.reminderTime`. Fallback: if Notifications not supported, show in-app toast instead.

**Key implementation notes**:
- Daily plan generation: call LLM with `buildPlannerPrompt(profile, weakTopics, examDates)` → JSON `DailyPlan`. If LLM unavailable, generate a simple rule-based plan (each subject 20 min).
- Streak logic: on any study action (quiz, chat, flashcard, plan task), set `profile.lastStudiedDate = today`. On app load, check if `lastStudiedDate` is yesterday → streak intact; if older → reset to 0; if today → no-op.
- PWA notifications require HTTPS in production (OK for Netlify). In dev, the notification permission UI should still work for demonstration.
- `ExamCountdown`: exam dates stored in `profile` (add `examDates: Array<{subject: string; date: string}>` to profile schema in PHASE 2 if not already there).

**Dependencies**: PHASE 2 (db, llm, xp), PHASE 3 (Hoot), PHASE 4 (AppShell, UI)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 13 — Voice tutor

**Goal**: Full TTS/STT with sentence highlighting, speed control, Hindi+English support.

**Files to create**:
- `src/components/chat/VoiceTutor.tsx` — Read-aloud panel: "Read aloud" button on assistant messages. Shows sentence-by-sentence highlighting as speech progresses. Speed control slider (0.75×, 1×, 1.25×, 1.5×, 2×). Stop button.
- `src/hooks/useVoice.ts` — React hook wrapping `voice.ts`. Manages: active utterance state, highlighted sentence index, available voices (filtered for English-India and Hindi), selected language, speaking/paused state.
- Update `src/components/chat/ChatBubble.tsx` — Add "Read aloud" icon button to each assistant bubble, connecting to `useVoice`.
- Update `src/components/chat/VoiceInputButton.tsx` — Enhance with language selector (English/Hindi toggle) persisted to appStore.

**Key implementation notes**:
- `SpeechSynthesis.getVoices()` is async on Chrome — use `onvoiceschanged` event to populate voice list
- Sentence highlighting: split text into sentences (split on `.`, `?`, `!`, `।` for Hindi). Use `utterance.onboundary` event (charIndex) to track which sentence is being spoken; apply a highlight class.
- When TTS is reading, reduce chat input opacity to 50% as a soft "busy" indicator
- Hindi STT: use `lang: 'hi-IN'`; English: `lang: 'en-IN'`
- Always gracefully no-op if `window.speechSynthesis` is undefined (some mobile browsers)

**Dependencies**: PHASE 2 (voice.ts), PHASE 8 (ChatBubble)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 14 — Gamification (XP, levels, badges, confetti)

**Goal**: XP system, level-up animations, badge collection, confetti on achievements.

**Files to create**:
- `src/components/gamification/XPBar.tsx` — Horizontal XP progress bar in Header (compact) and Profile page (full). Shows current level, XP to next level, animated fill on XP gain (Framer Motion `animate`).
- `src/components/gamification/LevelBadge.tsx` — Circular level indicator with gradient ring. Animates on level-up with a pop + glow effect.
- `src/components/gamification/BadgeGrid.tsx` — Grid of all badges. Earned = full colour + name. Unearned = greyscale + "???" name. Hover tooltip with criteria.
- `src/components/gamification/ConfettiOverlay.tsx` — Uses `canvas-confetti` library. Triggered by `uiStore.confettiActive`. Orange + white confetti, bursts from center. Auto-clears after 3 seconds.
- `src/components/gamification/AchievementToast.tsx` — Toast notification for new badge / level-up: Hoot celebrating, badge name, XP earned. Slides in from top-right, auto-dismisses in 4 seconds.
- `src/hooks/useXP.ts` — React hook: wraps `xp.ts` logic. On XP update: check for level-up, check for new badges, trigger appropriate animations.
- Update `src/components/layout/Header.tsx` — Add XP pill with animated counter, streak flame.
- Update `src/pages/Profile.tsx` (from Phase 16) placeholder — ensure `BadgeGrid` and `XPBar` will slot in.

**Key implementation notes**:
- XP actions and amounts: quiz complete (10×(score/total)×difficulty_multiplier), chat answered (5), flashcard reviewed (3), streak day (10), level-up bonus (50), upload PDF (5)
- Level thresholds: 1=0, 2=100, 3=250, 4=450, 5=700, 6=1000, 7=1400, 8=1900, 9=2500, 10=3200 XP — stored in `xp.ts` `XP_TABLE`
- Badge definitions (10 badges): First Upload, First Chat, Quiz Ace (100% quiz), Streak 7, Streak 30, All Subjects, Night Owl (studied after 10pm), Speed Learner, Bookworm (10 PDFs), Topper (average mastery ≥80%)
- Confetti: triggered for quiz ≥90% and level-up events

**Dependencies**: PHASE 2 (xp.ts, db), PHASE 3 (Hoot), PHASE 4 (Header, UI)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 15 — Demo mode

**Goal**: Full demo experience with no real API calls, using seed data.

**Files to create**:
- `src/lib/demoLLM.ts` — Mock LLM that returns canned streaming responses for demo mode. Implements the same `streamChat` signature as `llm.ts`. Returns hardcoded answers with 50ms between tokens to simulate streaming. 5 canned Q&A pairs covering different subjects.
- Update `src/lib/llm.ts` — Export a `getStreamChatFn()` that returns `demoLLM.streamChat` when `appStore.demoMode` is true, real `streamChat` otherwise.
- Update `src/data/demo.ts` — Ensure seed data covers all pages: home plan, quiz history, marks entries, flashcards, chat history, PDF metadata.
- `src/hooks/useDemoMode.ts` — React hook: `enterDemoMode()` calls `seedDemoData(db)` then sets `demoMode: true`; `exitDemoMode()` clears demo data and resets.
- Update `src/components/layout/DemoBanner.tsx` (from Phase 4) — Wire "Exit demo" button to `useDemoMode.exitDemoMode()`.

**Key implementation notes**:
- Demo mode is triggered from the landing page "Watch demo" button
- In demo mode: skip the real LLM call entirely; `demoLLM.ts` handles all AI responses
- Seed data must be visually rich enough to demonstrate all features: at least 3 subjects with varying mastery, a streak of 5 days, 2 quiz results, a marks entry, 10 flashcards
- Exit demo: show a confirmation dialog, then clear all demo data from Dexie (use a transaction to delete all records where `demoMode: true` or use a dedicated `isDemoData: boolean` flag on each record type)

**Dependencies**: PHASE 2 (db, demo data), PHASE 4 (DemoBanner)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 16 — Profile + Settings page

**Goal**: User settings, data export/import, personal Groq key, text size, reset.

**Files to create**:
- `src/pages/Profile.tsx` — Profile page: avatar initial badge, name + board + class display, settings form, data section, gamification section.
- `src/components/profile/SettingsForm.tsx` — Fields: display name (editable), language toggle (EN/HI), text size (Small/Medium/Large), reminder time picker, "Use my own Groq key" toggle + API key input (stored in localStorage only, never in Dexie, never logged). Board and class selectors (re-editable). Theme is set from Header toggle, just display current here.
- `src/components/profile/DataExportImport.tsx` — "Export progress" button: serialises all Dexie tables (excluding file blobs) to a JSON file, triggers `URL.createObjectURL` download. "Import progress" file input: reads JSON, validates schema, imports to Dexie. "Reset everything" button: destructive — confirm dialog, clears all Dexie data + localStorage, navigates to `/onboarding`.
- `src/components/profile/HowThinkrWorksSection.tsx` — Architecture overview section (from Phase 17 — same content, embedded in Profile page as a collapsible).

**Key implementation notes**:
- Personal Groq key: stored in `localStorage` under key `thinkr-groq-key`. Read in `llm.ts` when constructing the API request payload. Clear on "Reset everything".
- Export JSON schema: `{ version: 1, exportedAt: ISO, profile: {...}, quizResults: [...], masteries: [...], marksEntries: [...], flashcards: [...], chatSessions: [...], chatMessages: [...] }` (exclude raw PDF text chunks to keep file small; include PDFDocument metadata without `rawText`).
- Import: on schema mismatch (wrong version), show a clear error.
- Text size: applies a CSS class to `<body>` (`text-size-sm/md/lg`) that overrides `--font-size-base` CSS variable.

**Dependencies**: PHASE 2 (db, stores), PHASE 4 (AppShell, UI), PHASE 14 (XPBar, BadgeGrid)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 17 — How Thinkr Works page

**Goal**: Architecture + privacy diagram, embedded in Profile and accessible as a standalone page.

**Files to create**:
- `src/pages/HowItWorks.tsx` — Standalone page `/app/how-it-works`. Shows architecture diagram, privacy guarantees, tech stack credits.
- `src/components/profile/ArchitectureDiagram.tsx` — SVG/HTML diagram showing: Browser (PDF.js, Tesseract, MiniSearch, Dexie) → Netlify Function → Groq/OpenRouter. Annotated with privacy notes ("files stay here", "only text snippets leave"). Animated with Framer Motion `draw` paths.

**Key implementation notes**:
- Diagram must visually emphasise that raw files never leave the device — this is a key trust/privacy feature
- Use inline SVG with Framer Motion `pathLength` animation for connection lines
- Include a "Tech stack" table: each library with its purpose and license

**Dependencies**: PHASE 4 (AppShell, UI)

**Verify**: `npm run build:typecheck` — 0 errors. `npm run build` — 0 errors.

---

## PHASE 18 — Netlify function (chat.ts proxy)

**Goal**: Serverless proxy with streaming SSE, primary/fallback LLM, rate limiting.

**Files to create**:
- `netlify/functions/chat.ts` — Netlify Edge Function or standard function. Implements:
  1. CORS headers (allow origin `*` for now, restrict to production domain in real deploy)
  2. Parse request body: `{ messages, stream: true, userApiKey? }`
  3. Rate limiting: in-memory Map keyed by IP, max 10 req/min per IP (simple sliding window). Return 429 with `Retry-After` header on limit.
  4. Build chat completion request with system prompt injected server-side (never expose to client)
  5. Try PRIMARY (Groq): fetch to `LLM_PRIMARY_BASE_URL/chat/completions`, pass `LLM_PRIMARY_API_KEY` or `userApiKey` if provided. Stream response as SSE.
  6. On 429/5xx from primary: wait 1s backoff, try FALLBACK (OpenRouter): `LLM_FALLBACK_BASE_URL/chat/completions` with `LLM_FALLBACK_API_KEY`.
  7. On fallback failure: return `{ error: "...", code: "both_failed" }`.
  8. SSE streaming: pipe the upstream SSE chunks directly to the response stream. Handle `[DONE]` sentinel.
- `netlify.toml` — Redirects: `[[redirects]] from = "/api/*" to = "/.netlify/functions/:splat"`. Build config: `[build] command = "npm run build" publish = "dist"`. Function config: Node 18.
- `.env.example` — All env vars: `LLM_PRIMARY_BASE_URL`, `LLM_PRIMARY_API_KEY`, `LLM_PRIMARY_MODEL`, `LLM_FALLBACK_BASE_URL`, `LLM_FALLBACK_API_KEY`, `LLM_FALLBACK_MODEL`.
- Update `vite.config.ts` — Add `server.proxy` for local dev: `'/api/chat': { target: 'http://localhost:8888', rewrite: ... }`. Or alternatively instruct using `netlify dev` for local function testing.

**Key implementation notes**:
- Use Netlify standard function (not Edge) for simplicity: `export const handler: Handler = async (event) => { ... }`
- System prompt MUST be injected in the function, not passed from the client. The client sends only `messages` (user/assistant turns + the chunk-based context). The proxy prepends the system prompt using the env-var values.
- For streaming SSE from a standard Netlify function: use `multiValueHeaders` with `Content-Type: text/event-stream` and `Transfer-Encoding: chunked`. Note: standard Netlify functions do NOT support true streaming — use `netlify.toml` `[functions] node_bundler = "esbuild"` and return the full response buffered. For true streaming, use a Netlify Edge Function (`export default async function handler(request)`). **Decision: use Edge Function for streaming** (TypeScript, `export default`, deployed to `netlify/edge-functions/chat.ts`).
- Edge function path: `netlify/edge-functions/chat.ts`. Update `netlify.toml`: `[[edge_functions]] path = "/api/chat" function = "chat"`.
- Token budget enforcement: proxy checks `messages` array total length. Warn in comments if over 3000 estimated tokens (approximate: 1 token ≈ 4 chars).

**Dependencies**: none (independent of React app except for the API contract)

**Verify**: `npm run build:typecheck` — 0 errors (note: edge function TS may need separate tsconfig). `npm run build` — 0 build errors on client side.

---

## PHASE 19 — Final config + accessibility + README

**Goal**: PWA icons, final vite.config.ts, tailwind.config.js, netlify.toml, .env.example, accessibility pass, README.

**Files to create/modify**:
- `vite.config.ts` — Final PWA manifest: add maskable icon, apple-touch-icon, correct theme_color and background_color per theme. Add `build.rollupOptions.output.manualChunks` to split vendor chunks (react, recharts, pdfjs, tesseract into separate chunks). Keep `ROLLUP_WASM=true`.
- `tailwind.config.js` — Final review: ensure `safelist` includes dynamic classes used by gamification (e.g. `text-success`, `text-danger`). Confirm `darkMode: ['selector', '[data-theme="dark"]']`.
- `netlify.toml` — Final: build command, publish dir, edge function mapping, security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`), cache headers for `dist/assets/*` (1 year immutable).
- `.env.example` — Complete with all 6 env vars + comments.
- `README.md` — Project README: tagline, setup instructions (`npm install`, `npm run dev`, `netlify dev` for functions), env var table, architecture overview, feature list, deploy to Netlify button instructions.
- `public/icons/icon-192.png` and `icon-512.png` — Confirm these exist (created in Phase 3) or note manual step to generate from SVG.
- `index.html` — Add `<link rel="apple-touch-icon" href="/icons/icon-192.png">`, `<meta name="theme-color" content="#FF6B00">`, correct `<meta name="description">`.
- **Accessibility pass** across all components:
  - Every interactive element has `aria-label` or visible label
  - Focus rings visible (Tailwind `focus-visible:ring-2 focus-visible:ring-primary`)
  - All images and icons have `aria-hidden="true"` or `alt` text
  - Color contrast verified against WCAG AA (orange #FF6B00 on white — check; adjust text colour on orange buttons to white)
  - 44px minimum tap targets on all mobile interactive elements
  - Keyboard navigation: Tab order logical, Escape closes modals/drawers
  - `lang="en"` on `<html>` (or `lang="hi"` when in Hindi mode — update dynamically)
  - `prefers-reduced-motion`: all Framer Motion animations check `useReducedMotion()`

**Key implementation notes**:
- Use Framer Motion's `useReducedMotion()` hook to conditionally skip all animations when the user has requested reduced motion. Create a wrapper `<MotionSafe>` component if needed.
- Manual chunk split suggestions: `{ recharts: ['recharts'], pdfWorker: ['pdfjs-dist'], tesseract: ['tesseract.js'], vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'zustand', 'dexie'] }`
- README must include a note that the demo works offline for already-uploaded PDFs (PWA caches app shell) but LLM calls need internet.

**Dependencies**: ALL prior phases

**Verify**: `npm run build` — 0 errors, bundle generated successfully. `npm run build:typecheck` — 0 TS errors. `npm run preview` — app loads at localhost:4173, both themes work, landing page renders, routes resolve.

---

## Implementation order summary

```
Phase 1  → Phase 2  → Phase 3  → Phase 4
Phase 4  → Phase 5  (Landing page)
Phase 4  → Phase 6  (Onboarding)
Phase 6  → Phase 7  (Library)
Phase 7  → Phase 8  (Chat/Tutor)
Phase 8  → Phase 9  (Study/Quiz)
Phase 2  → Phase 10 (Marks card) → Phase 11 (Progress)
Phase 2  → Phase 12 (Home/Planner)
Phase 8  → Phase 13 (Voice tutor)
Phase 2  → Phase 14 (Gamification)
Phase 2  → Phase 15 (Demo mode)
Phase 4  → Phase 16 (Profile)
Phase 4  → Phase 17 (How it works)
         → Phase 18 (Netlify function, independent)
ALL      → Phase 19 (Final config + a11y)
```
