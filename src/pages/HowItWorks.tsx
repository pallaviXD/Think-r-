/**
 * How Thinkr Works — architecture diagram, tech stack, PDF pipeline explanation.
 * Written so a Class 9 student can present this at a school exhibition.
 */

import { motion } from 'framer-motion'
import { ArrowRight, Database, Server, Cpu, FileText, Search, Zap, Shield } from 'lucide-react'

function ArchStep({
  icon: Icon,
  label,
  desc,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  desc: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="text-sm font-bold text-text">{label}</p>
      <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-[120px]">{desc}</p>
    </div>
  )
}

const TECH_STACK = [
  { name: 'React + Vite', role: 'UI framework & build tool', emoji: '⚡' },
  { name: 'TypeScript', role: 'Type-safe JavaScript', emoji: '🔷' },
  { name: 'Tailwind CSS', role: 'Utility-first styling', emoji: '🎨' },
  { name: 'Framer Motion', role: 'Animations', emoji: '🎬' },
  { name: 'Dexie (IndexedDB)', role: 'In-browser database', emoji: '💾' },
  { name: 'pdf.js', role: 'PDF text extraction', emoji: '📄' },
  { name: 'Tesseract.js', role: 'OCR for scanned pages', emoji: '👁️' },
  { name: 'MiniSearch', role: 'BM25 search index', emoji: '🔍' },
  { name: 'Groq API', role: 'Fast AI inference (primary)', emoji: '🤖' },
  { name: 'OpenRouter', role: 'AI fallback provider', emoji: '🔄' },
  { name: 'Netlify Functions', role: 'Serverless proxy', emoji: '☁️' },
  { name: 'Web Speech API', role: 'Voice input & TTS', emoji: '🎤' },
  { name: 'KaTeX', role: 'Math equation rendering', emoji: '🔢' },
  { name: 'Recharts', role: 'Progress charts', emoji: '📊' },
]

const FAQS = [
  {
    q: 'How does Thinkr answer from my textbook?',
    a: 'When you upload a PDF, Thinkr extracts its text page by page using pdf.js. It then splits the text into chunks of about 400 words and builds a search index (called BM25). When you ask a question, Thinkr finds the 3–4 most relevant chunks and sends only those to the AI — not the whole book. The AI then answers based on those chunks and tells you which page it came from.'
  },
  {
    q: 'Does my PDF get uploaded to any server?',
    a: 'No! Your files never leave your device. All PDF reading and OCR happens inside your browser using pdf.js and Tesseract.js. Only the small text snippets (about 400 words) relevant to your question are sent to the AI via our secure proxy.'
  },
  {
    q: 'What is a serverless proxy and why do we need it?',
    a: 'API keys for AI services must be kept secret. If we put them in the browser code, anyone could steal them. So we have a small cloud function (on Netlify) that holds the keys. Your browser sends the question to our function, the function calls the AI with the secret key, and streams the answer back to you. The key never touches your browser.'
  },
  {
    q: 'What is BM25 search?',
    a: 'BM25 (Best Match 25) is a ranking algorithm used by search engines like Google. It scores each text chunk by how relevant it is to your question, based on word frequency and document length. We use a library called MiniSearch to run BM25 entirely in your browser — no server needed.'
  },
  {
    q: 'How does spaced repetition work in flashcards?',
    a: 'Spaced repetition is a proven study technique. When you mark a flashcard as "Got it", the app schedules it to appear again in a few days. If you mark it "Again", it comes back tomorrow. Over time, easy cards appear less often and hard cards appear more — so you spend your time on what you actually need to practise.'
  },
]

