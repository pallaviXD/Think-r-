/**
 * Tutor page — AI chat with uploaded PDFs, source chips, voice input, streaming.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Mic, MicOff, Volume2, VolumeX, Plus, BookOpen,
  Sparkles, ChevronDown, Loader2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { searchChunks, buildIndex } from '../lib/search'
import { streamChat, buildSystemPrompt, demoLLM, type ChatMode, type ChatLevel } from '../lib/llm'
import { startSTT, stopSTT, speak, stopSpeaking, isSpeechRecognitionSupported, isSpeaking } from '../lib/voice'
import { useAppStore } from '../store/appStore'
import { useUIStore } from '../store/uiStore'
import { HootMascot } from '../components/hoot/HootMascot'
import { DEMO_DATA } from '../data/demo'
import type { ChatMessage, TextChunk } from '../lib/db'
import MiniSearch from 'minisearch'

type UIMode = ChatMode
type UILevel = ChatLevel

const MODE_LABELS: Record<UIMode, string> = {
  guide: '🧭 Guide me',
  explain: '💡 Just explain',
  exam: '📝 Exam answer',
}

const LEVEL_LABELS: Record<UILevel, string> = {
  simple: 'Simple',
  class: 'Class level',
  topper: 'Topper',
}

function SourceChip({ docName, pageNumber }: { docName: string; pageNumber: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary-soft border border-primary/20 rounded-full px-2.5 py-0.5">
      <BookOpen className="w-3 h-3" />
      {docName}, p.{pageNumber}
    </span>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-gradient-brand text-white rounded-[20px_20px_4px_20px] px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

function AssistantBubble({
  content,
  sources,
  isStreaming,
  onReadAloud,
}: {
  content: string
  sources?: ChatMessage['sources']
  isStreaming?: boolean
  onReadAloud: (text: string) => void
}) {
  const [speaking, setSpeaking] = useState(false)

  const handleReadAloud = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      speak(content, 'en-IN', 1.0, undefined, () => setSpeaking(false))
      onReadAloud(content)
    }
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-primary-soft border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
        <HootMascot expression={isStreaming ? 'thinking' : 'happy'} size="sm" animate={false} />
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className="bg-surface border-l-[3px] border-primary border border-border rounded-[4px_20px_20px_20px] px-4 py-3 shadow-sm">
          {isStreaming && content === '' ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-text">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {content}
              </ReactMarkdown>
            </div>
          )}

          {/* Sources */}
          {sources && sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border">
              {sources.map((s, i) => (
                <SourceChip key={i} docName={s.docName} pageNumber={s.pageNumber} />
              ))}
            </div>
          )}
        </div>

        {/* Read aloud */}
        {!isStreaming && content && (
          <button
            onClick={handleReadAloud}
            className="mt-1 ml-1 flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors"
          >
            {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {speaking ? 'Stop reading' : 'Read aloud'}
          </button>
        )}
      </div>
    </div>
  )
}

function HootError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const messages: Record<string, string> = {
    rate_limit: 'Rate limit hit — wait a moment and retry.',
    invalid_key: 'API key rejected. Go to Profile → Settings and add a fresh key.',
    no_key: 'No API key set. Go to Profile → Settings and add your Gemini key.',
    network: 'Network error — check your internet connection.',
    both_failed: 'AI service unreachable. Check browser console (F12) for details.',
  }
  const msg = messages[error] ?? `Error: ${error}. Check browser console (F12).`
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <HootMascot expression="sleeping" size="lg" />
      <h3 className="font-heading font-bold text-text mt-4 mb-2">Hoot is resting…</h3>
      <p className="text-sm text-text-muted mb-1">{msg}</p>
      <p className="text-xs text-text-muted mb-4 font-mono bg-elevated px-3 py-1 rounded-lg">{error}</p>
      <button onClick={onRetry} className="bg-gradient-brand text-white text-sm font-semibold px-5 py-2.5 rounded-btn shadow hover:opacity-90 transition-opacity">
        Retry
      </button>
    </div>
  )
}

