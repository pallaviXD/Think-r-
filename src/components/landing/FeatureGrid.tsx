import { motion } from 'framer-motion'
import {
  BookOpen,
  BarChart3,
  ListChecks,
  Mic,
  Calendar,
  FileText,
  Smartphone,
} from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const FEATURES = [
  {
    title: 'Chat with your textbooks',
    description:
      'Answers are cited directly from your uploaded NCERT or state board chapters with exact page numbers.',
    icon: BookOpen,
  },
  {
    title: 'Marks card diagnosis',
    description:
      'Upload a photo or PDF of your report card. Thinkr spots weak topics and builds a personalized recovery strategy.',
    icon: BarChart3,
  },
  {
    title: 'Smart board-style quizzes',
    description:
      'Practice MCQs, short answer, and case-based questions crafted to your exact board exam format with instant feedback.',
    icon: ListChecks,
  },
  {
    title: 'Bilingual voice tutor',
    description:
      'Listen to textbook explanations read aloud with sentence highlighting in both Indian English and Hindi.',
    icon: Mic,
  },
  {
    title: 'Adaptive daily study plan',
    description:
      'Never wonder what to study next. Your AI tutor plans bite-sized 20-minute daily tasks targeting weak subjects.',
    icon: Calendar,
  },
  {
    title: 'Printable report card',
    description:
      'Download clean, printable progress reports to show your parents and teachers your real improvement.',
    icon: FileText,
  },
  {
    title: 'Works offline & on phone',
    description:
      'Install as a lightweight PWA on any Android, iPhone, or laptop. No heavy downloads or logins required.',
    icon: Smartphone,
  },
]

export function FeatureGrid() {
  const shouldReduce = useReducedMotion()

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
            Features Built For High Scores
          </h2>
          <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-text tracking-tight">
            Everything an Indian student needs to excel
          </h3>
          <p className="mt-4 text-base sm:text-lg text-text-muted">
            Crafted specifically around the CBSE, ICSE, and State Board curriculum from Class 6 to 10.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-surface rounded-2xl p-6 border border-border hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-text mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

