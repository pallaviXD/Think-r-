/**
 * Progress page — mastery charts, marks analysis, report card.
 */

import { useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend
} from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Award, AlertTriangle, Download, BookOpen, Zap } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useAppStore } from '../store/appStore'
import { DEMO_DATA } from '../data/demo'
import { Link } from 'react-router-dom'
import { HootMascot } from '../components/hoot/HootMascot'

function MasteryRadar({ data }: { data: { subject: string; mastery: number }[] }) {
  return (
    <div className="bg-surface border border-border rounded-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-bold text-text">Subject Mastery</h2>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Radar name="Mastery" dataKey="mastery" stroke="#FF6B00" fill="#FF6B00" fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function MarksChart({ entries }: { entries: Array<{ subject: string; obtained: number; maximum: number }> }) {
  const data = entries.map(e => ({
    subject: e.subject.length > 10 ? e.subject.slice(0, 10) + '…' : e.subject,
    obtained: e.obtained,
    maximum: e.maximum,
    pct: Math.round((e.obtained / e.maximum) * 100),
  }))

  return (
    <div className="bg-surface border border-border rounded-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-bold text-text">Marks Analysis</h2>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }}
            formatter={(v: number) => [`${v} marks`, '']}
          />
          <Bar dataKey="obtained" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8A00" />
              <stop offset="100%" stopColor="#FF5A00" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>

      {/* Subject rows */}
      <div className="mt-4 space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-24 truncate">{entries[i].subject}</span>
            <div className="flex-1 bg-border rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${d.pct >= 75 ? 'bg-success' : d.pct >= 50 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold w-10 text-right ${d.pct >= 75 ? 'text-success' : d.pct >= 50 ? 'text-warning' : 'text-danger'}`}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeakTopics({ entries }: { entries: Array<{ subject: string; obtained: number; maximum: number }> }) {
  const weak = entries.filter(e => (e.obtained / e.maximum) < 0.65)

  if (weak.length === 0) return (
    <div className="bg-success/10 border border-success/20 rounded-card p-5 flex items-center gap-3">
      <Award className="w-6 h-6 text-success" />
      <div>
        <p className="font-semibold text-success">Great performance!</p>
        <p className="text-sm text-text-muted">No major weak areas detected.</p>
      </div>
    </div>
  )

  return (
    <div className="bg-surface border border-border rounded-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h2 className="font-heading font-bold text-text">Needs Attention</h2>
      </div>
      <div className="space-y-3">
        {weak.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text">{s.subject}</p>
              <p className="text-xs text-text-muted">{s.obtained}/{s.maximum} marks ({Math.round((s.obtained / s.maximum) * 100)}%)</p>
            </div>
            <Link to="/app/tutor">
              <button className="text-xs font-semibold text-primary bg-primary-soft px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all">
                Practice now
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportCard({ profile, marksEntry, masteries }: {
  profile: typeof DEMO_DATA.profile
  marksEntry: typeof DEMO_DATA.marksEntry
  masteries: typeof DEMO_DATA.chapterMastery
}) {
  const avgMastery = masteries.length > 0 ? Math.round(masteries.reduce((s, m) => s + m.mastery, 0) / masteries.length) : 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-surface border border-border rounded-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-text">Report Card</h2>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted border border-border rounded-btn px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>

      <div id="report-print" className="space-y-4">
        <div className="bg-gradient-brand rounded-2xl p-5 text-white">
          <h3 className="font-heading font-extrabold text-xl">{profile.name}</h3>
          <p className="text-sm opacity-90">Class {profile.classLevel} · {profile.board.toUpperCase()}</p>
          <p className="text-sm opacity-80 mt-1">{marksEntry.examName}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-elevated border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold font-heading text-primary">{marksEntry.entries.length}</p>
            <p className="text-xs text-text-muted">Subjects</p>
          </div>
          <div className="bg-elevated border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold font-heading text-primary">{avgMastery}%</p>
            <p className="text-xs text-text-muted">Avg Mastery</p>
          </div>
          <div className="bg-elevated border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold font-heading text-success">
              {Math.round(marksEntry.entries.reduce((s, e) => s + (e.obtained / e.maximum * 100), 0) / marksEntry.entries.length)}%
            </p>
            <p className="text-xs text-text-muted">Overall</p>
          </div>
        </div>

        <div className="space-y-2">
          {marksEntry.entries.map((e, i) => {
            const pct = Math.round((e.obtained / e.maximum) * 100)
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-elevated rounded-xl">
                <span className="text-sm font-medium text-text flex-1">{e.subject}</span>
                <span className="text-sm font-bold text-text">{e.obtained}/{e.maximum}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 75 ? 'text-success bg-success/10' : pct >= 50 ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'}`}>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>

        <div className="bg-primary-soft border border-primary/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-primary mb-1">💡 Thinkr says:</p>
          <p className="text-sm text-text">You're doing well overall! Focus on Hindi and Social Science to push your average above 80%. Use the tutor daily for 20 minutes and you'll see improvement in 2 weeks.</p>
        </div>
      </div>
    </div>
  )
}

export default function Progress() {
  const demoMode = useAppStore(s => s.demoMode)
  const profile = useLiveQuery(() => db.studentProfile.get(1))
  const masteries = useLiveQuery(() => db.chapterMastery.toArray()) ?? []
  const marksEntries = useLiveQuery(() => db.marksEntries.toArray()) ?? []
  const [tab, setTab] = useState<'overview' | 'report'>('overview')

  const displayProfile = demoMode ? DEMO_DATA.profile : profile
  const displayMastery = demoMode ? DEMO_DATA.chapterMastery : masteries
  const displayMarks = demoMode ? [DEMO_DATA.marksEntry] : marksEntries

  const radarData = displayMastery.map(m => ({ subject: m.subject.slice(0, 8), mastery: m.mastery }))
  const latestMarks = displayMarks[0]

  if (!displayProfile) return (
    <div className="p-6 text-center">
      <HootMascot expression="encouraging" size="md" />
      <p className="text-text-muted mt-4">Complete onboarding to see your progress.</p>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="font-heading font-extrabold text-2xl text-text">Progress</h1>
        <div className="flex gap-2">
          {(['overview', 'report'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-all ${tab === t ? 'bg-primary text-white' : 'bg-elevated border border-border text-text-muted hover:border-primary/40'}`}
            >
              {t === 'overview' ? 'Overview' : 'Report Card'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {tab === 'overview' && (
          <>
            {radarData.length > 0 && <MasteryRadar data={radarData} />}
            {latestMarks && <MarksChart entries={latestMarks.entries} />}
            {latestMarks && <WeakTopics entries={latestMarks.entries} />}

            {displayMastery.length === 0 && !latestMarks && (
              <div className="text-center py-16">
                <HootMascot expression="encouraging" size="lg" />
                <h2 className="font-heading font-bold text-xl text-text mt-4 mb-2">No data yet</h2>
                <p className="text-text-muted text-sm mb-4">Upload a marks card or start quizzing to see your progress.</p>
                <Link to="/app/library">
                  <button className="bg-gradient-brand text-white font-semibold px-5 py-2.5 rounded-btn shadow hover:opacity-90">
                    Upload marks card
                  </button>
                </Link>
              </div>
            )}
          </>
        )}

        {tab === 'report' && latestMarks && (
          <ReportCard
            profile={displayProfile as typeof DEMO_DATA.profile}
            marksEntry={latestMarks}
            masteries={displayMastery.map(m => ({ ...m, lastStudied: m.lastStudied ?? '' }))}
          />
        )}

        {tab === 'report' && !latestMarks && (
          <div className="text-center py-12">
            <HootMascot expression="encouraging" size="md" />
            <p className="text-text-muted mt-4 mb-4">Upload your marks card to generate a report.</p>
            <Link to="/app/library">
              <button className="bg-gradient-brand text-white font-semibold px-5 py-2.5 rounded-btn shadow hover:opacity-90">Upload marks card</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