export default function Tutor() {
  const demoMode = useAppStore(s => s.demoMode)
  const language = useAppStore(s => s.language)
  const setHootExpression = useUIStore(s => s.setHootExpression)

  const profile = useLiveQuery(() => db.studentProfile.get(1))
  const allDocs = useLiveQuery(() => db.pdfDocuments.toArray())
  const allChunks = useLiveQuery(() => db.textChunks.toArray())

  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; sources?: ChatMessage['sources']; isStreaming?: boolean }>>([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<UIMode>('explain')
  const [level, setLevel] = useState<UILevel>('class')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [searchIndex, setSearchIndex] = useState<MiniSearch | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load demo messages
  useEffect(() => {
    if (demoMode && messages.length === 0) {
      const demoMsgs = DEMO_DATA.chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        sources: m.sources,
      }))
      setMessages(demoMsgs)
    }
  }, [demoMode])

  // Build BM25 index from chunks
  useEffect(() => {
    if (allChunks && allChunks.length > 0) {
      const idx = buildIndex(allChunks)
      setSearchIndex(idx)
    }
  }, [allChunks])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || isLoading) return

    setInput('')
    setError(null)
    setIsLoading(true)
    setHootExpression('thinking')

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: q }])

    // Retrieve relevant chunks (top 4, ~1200 tokens)
    let chunks: TextChunk[] = []
    if (searchIndex && allChunks) {
      chunks = searchChunks(q, searchIndex, 4)
    }

    // Build sources from chunks
    const sources = chunks.map(c => {
      const doc = allDocs?.find(d => d.id === c.docId)
      return { docId: c.docId, docName: doc?.name ?? 'Unknown', pageNumber: c.pageNumber }
    })

    // Add empty streaming assistant bubble
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources, isStreaming: true }])

    // Build history (last 4 turns to stay within token budget)
    const history = messages.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const displayProfile = demoMode ? DEMO_DATA.profile : profile
    if (!displayProfile) { setIsLoading(false); return }

    const systemPrompt = buildSystemPrompt(displayProfile as any, mode, level, chunks)

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...history,
      { role: 'user' as const, content: q },
    ]

    const llm = demoMode ? demoLLM : { streamChat }

    await llm.streamChat(
      { messages: chatMessages, userApiKey: localStorage.getItem('thinkr-own-key') ?? undefined },
      (token) => {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: last.content + token }]
          }
          return prev
        })
      },
      (fullText) => {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: fullText, isStreaming: false, sources }]
          }
          return prev
        })
        setIsLoading(false)
        setHootExpression('happy')
        // Save to DB
        if (!demoMode) {
          db.chatMessages.add({ id: `msg-${Date.now()}-u`, sessionId, role: 'user', content: q, timestamp: new Date().toISOString() })
          db.chatMessages.add({ id: `msg-${Date.now()}-a`, sessionId, role: 'assistant', content: fullText, sources, timestamp: new Date().toISOString() })
        }
      },
      (errType) => {
        console.error('[Tutor] LLM error:', errType)
        setError(errType)
        setMessages(prev => prev.filter(m => !m.isStreaming)) // remove empty bubble
        setIsLoading(false)
        setHootExpression('sleeping')
      }
    )
  }, [input, isLoading, messages, mode, level, profile, demoMode, searchIndex, allChunks, allDocs, sessionId, setHootExpression])

  const handleVoice = () => {
    if (isListening) {
      stopSTT()
      setIsListening(false)
      return
    }
    if (!isSpeechRecognitionSupported()) return
    setIsListening(true)
    startSTT(
      language === 'hi' ? 'hi-IN' : 'en-IN',
      (transcript, isFinal) => {
        setInput(transcript)
        if (isFinal) {
          setIsListening(false)
          handleSend(transcript)
        }
      },
      () => setIsListening(false)
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const SUGGESTIONS = [
    'Explain this concept with an Indian example',
    'Give me 3 practice questions',
    'Summarise what I should know for the exam',
    'What is the difference between A and B?',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-2">
        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <HootMascot expression="happy" size="lg" />
            <h2 className="font-heading font-bold text-xl text-text mt-4 mb-2">What would you like to study?</h2>
            <p className="text-text-muted text-sm mb-6 max-w-xs">Ask a question, get an explanation, or request practice questions from your uploaded PDFs.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs text-left bg-surface border border-border rounded-xl px-3 py-2 hover:border-primary/40 hover:bg-primary-soft transition-all text-text-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <HootError error={error} onRetry={() => { setError(null); handleSend() }} />}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === 'user'
                ? <UserBubble content={msg.content} />
                : <AssistantBubble
                    content={msg.content}
                    sources={msg.sources}
                    isStreaming={msg.isStreaming}
                    onReadAloud={() => {}}
                  />
              }
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-surface px-4 pt-3 pb-4">
        {/* Mode + Level chips */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
          {(Object.entries(MODE_LABELS) as [UIMode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${mode === m ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-muted hover:border-primary/40'}`}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
          {(Object.entries(LEVEL_LABELS) as [UILevel, string][]).map(([l, label]) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${level === l ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface border-border text-text-muted hover:border-primary/40'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-elevated border border-border rounded-2xl px-4 py-2.5 flex items-end gap-2 focus-within:border-primary transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a doubt, type a question…"
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted resize-none focus:outline-none max-h-32 leading-relaxed"
              rows={1}
              style={{ minHeight: '24px' }}
            />
          </div>

          {isSpeechRecognitionSupported() && (
            <button
              onClick={handleVoice}
              aria-label={isListening ? 'Stop recording' : 'Start voice input'}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm ${isListening ? 'bg-danger text-white animate-pulse' : 'bg-elevated border border-border text-text-muted hover:border-primary hover:text-primary'}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="w-11 h-11 rounded-full bg-gradient-brand text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
