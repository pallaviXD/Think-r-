/**
 * Study page — Quiz generator, flashcards, spaced repetition.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, RotateCcw, CheckCircle2, XCircle, ChevronRight,
  BookOpen, Award, Loader2, ThumbsUp, ThumbsDown, Layers
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { searchChunks, buildIndex } from '../lib/search'
import { streamChat, buildQuizPrompt, demoLLM } from '../lib/llm'
import { useAppStore } from '../store/appStore'
import { useUIStore } from '../store/uiStore'
import { HootMascot } from '../components/hoot/HootMascot'
import type { QuizQuestion } from '../lib/db'

type QuizType = 'mcq' | 'short' | 'long' | 'case_based'
type Difficulty = 'easy' | 'medium' | 'hard'

interface QuizState {
  questions: QuizQuestion[]
  current: number
  answers: string[]
  submitted: boolean
  score: number
}

function QuizGenerator({ onStart }: { onStart: (qs: QuizQuestion[]) => void }) {
  const demoMode = useAppStore(s => s.demoMode)
  const profile = useLiveQuery(() => db.studentProfile.get(1))
  const allChunks = useLiveQuery(() => db.textChunks.toArray())
  const allDocs = useLiveQuery(() => db.pdfDocuments.toArray())

  const [subject, setSubject] = useState('')
  const [type, setType] = useState<QuizType>('mcq')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    try {
      // Demo mode: return canned quiz
      if (demoMode) {
        const demoQuestions: QuizQuestion[] = [
          { question: 'What is the powerhouse of the cell?', type: 'mcq', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Lysosome'], correctAnswer: 'Mitochondria', explanation: 'Mitochondria produce ATP via cellular respiration.', maxMarks: 1 },
          { question: 'The process of photosynthesis occurs in which organelle?', type: 'mcq', options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Golgi body'], correctAnswer: 'Chloroplast', explanation: 'Chloroplasts contain chlorophyll which absorbs sunlight.', maxMarks: 1 },
          { question: 'What gas is released during photosynthesis?', type: 'mcq', options: ['CO₂', 'N₂', 'O₂', 'H₂'], correctAnswer: 'O₂', explanation: 'Oxygen is a byproduct of the light reactions (photolysis of water).', maxMarks: 1 },
          { question: 'Which pigment is responsible for the green colour of leaves?', type: 'mcq', options: ['Carotene', 'Xanthophyll', 'Chlorophyll', 'Anthocyanin'], correctAnswer: 'Chlorophyll', explanation: 'Chlorophyll a and b absorb red and blue light, reflecting green.', maxMarks: 1 },
          { question: 'What are the raw materials for photosynthesis?', type: 'mcq', options: ['Glucose and O₂', 'CO₂ and water', 'ATP and NADPH', 'Starch and sugar'], correctAnswer: 'CO₂ and water', explanation: 'Plants use carbon dioxide from air and water from soil as inputs.', maxMarks: 1 },
        ]
        setTimeout(() => {
          onStart(demoQuestions)
          setLoading(false)
        }, 1000)
        return
      }

      // Build BM25 index and retrieve chunks
      let chunks = allChunks ?? []
      if (subject && chunks.length > 0) {
        const idx = buildIndex(chunks)
        chunks = searchChunks(subject, idx, 4)
      }

      if (chunks.length === 0) {
        setError('Upload a PDF first so Thinkr can generate questions from your content.')
        setLoading(false)
        return
      }

      const displayProfile = profile ?? { board: 'CBSE', classLevel: 9 }
      const messages = buildQuizPrompt(chunks, type, count, displayProfile.board, difficulty, displayProfile.classLevel)

      let jsonText = ''
      const llm = { streamChat }
      await llm.streamChat(
        { messages },
        (token) => { jsonText += token },
        async (full) => {
          try {
            // Validate JSON
            const parsed = JSON.parse(full)
            if (!Array.isArray(parsed.questions)) throw new Error('Invalid schema')
            onStart(parsed.questions)
          } catch {
            // Retry once with strict JSON prompt
            setError('Could not parse questions. Try again.')
          }
          setLoading(false)
        },
        () => { setError('AI unavailable. Try again.'); setLoading(false) }
      )
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-bold text-text">Generate Quiz</h2>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Topic or subject (e.g. Photosynthesis)"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted mb-1.5 block">Question type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as QuizType)}
              className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
            >
              <option value="mcq">MCQ</option>
              <option value="short">Short Answer</option>
              <option value="long">Long Answer</option>
              <option value="case_based">Case Study</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted mb-1.5 block">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as Difficulty)}
              className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted mb-1.5 block">Number of questions: {count}</label>
          <input type="range" min={3} max={15} value={count} onChange={e => setCount(+e.target.value)} className="w-full accent-primary" />
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-brand text-white font-semibold py-3 rounded-btn shadow hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Zap className="w-4 h-4" /> Generate Quiz</>}
        </button>
      </div>
    </div>
  )
}

function QuizCard({
  questions,
  onDone,
}: {
  questions: QuizQuestion[]
  onDone: (score: number, total: number) => void
}) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])

  const q = questions[current]
  const isCorrect = submitted && selected === q.correctAnswer

  const handleSubmit = () => {
    setSubmitted(true)
    setAnswers(prev => [...prev, selected])
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      const score = [...answers, selected].filter((a, i) => a === questions[i].correctAnswer).length
      onDone(score, questions.length)
    } else {
      setCurrent(c => c + 1)
      setSelected('')
      setSubmitted(false)
    }
  }

  return (
    <motion.div
      key={current}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-surface border border-border rounded-card p-6 shadow-sm"
    >
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-text-muted">Question {current + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < current ? 'bg-success' : i === current ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      <p className="text-sm font-semibold text-text mb-4 leading-relaxed">{q.question}</p>

      {q.type === 'mcq' && q.options && (
        <div className="space-y-2 mb-4">
          {q.options.map(opt => (
            <button
              key={opt}
              onClick={() => !submitted && setSelected(opt)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                submitted
                  ? opt === q.correctAnswer
                    ? 'bg-success/10 border-success text-success'
                    : opt === selected
                      ? 'bg-danger/10 border-danger text-danger'
                      : 'bg-elevated border-border text-text-muted'
                  : selected === opt
                    ? 'bg-primary-soft border-primary text-primary'
                    : 'bg-elevated border-border text-text hover:border-primary/40'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {q.type !== 'mcq' && (
        <textarea
          value={selected}
          onChange={e => !submitted && setSelected(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer…"
          rows={4}
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none mb-4"
        />
      )}

      {submitted && (
        <div className={`rounded-xl p-3 mb-4 flex items-start gap-2 ${isCorrect ? 'bg-success/10 border border-success/20' : 'bg-danger/10 border border-danger/20'}`}>
          {isCorrect
            ? <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
          }
          <div>
            <p className={`text-xs font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
              {isCorrect ? 'Correct! 🎉' : `Incorrect. Answer: ${q.correctAnswer}`}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{q.explanation}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="flex-1 bg-gradient-brand text-white font-semibold py-2.5 rounded-btn shadow hover:opacity-90 disabled:opacity-40"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 bg-gradient-brand text-white font-semibold py-2.5 rounded-btn shadow hover:opacity-90 flex items-center justify-center gap-2"
          >
            {current + 1 >= questions.length ? 'See results' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function QuizResult({ score, total, onRetry }: { score: number; total: number; onRetry: () => void }) {
  const pct = Math.round((score / total) * 100)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)

  if (pct >= 80) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    triggerConfetti()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface border border-border rounded-card p-8 text-center shadow-sm"
    >
      <HootMascot expression={pct >= 60 ? 'celebrating' : 'encouraging'} size="lg" />
      <h2 className="font-heading font-extrabold text-3xl text-text mt-4">{score}/{total}</h2>
      <p className="text-text-muted mt-1 mb-4">{pct}% correct</p>

      <div className="w-full bg-border rounded-full h-3 mb-6">
        <div className="h-3 rounded-full bg-gradient-brand transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <p className="text-sm text-text-muted mb-6">
        {pct >= 80 ? '🌟 Outstanding! Keep it up!' : pct >= 60 ? '👍 Good job! A bit more practice and you\'ll nail it.' : '💪 Keep going! Revise and try again.'}
      </p>

      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 bg-elevated border border-border text-text font-semibold py-2.5 rounded-btn hover:bg-border transition-colors flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
        <button onClick={onRetry} className="flex-1 bg-gradient-brand text-white font-semibold py-2.5 rounded-btn shadow hover:opacity-90">
          New Quiz
        </button>
      </div>
    </motion.div>
  )
}

function FlashcardSection() {
  const flashcards = useLiveQuery(() => db.flashcards.toArray()) ?? []
  const demoMode = useAppStore(s => s.demoMode)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const cards = demoMode ? [
    { id: '1', front: 'What is photosynthesis?', back: 'The process by which plants use sunlight, water, and CO₂ to produce glucose and oxygen.', subject: 'Science', chapter: 'Photosynthesis', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDue: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: '2', front: 'What is Newton\'s second law?', back: 'F = ma — Force equals mass times acceleration.', subject: 'Physics', chapter: 'Laws of Motion', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDue: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: '3', front: 'What is a polynomial?', back: 'An expression of two or more algebraic terms, e.g. 2x² + 3x − 5.', subject: 'Mathematics', chapter: 'Polynomials', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDue: new Date().toISOString(), createdAt: new Date().toISOString() },
  ] : flashcards

  if (cards.length === 0) return (
    <div className="bg-surface border border-border rounded-card p-6 text-center">
      <Layers className="w-8 h-8 text-primary/40 mx-auto mb-3" />
      <p className="text-sm text-text-muted">No flashcards yet. Generate them from a PDF in the Tutor chat.</p>
    </div>
  )

  const card = cards[current % cards.length]

  return (
    <div className="bg-surface border border-border rounded-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-text">Flashcards</h2>
        </div>
        <span className="text-xs text-text-muted">{current + 1} / {cards.length}</span>
      </div>

      <div
        className="w-full min-h-36 bg-elevated border border-border rounded-2xl p-6 flex items-center justify-center cursor-pointer text-center transition-all hover:border-primary/40 mb-4"
        onClick={() => setFlipped(!flipped)}
      >
        <div>
          <p className="text-xs font-semibold text-primary mb-2">{flipped ? 'Answer' : 'Question'}</p>
          <p className="text-sm font-medium text-text">{flipped ? card.back : card.front}</p>
          {!flipped && <p className="text-xs text-text-muted mt-3">Tap to reveal answer</p>}
        </div>
      </div>

      {flipped && (
        <div className="flex gap-3">
          <button
            onClick={() => { setCurrent(c => (c + 1) % cards.length); setFlipped(false) }}
            className="flex-1 flex items-center justify-center gap-2 bg-danger/10 border border-danger/20 text-danger font-semibold py-2.5 rounded-btn hover:bg-danger/20 transition-colors"
          >
            <ThumbsDown className="w-4 h-4" /> Again
          </button>
          <button
            onClick={() => { setCurrent(c => (c + 1) % cards.length); setFlipped(false) }}
            className="flex-1 flex items-center justify-center gap-2 bg-success/10 border border-success/20 text-success font-semibold py-2.5 rounded-btn hover:bg-success/20 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" /> Got it
          </button>
        </div>
      )}
    </div>
  )
}

type StudyView = 'home' | 'quiz' | 'result'

export default function Study() {
  const [view, setView] = useState<StudyView>('home')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)

  const handleQuizStart = (qs: QuizQuestion[]) => {
    setQuizQuestions(qs)
    setView('quiz')
  }

  const handleQuizDone = (score: number, total: number) => {
    setResult({ score, total })
    setView('result')
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-24 md:pb-6 space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="font-heading font-extrabold text-2xl text-text">Study</h1>
      </div>

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <QuizGenerator onStart={handleQuizStart} />
            <FlashcardSection />
          </motion.div>
        )}

        {view === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => setView('home')} className="text-xs text-text-muted hover:text-primary mb-4 flex items-center gap-1">
              ← Back
            </button>
            <QuizCard questions={quizQuestions} onDone={handleQuizDone} />
          </motion.div>
        )}

        {view === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuizResult score={result.score} total={result.total} onRetry={() => setView('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
