import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { HootMascot } from '../hoot/HootMascot'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const TESTIMONIALS = [
  {
    name: 'Aarav Patel',
    grade: 'Class 10 · CBSE (Delhi)',
    score: '96% in Midterms',
    quote:
      'The board-style mock questions were scarily similar to my actual school pre-board exam. I stopped stressing over revision after using Thinkr.',
  },
  {
    name: 'Ananya Deshmukh',
    grade: 'Class 9 · Maharashtra Board (Pune)',
    score: 'Went from 62% to 88% in Science',
    quote:
      'I uploaded my half-yearly marks card and Thinkr pinpointed that I was losing marks in physics numericals. The daily 20-min plan helped me fix it in 2 weeks!',
  },
  {
    name: 'Rohan Sundaram',
    grade: 'Class 8 · ICSE (Bengaluru)',
    score: '30-day streak',
    quote:
      'Having page citations for every single answer means my teacher never questions my homework. Plus, Hoot celebrates whenever I finish my daily tasks!',
  },
]

export function MadeByStudents() {
  const shouldReduce = useReducedMotion()

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="max-w-2xl text-center md:text-left">
            <h2 className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
              Real Student Stories
            </h2>
            <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-text tracking-tight">
              Made by students, for students
            </h3>
            <p className="mt-3 text-base text-text-muted">
              Built to solve real exam anxiety and replace expensive coaching classes.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            <HootMascot expression="celebrating" size="md" animate />
            <div>
              <div className="flex items-center gap-1 text-warning mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning" />
                ))}
              </div>
              <p className="text-xs font-bold text-text">Loved by 10,000+ students</p>
              <p className="text-[11px] text-text-muted">Across 20+ Indian State Boards</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={idx}
              initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.12 }}
              className="bg-surface rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
            >
              <Quote className="w-8 h-8 text-primary/15 absolute top-5 right-5" />
              <div>
                <span className="inline-block px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold mb-4">
                  {t.score}
                </span>
                <p className="text-sm text-text-muted leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-heading font-bold text-sm text-text">{t.name}</h4>
                <p className="text-[11px] text-text-muted mt-0.5">{t.grade}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

