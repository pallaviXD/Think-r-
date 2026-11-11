/**
 * Home page — daily plan, XP summary, streak, quick actions, exam countdown.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Flame, Trophy, BookOpen, MessageCircle, Zap, Target,
  CheckCircle2, Clock, Calendar, ChevronRight, Star
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useAppStore } from '../store/appStore'
import { HootMascot } from '../components/hoot/HootMascot'
import { DEMO_DATA } from '../data/demo'

function StreakCard({ streak }: { streak: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-brand text-white rounded-card p-5 flex items-center gap-4 shadow-md"
    >
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
        <Flame className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium opacity-90">Study Streak</p>
        <p className="text-3xl font-extrabold font-heading">{streak} days 🔥</p>
      </div>
    </motion.div>
  )
}

function XPCard({ xp }: { xp: number }) {
  const level = Math.floor(xp / 200) + 1
  const levelXP = xp % 200
  const LEVEL_NAMES = ['Curious', 'Explorer', 'Learner', 'Thinker', 'Scholar',
    'Achiever', 'Expert', 'Master', 'Champion', 'Legend']
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-surface border border-border rounded-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-heading font-bold text-text">Level {level}</span>
        </div>
        <span className="text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
          {LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-4 h-4 text-warning" />
        <span className="text-2xl font-extrabold font-heading text-text">{xp} XP</span>
      </div>
      <div className="w-full bg-border rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full bg-gradient-brand transition-all duration-500"
          style={{ width: `${(levelXP / 200) * 100}%` }}
        />
      </div>
      <p className="text-xs text-text-muted mt-1">{200 - levelXP} XP to Level {level + 1}</p>
    </motion.div>
  )
}

function TodayPlanCard({ items }: { items: Array<{ subject: string; chapter: string; task: string; duration: number; done: boolean }> }) {
  const [localItems, setLocalItems] = useState(items)

  const toggle = async (idx: number) => {
    setLocalItems(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item))
  }

  const done = localItems.filter(i => i.done).length
  const pct = localItems.length > 0 ? Math.round((done / localItems.length) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-surface border border-border rounded-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-text">Today's Plan</h2>
        </div>
        <span className="text-sm font-semibold text-primary">{done}/{localItems.length} done</span>
      </div>

      <div className="w-full bg-border rounded-full h-2 mb-4">
        <div
          className="h-2 rounded-full bg-gradient-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-3">
        {localItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => toggle(idx)}
            className="w-full flex items-start gap-3 text-left group"
          >
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.done ? 'bg-success border-success' : 'border-border group-hover:border-primary'}`}>
              {item.done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`flex-1 ${item.done ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                  {item.subject}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.duration} min
                </span>
              </div>
              <p className={`text-sm text-text mt-0.5 ${item.done ? 'line-through' : ''}`}>{item.task}</p>
            </div>
          </button>
        ))}
      </div>

      {localItems.length === 0 && (
        <div className="text-center py-6">
          <HootMascot expression="encouraging" size="sm" />
          <p className="text-sm text-text-muted mt-2">No plan for today yet. Chat with Thinkr to create one!</p>
          <Link to="/app/tutor">
            <button className="mt-3 text-xs font-semibold text-primary hover:underline">Generate plan →</button>
          </Link>
        </div>
      )}
    </motion.div>
  )
}

function QuickActions() {
  const actions = [
    { label: 'Ask Tutor', icon: MessageCircle, href: '/app/tutor', color: 'text-primary bg-primary-soft' },
    { label: 'Quiz Me', icon: Zap, href: '/app/study', color: 'text-warning bg-warning/10' },
    { label: 'Library', icon: BookOpen, href: '/app/library', color: 'text-success bg-success/10' },
    { label: 'Progress', icon: Trophy, href: '/app/progress', color: 'text-primary bg-primary-soft' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {actions.map(({ label, icon: Icon, href, color }) => (
        <Link key={label} to={href}>
          <div className="bg-surface border border-border rounded-card p-4 flex flex-col items-center gap-2 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-text text-center">{label}</span>
          </div>
        </Link>
      ))}
    </motion.div>
  )
}

function ExamCountdown({ examDates }: { examDates: Array<{ subject: string; date: string }> }) {
  if (!examDates || examDates.length === 0) return null

  const now = new Date()
  const upcoming = examDates
    .map(e => ({ ...e, days: Math.ceil((new Date(e.date).getTime() - now.getTime()) / 86400000) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)

  if (upcoming.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-surface border border-border rounded-card p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-bold text-text">Exam Countdown</h2>
      </div>
      <div className="space-y-3">
        {upcoming.slice(0, 3).map((exam) => (
          <div key={exam.subject} className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">{exam.subject}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${exam.days <= 7 ? 'text-danger' : exam.days <= 14 ? 'text-warning' : 'text-success'}`}>
                {exam.days === 0 ? 'Today!' : `${exam.days} days`}
              </span>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Home() {
  const demoMode = useAppStore(s => s.demoMode)
  const profile = useLiveQuery(() => db.studentProfile.get(1))
  const dailyPlan = useLiveQuery(() => {
    const today = new Date().toISOString().split('T')[0]
    return db.dailyPlans.get(today)
  })

  const displayProfile = demoMode ? DEMO_DATA.profile : profile
  const displayPlan = demoMode ? DEMO_DATA.dailyPlan : dailyPlan

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (!displayProfile) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center pt-16">
        <HootMascot expression="encouraging" size="lg" />
        <h1 className="font-heading font-extrabold text-2xl text-text mt-4 mb-2">Welcome to Thinkr!</h1>
        <p className="text-text-muted mb-6">Set up your profile to get started.</p>
        <Link to="/onboarding">
          <button className="bg-gradient-brand text-white font-semibold px-6 py-3 rounded-btn shadow-md hover:opacity-90 transition-opacity">
            Start onboarding
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 pb-24 md:pb-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-text">
            {greeting()}, {displayProfile.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Class {displayProfile.classLevel} · {displayProfile.board.toUpperCase()}
          </p>
        </div>
        <HootMascot expression="happy" size="sm" />
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StreakCard streak={displayProfile.streak} />
        <XPCard xp={displayProfile.xp} />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Today's plan */}
      {displayPlan && <TodayPlanCard items={displayPlan.items} />}

      {/* Exam countdown */}
      {displayProfile.examDates && displayProfile.examDates.length > 0 && (
        <ExamCountdown examDates={displayProfile.examDates} />
      )}
    </div>
  )
}
