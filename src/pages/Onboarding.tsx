/**
 * Onboarding wizard — 4 animated steps: name, board+class, subjects, marks card.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Upload, Shield, Loader2 } from 'lucide-react'
import { db } from '../lib/db'
import { useAppStore } from '../store/appStore'
import { seedDemoData } from '../data/demo'
import { BOARDS } from '../data/boards'
import { SUBJECTS_BY_CLASS } from '../data/subjects'
import { HootMascot } from '../components/hoot/HootMascot'
import { processPDF } from '../lib/pdf'
import { streamChat, buildMarksPrompt } from '../lib/llm'

const CLASSES = [6, 7, 8, 9, 10]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-primary' : i < current ? 'w-2 bg-primary/50' : 'w-2 bg-border'}`} />
      ))}
    </div>
  )
}

type Step = 0 | 1 | 2 | 3

export default function Onboarding() {
  const navigate = useNavigate()
  const setDemoMode = useAppStore(s => s.setDemoMode)
  const setLanguage = useAppStore(s => s.setLanguage)

  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState('')
  const [language, setLang] = useState<'en' | 'hi'>('en')
  const [board, setBoard] = useState('')
  const [classLevel, setClassLevel] = useState(9)
  const [subjects, setSubjects] = useState<string[]>([])
  const [boardSearch, setBoardSearch] = useState('')
  const [marksProcessing, setMarksProcessing] = useState(false)
  const [marksProgress, setMarksProgress] = useState('')
  const [saving, setSaving] = useState(false)

  const availableSubjects = SUBJECTS_BY_CLASS[classLevel] ?? []

  const toggleSubject = (s: string) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const selectClass = (c: number) => {
    setClassLevel(c)
    setSubjects((SUBJECTS_BY_CLASS[c] ?? []).map(s => s.id))
  }

  const selectBoard = (b: string) => {
    setBoard(b)
    setBoardSearch('')
  }

  const filteredBoards = BOARDS.filter(b =>
    b.name.toLowerCase().includes(boardSearch.toLowerCase()) ||
    (b.fullName ?? '').toLowerCase().includes(boardSearch.toLowerCase())
  )

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2
    if (step === 1) return board !== '' && classLevel >= 6
    if (step === 2) return subjects.length > 0
    return true
  }

  const handleNext = () => {
    if (step === 1 && subjects.length === 0) {
      setSubjects(availableSubjects.map((s: { id: string }) => s.id))
    }
    if (step < 3) setStep(s => (s + 1) as Step)
    else handleFinish()
  }

  const handleFinish = async () => {
    setSaving(true)
    setLanguage(language)
    await db.studentProfile.put({
      id: 1,
      name: name.trim(),
      board,
      classLevel,
      subjects,
      language,
      xp: 0,
      streak: 0,
      lastStudyDate: null,
      examDates: [],
      createdAt: new Date().toISOString(),
    })
    navigate('/app/home')
  }

  const handleMarksUpload = async (file: File) => {
    setMarksProcessing(true)
    try {
      const result = await processPDF(file, msg => setMarksProgress(msg))
      const ocrText = result.fullText.slice(0, 2000) // Keep small — only text to LLM

      const messages = buildMarksPrompt(ocrText)
      let jsonText = ''

      await streamChat(
        { messages },
        token => { jsonText += token },
        async full => {
          try {
            const parsed = JSON.parse(full)
            if (parsed.entries && Array.isArray(parsed.entries)) {
              await db.marksEntries.add({
                id: `marks-${Date.now()}`,
                examName: 'Uploaded Marks Card',
                entries: parsed.entries,
                uploadedAt: new Date().toISOString(),
              })
            }
          } catch { /* Will show fix-manually UI */ }
          setMarksProcessing(false)
          setMarksProgress('')
        },
        () => { setMarksProcessing(false); setMarksProgress('') }
      )
    } catch {
      setMarksProcessing(false)
      setMarksProgress('')
    }
  }

  const handleDemoMode = async () => {
    setDemoMode(true)
    await seedDemoData(db)
    navigate('/app/home')
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  const [direction, setDirection] = useState(1)

  const goNext = () => { setDirection(1); handleNext() }
  const goBack = () => { setDirection(-1); setStep(s => Math.max(0, s - 1) as Step) }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="mb-6 text-center">
        <HootMascot expression="encouraging" size="md" />
        <p className="text-xs text-text-muted mt-2 font-semibold">Study smart. Score high.</p>
      </div>

      <div className="w-full max-w-md">
        <StepIndicator current={step} total={4} />

        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 0 — Name & Language */}
          {step === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-surface border border-border rounded-card p-6 shadow-md"
            >
              <h1 className="font-heading font-extrabold text-2xl text-text mb-1">Hey there! 👋</h1>
              <p className="text-text-muted text-sm mb-6">What should Hoot call you?</p>

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-base text-text placeholder:text-text-muted focus:outline-none focus:border-primary mb-5"
                onKeyDown={e => e.key === 'Enter' && canNext() && goNext()}
              />

              <p className="text-sm font-semibold text-text mb-3">Preferred language</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                {(['en', 'hi'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`py-3 rounded-xl border font-semibold text-sm transition-all ${language === l ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'}`}
                  >
                    {l === 'en' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1 — Board & Class */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-surface border border-border rounded-card p-6 shadow-md"
            >
              <h1 className="font-heading font-extrabold text-2xl text-text mb-1">Your school details</h1>
              <p className="text-text-muted text-sm mb-5">We'll personalise Thinkr for your syllabus.</p>

              <p className="text-sm font-semibold text-text mb-2">Class</p>
              <div className="flex gap-2 mb-5">
                {CLASSES.map(c => (
                  <button
                    key={c}
                    onClick={() => selectClass(c)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${classLevel === c ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <p className="text-sm font-semibold text-text mb-2">Board</p>
              <input
                type="text"
                placeholder="Search board…"
                value={boardSearch}
                onChange={e => setBoardSearch(e.target.value)}
                className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary mb-2"
              />
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredBoards.map(b => (
                  <button
                    key={b.id}
                    onClick={() => selectBoard(b.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${board === b.id ? 'bg-primary-soft border-primary text-primary' : 'border-border text-text hover:border-primary/30'}`}
                  >
                    <span className="font-semibold">{b.name}</span>
                    {b.fullName && <span className="text-text-muted ml-2 text-xs">{b.fullName}</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Subjects */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-surface border border-border rounded-card p-6 shadow-md"
            >
              <h1 className="font-heading font-extrabold text-2xl text-text mb-1">Your subjects</h1>
              <p className="text-text-muted text-sm mb-5">Select the subjects you study. You can change this later.</p>

              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {availableSubjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleSubject(s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${subjects.includes(s.id) ? 'bg-primary-soft border-primary text-primary' : 'border-border text-text hover:border-primary/30'}`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span>{s.name}</span>
                    {subjects.includes(s.id) && <Check className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setSubjects(availableSubjects.map(s => s.id))} className="text-xs text-primary hover:underline mt-3">
                Select all
              </button>
            </motion.div>
          )}

          {/* Step 3 — Optional marks card */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-surface border border-border rounded-card p-6 shadow-md"
            >
              <h1 className="font-heading font-extrabold text-2xl text-text mb-1">Upload marks card</h1>
              <p className="text-text-muted text-sm mb-4">Optional — helps Thinkr identify your weak areas instantly.</p>

              <div className="flex items-start gap-2 bg-success/10 border border-success/20 rounded-xl p-3 mb-5">
                <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-xs text-success font-medium">Your marks card is processed entirely on your device. It never leaves your browser.</p>
              </div>

              <label className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all ${marksProcessing ? 'border-warning/40 bg-warning/5' : 'border-border hover:border-primary/40 hover:bg-primary-soft/30'}`}>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleMarksUpload(f) }}
                />
                {marksProcessing ? (
                  <>
                    <Loader2 className="w-8 h-8 text-warning animate-spin" />
                    <p className="text-sm font-semibold text-warning">{marksProgress || 'Processing…'}</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-text-muted" />
                    <p className="text-sm font-semibold text-text">Upload PDF or photo</p>
                    <p className="text-xs text-text-muted">Marks card, report card, or result sheet</p>
                  </>
                )}
              </label>

              <p className="text-xs text-text-muted text-center mt-3">
                You can also skip this and upload later from the Library.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <button onClick={goBack} className="flex items-center gap-2 px-5 py-3 bg-elevated border border-border rounded-btn text-sm font-semibold text-text hover:bg-border transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canNext() || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-brand text-white font-semibold py-3 rounded-btn shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : step === 3 ? <>Let\'s go! 🚀</> : <>Next <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Demo mode shortcut */}
        {step === 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-text-muted mb-2">Want to explore first?</p>
            <button onClick={handleDemoMode} className="text-sm font-semibold text-primary hover:underline">
              Try demo mode instead →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
