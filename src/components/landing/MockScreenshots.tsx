import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, Flame, Award, BarChart2 } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function MockScreenshots() {
  const shouldReduce = useReducedMotion()

  return (
    <section className="py-20 md:py-32 bg-bg-soft/40 border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
            Designed For Focus
          </h2>
          <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-text tracking-tight">
            Clean, distraction-free study interface
          </h3>
          <p className="mt-4 text-base sm:text-lg text-text-muted">
            Optimized for late-night exam prep, quick bus revisions, and focused study sprints.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Laptop / Desktop Frame */}
          <motion.div
            initial={shouldReduce ? {} : { opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Browser top bar */}
            <div className="bg-elevated px-4 py-2.5 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block px-3 py-0.5 rounded-md bg-bg text-[10px] text-text-muted font-mono">
                  thinkr.app/home
                </div>
              </div>
            </div>

            {/* Mock Dashboard View */}
            <div className="p-6 space-y-4 bg-bg">
              {/* Top stats bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h4 className="font-heading font-bold text-sm text-text">
                    Good evening, Arjun!
                  </h4>
                  <p className="text-[11px] text-text-muted">
                    Class 9 · CBSE Board · 4 tasks left today
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 fill-primary" />
                    <span>7 Days</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Level 3 · 450 XP</span>
                  </div>
                </div>
              </div>

              {/* Today's Plan mock */}
              <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-text">
                  <span>Today's Study Plan</span>
                  <span className="text-primary text-[11px]">2 / 4 Completed</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-bg-soft text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span className="line-through text-text-muted">
                        Science: Ch. 6 Tissues (20 min)
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-success">+30 XP</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-bg-soft text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded border border-border" />
                      <span className="text-text font-medium">
                        Maths: Triangles Quiz (15 min)
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted">Due today</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Phone Mockup */}
          <motion.div
            initial={shouldReduce ? {} : { opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="w-[280px] bg-surface border-[4px] border-border rounded-[36px] shadow-2xl p-3 relative">
              {/* Speaker / Notch */}
              <div className="w-20 h-3.5 bg-border rounded-full mx-auto mb-3" />

              {/* Mobile Screen Content */}
              <div className="space-y-3 bg-bg rounded-[24px] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-extrabold text-xs text-text">Thinkr</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    Report Card
                  </span>
                </div>

                {/* Performance pill */}
                <div className="p-3 rounded-xl bg-surface border border-border text-center space-y-1">
                  <span className="text-[10px] text-text-muted">Overall Average</span>
                  <div className="text-2xl font-heading font-extrabold text-primary">
                    84.2%
                  </div>
                  <div className="text-[9px] text-success font-medium">
                    +6.5% vs Last Term
                  </div>
                </div>

                {/* Mini radar / bars */}
                <div className="space-y-2 p-2.5 rounded-xl bg-surface border border-border">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text">
                    <BarChart2 className="w-3 h-3 text-primary" />
                    <span>Subject Mastery</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="flex justify-between text-[9px] text-text mb-0.5">
                        <span>Science</span>
                        <span>92%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-success w-[92%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-text mb-0.5">
                        <span>Maths</span>
                        <span>78%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-warning w-[78%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <span className="text-[9px] text-text-muted">
                    Instant sync across desktop & mobile
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

