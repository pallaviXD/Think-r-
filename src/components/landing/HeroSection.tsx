import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Send, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/button'
import { HootMascot } from '../hoot/HootMascot'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useAppStore } from '../../store/appStore'
import { db } from '../../lib/db'
import { seedDemoData } from '../../data/demo'

const QUESTION_TEXT = 'What is photosynthesis?'
const ANSWER_TEXT =
  'Photosynthesis is the process by which green plants convert sunlight, water, and CO₂ into glucose and oxygen using chlorophyll inside chloroplasts.\n\n6CO₂ + 6H₂O ⟶ C₆H₁₂O₆ + 6O₂'

export function HeroSection() {
  const navigate = useNavigate()
  const setDemoMode = useAppStore((s) => s.setDemoMode)
  const shouldReduce = useReducedMotion()

  const [inputVal, setInputVal] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [isTypingAnswer, setIsTypingAnswer] = useState(false)
  const [showSource, setShowSource] = useState(false)

  // Typewriter demo loop
  useEffect(() => {
    let isCancelled = false

    const runSimulation = async () => {
      // Wait initial
      await new Promise((r) => setTimeout(r, 1200))
      if (isCancelled) return

      // Type question into input
      for (let i = 1; i <= QUESTION_TEXT.length; i++) {
        if (isCancelled) return
        setInputVal(QUESTION_TEXT.slice(0, i))
        await new Promise((r) => setTimeout(r, 50))
      }

      await new Promise((r) => setTimeout(r, 400))
      if (isCancelled) return

      // Send question
      setInputVal('')
      setMessages([{ role: 'user', text: QUESTION_TEXT }])
      setIsTypingAnswer(true)

      await new Promise((r) => setTimeout(r, 600))
      if (isCancelled) return

      // Stream assistant response
      for (let i = 1; i <= ANSWER_TEXT.length; i += 3) {
        if (isCancelled) return
        const partial = ANSWER_TEXT.slice(0, i)
        setMessages([
          { role: 'user', text: QUESTION_TEXT },
          { role: 'assistant', text: partial },
        ])
        await new Promise((r) => setTimeout(r, 25))
      }

      setMessages([
        { role: 'user', text: QUESTION_TEXT },
        { role: 'assistant', text: ANSWER_TEXT },
      ])
      setIsTypingAnswer(false)
      setShowSource(true)

      // Wait and reset
      await new Promise((r) => setTimeout(r, 6000))
      if (isCancelled) return
      setMessages([])
      setShowSource(false)
      runSimulation()
    }

    runSimulation()

    return () => {
      isCancelled = true
    }
  }, [])

  const handleDemoClick = async () => {
    setDemoMode(true)
    await seedDemoData(db)
    navigate('/app/home')
  }

  const headlineWords = ['Study', 'smart.', 'Score', 'high.']

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailored for CBSE, ICSE & State Boards (Class 6–10)</span>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-6xl md:text-7xl text-text tracking-tight leading-[1.08] mb-6">
              {headlineWords.map((word, i) => (
                <motion.span
                  key={i}
                  initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className={`inline-block mr-3 ${i >= 2 ? 'gradient-text' : ''}`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <p className="text-lg sm:text-xl text-text-muted max-w-2xl mb-8 leading-relaxed mx-auto lg:mx-0">
              The only AI tutor that reads your exact textbooks, pinpoints your weak areas from real marks cards, and creates daily study plans that actually work.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link to="/onboarding" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base font-semibold shadow-md shadow-primary/20">
                  <span>Start free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleDemoClick}
                className="w-full sm:w-auto gap-2 text-base"
              >
                <span>Watch demo</span>
              </Button>
            </div>

            {/* Badges / Trust points */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>100% Private — Files stay on device</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Zero login required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>English & Hindi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Mock Chat Window */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md w-full bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
              {/* Window Header */}
              <div className="bg-elevated px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    <HootMascot expression="thinking" size="sm" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text">Thinkr AI Tutor</h3>
                    <p className="text-[10px] text-text-muted">Science · Class 9 CBSE</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success/80 inline-block animate-pulse" />
                  <span className="text-[11px] font-medium text-text-muted">Active</span>
                </div>
              </div>

              {/* Chat Body */}
              <div className="p-4 min-h-[300px] max-h-[340px] flex flex-col justify-end space-y-3 bg-bg-soft/40">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center my-auto text-center p-4">
                    <HootMascot expression="happy" size="md" />
                    <p className="text-xs text-text-muted mt-2 font-medium">
                      Ask any question from your NCERT book!
                    </p>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-brand text-white shadow-sm'
                          : 'bg-surface border border-border text-text shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line font-body">{m.text}</p>

                      {m.role === 'assistant' && showSource && (
                        <div className="mt-2.5 pt-2 border-t border-border flex items-center gap-1.5 text-[10px] text-primary font-semibold">
                          <BookOpen className="w-3 h-3" />
                          <span>Source: Science Ch. 6, p. 42</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTypingAnswer && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] ml-1">Thinking...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-surface border-t border-border flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inputVal}
                  placeholder="Type a doubt..."
                  className="flex-1 bg-elevated text-xs text-text rounded-xl px-3 py-2 border border-border focus:outline-none"
                />
                <button
                  aria-label="Send message"
                  className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm disabled:opacity-50"
                  disabled={!inputVal}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

