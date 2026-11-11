import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface FAQItem {
  q: string
  a: string
}

const FAQS: FAQItem[] = [
  {
    q: 'Do my uploaded textbooks or notes leave my device?',
    a: 'Never! Thinkr parses PDFs, notes, and marks cards directly inside your browser using WebAssembly. Only small 300-word snippets needed to answer your specific question are sent to the AI proxy. Your raw files stay 100% on your device.',
  },
  {
    q: 'Is Thinkr completely free?',
    a: 'Yes, Thinkr is 100% free for students. You can also plug in your own free Groq or OpenRouter API key in Profile settings if you want unlimited high-speed queries.',
  },
  {
    q: 'Which education boards and classes are supported?',
    a: 'Thinkr is pre-configured with CBSE, ICSE, and all 28 State & UT Boards across India for students in Class 6, 7, 8, 9, and 10.',
  },
  {
    q: 'Does Thinkr work offline?',
    a: 'Yes! Thinkr is a Progressive Web App (PWA). Once installed, your profile, flashcards, textbook text chunks, and revision queues work offline via IndexedDB.',
  },
  {
    q: 'Is Hindi language and voice supported?',
    a: 'Yes. You can switch Thinkr to Hindi at any time. The voice tutor reads textbook answers in clear Indian English (en-IN) or Hindi (hi-IN) using browser-native speech synthesis.',
  },
  {
    q: 'What types of documents can I upload?',
    a: 'You can upload textbook PDFs, classroom revision notes, previous-year question papers, and photos/scans of your exam marks cards (PNG, JPG, or PDF). Scanned pages are automatically processed with built-in OCR.',
  },
  {
    q: 'Do I need to sign up or create an account?',
    a: 'No login, no phone number, and no email required. Your entire study history is stored locally in your browser’s IndexedDB sandbox for ultimate privacy and speed.',
  },
  {
    q: 'Can I backup or transfer my study progress to another device?',
    a: 'Yes! From the Profile page, you can export your entire study history, marks cards, and quiz results as a single JSON file and import it anytime on another device.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const shouldReduce = useReducedMotion()

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" className="py-20 md:py-32 bg-bg-soft/50 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
            Got Questions?
          </h2>
          <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-text tracking-tight">
            Frequently Asked Questions
          </h3>
          <p className="mt-4 text-base text-text-muted">
            Everything you need to know about privacy, boards, and offline support.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="bg-surface border border-border rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading font-bold text-base sm:text-lg text-text pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-elevated flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-text-muted'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={shouldReduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                      exit={shouldReduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-text-muted leading-relaxed border-t border-border/50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

