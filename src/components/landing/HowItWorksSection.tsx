import { motion } from 'framer-motion'
import { UploadCloud, MessageSquareText, TrendingUp } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const STEPS = [
  {
    step: '01',
    title: 'Upload your PDF or notes',
    description:
      'Drag & drop NCERT books, state board textbooks, classroom notes, or your recent exam marks card. Everything stays in your browser.',
    icon: UploadCloud,
  },
  {
    step: '02',
    title: 'Ask doubts or take quizzes',
    description:
      'Ask complex questions in English or Hindi. Get answers cited straight to your page number, or generate board-pattern mock tests with one click.',
    icon: MessageSquareText,
  },
  {
    step: '03',
    title: 'Track mastery & score high',
    description:
      'Watch your weak subjects turn green. Follow an AI-generated daily study plan, keep up your streak, and earn badges as you master topics.',
    icon: TrendingUp,
  },
]

export function HowItWorksSection() {
  const shouldReduce = useReducedMotion()

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-bg-soft/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
            How Thinkr Works
          </h2>
          <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-text tracking-tight">
            From textbook to top marks in three steps
          </h3>
          <p className="mt-4 text-base sm:text-lg text-text-muted">
            No expensive coaching, no generic internet answers. Strictly tailored to your board and syllabus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={shouldReduce ? {} : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative bg-surface rounded-2xl p-8 border border-border hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-heading font-extrabold text-3xl text-border group-hover:text-primary/30 transition-colors">
                    {item.step}
                  </span>
                </div>

                <h4 className="font-heading font-bold text-xl text-text mb-3">{item.title}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