export default function HowItWorks() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 md:pb-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-text mb-2">How Thinkr Works</h1>
        <p className="text-text-muted">A simple explanation of the technology behind Thinkr — written so anyone can understand and present it.</p>
      </motion.div>

      {/* Architecture Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-card p-6 shadow-sm"
      >
        <h2 className="font-heading font-bold text-lg text-text mb-6">System Architecture</h2>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
          <ArchStep icon={FileText} label="Your PDF" desc="Stays on device" color="bg-primary" />
          <ArrowRight className="w-5 h-5 text-primary mx-2 flex-shrink-0" />
          <ArchStep icon={Cpu} label="pdf.js + OCR" desc="Extracts text in browser" color="bg-orange-500" />
          <ArrowRight className="w-5 h-5 text-primary mx-2 flex-shrink-0" />
          <ArchStep icon={Search} label="BM25 Search" desc="Finds relevant chunks" color="bg-amber-500" />
          <ArrowRight className="w-5 h-5 text-primary mx-2 flex-shrink-0" />
          <ArchStep icon={Server} label="Proxy" desc="Adds secret API key" color="bg-sky-500" />
          <ArrowRight className="w-5 h-5 text-primary mx-2 flex-shrink-0" />
          <ArchStep icon={Zap} label="Groq LLM" desc="Generates answer" color="bg-violet-500" />
          <ArrowRight className="w-5 h-5 text-primary mx-2 flex-shrink-0" />
          <ArchStep icon={Database} label="IndexedDB" desc="Saves your progress" color="bg-emerald-500" />
        </div>

        <div className="mt-6 bg-primary-soft border border-primary/20 rounded-2xl p-4">
          <p className="text-sm text-text leading-relaxed">
            <strong className="text-primary">Key privacy point:</strong> Your PDF files and marks card images <strong>never leave your device</strong>. Only the small text snippets that answer your question (about 400 words) are sent to the AI through our secure proxy. The proxy holds the API key so your browser never sees it.
          </p>
        </div>
      </motion.div>

      {/* How PDF answering works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-border rounded-card p-6 shadow-sm"
      >
        <h2 className="font-heading font-bold text-lg text-text mb-4">How PDF answering works</h2>
        <div className="space-y-4">
          {[
            { n: '1', title: 'You upload a PDF', desc: 'Could be your textbook, notes, or a question paper. Thinkr supports text PDFs and scanned images.' },
            { n: '2', title: 'Text extraction', desc: 'pdf.js reads every page. If a page is a scanned image (no text), Tesseract.js runs OCR on it, even for Hindi text.' },
            { n: '3', title: 'Chunking', desc: 'The text is split into chunks of ~400 words, each tagged with the page number. This gives us manageable pieces to search.' },
            { n: '4', title: 'BM25 indexing', desc: 'MiniSearch builds a search index from all chunks so we can find the most relevant ones in milliseconds.' },
            { n: '5', title: 'You ask a question', desc: 'Your question is searched against the index. The top 3–4 matching chunks are selected.' },
            { n: '6', title: 'AI answers from your book', desc: 'Only those chunks + your question are sent to the AI (via proxy). The AI answers using that content and cites the page number.' },
          ].map(step => (
            <div key={step.n} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-brand text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-bold text-text">{step.title}</p>
                <p className="text-sm text-text-muted mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How mastery tracking works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-border rounded-card p-6 shadow-sm"
      >
        <h2 className="font-heading font-bold text-lg text-text mb-4">How mastery tracking works</h2>
        <p className="text-sm text-text-muted mb-4">Every time you interact with a subject or chapter, your mastery score updates:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { action: 'Chat answer', effect: '+5% mastery', color: 'text-primary bg-primary-soft' },
            { action: 'Quiz correct', effect: '+10% mastery', color: 'text-success bg-success/10' },
            { action: 'Flashcard "Got it"', effect: 'Extends review interval', color: 'text-warning bg-warning/10' },
          ].map(item => (
            <div key={item.action} className={`rounded-xl p-3 border ${item.color} border-current/20`}>
              <p className="text-sm font-bold">{item.action}</p>
              <p className="text-xs opacity-80 mt-0.5">{item.effect}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-muted mt-4">The mastery heatmap shows which chapters you've practised most. Weak chapters (below 60%) are flagged with "Practice now" buttons.</p>
      </motion.div>

      {/* Tech stack */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-surface border border-border rounded-card p-6 shadow-sm"
      >
        <h2 className="font-heading font-bold text-lg text-text mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TECH_STACK.map(t => (
            <div key={t.name} className="flex items-start gap-2.5 p-3 bg-elevated rounded-xl">
              <span className="text-lg">{t.emoji}</span>
              <div>
                <p className="text-xs font-bold text-text">{t.name}</p>
                <p className="text-[11px] text-text-muted">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-border rounded-card p-6 shadow-sm"
      >
        <h2 className="font-heading font-bold text-lg text-text mb-4">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <p className="text-sm font-bold text-text mb-1.5">Q: {faq.q}</p>
              <p className="text-sm text-text-muted leading-relaxed">A: {faq.a}</p>
              {i < FAQS.length - 1 && <div className="border-b border-border mt-4" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Privacy summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gradient-brand rounded-card p-6 text-white"
      >
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-6 h-6" />
          <h2 className="font-heading font-bold text-lg">Privacy by design</h2>
        </div>
        <ul className="space-y-2 text-sm opacity-90">
          <li>✓ No login or account required</li>
          <li>✓ Files never uploaded to any server</li>
          <li>✓ All data stored in your browser's IndexedDB</li>
          <li>✓ API keys live only in environment variables on the server</li>
          <li>✓ You can export, import, or delete all data anytime</li>
        </ul>
      </motion.div>
    </div>
  )
}
