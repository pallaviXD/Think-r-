/**
 * Profile page — settings, data export/import, XP badges, privacy.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Settings, Shield, Download, Upload, Trash2,
  Bell, Globe, Sun, Moon, Type, Award, AlertTriangle
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useAppStore } from '../store/appStore'
import { useUIStore } from '../store/uiStore'
import { HootMascot } from '../components/hoot/HootMascot'
import { DEMO_DATA } from '../data/demo'

const BADGES = [
  { id: 'first_pdf', label: 'First PDF', icon: '📄', desc: 'Uploaded your first PDF', earned: true },
  { id: 'streak_7', label: '7-Day Streak', icon: '🔥', desc: 'Studied 7 days in a row', earned: true },
  { id: 'quiz_master', label: 'Quiz Master', icon: '⚡', desc: 'Scored 100% on a quiz', earned: false },
  { id: 'scholar', label: 'Scholar', icon: '🎓', desc: 'Reached Level 5', earned: false },
  { id: 'night_owl', label: 'Night Owl', icon: '🦉', desc: 'Studied after 10 PM', earned: true },
  { id: 'consistent', label: 'Consistent', icon: '📅', desc: 'Studied 30 days total', earned: false },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-card p-5 shadow-sm">
      <h2 className="font-heading font-bold text-text mb-4">{title}</h2>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-text">{label}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      <div className="ml-4 flex-shrink-0">{children}</div>
    </div>
  )
}

export default function Profile() {
  const demoMode = useAppStore(s => s.demoMode)
  const setDemoMode = useAppStore(s => s.setDemoMode)
  const { theme, setTheme, language, setLanguage } = useAppStore()
  const addToast = useUIStore(s => s.addToast)

  const profile = useLiveQuery(() => db.studentProfile.get(1))
  const displayProfile = demoMode ? DEMO_DATA.profile : profile

  const [name, setName] = useState(displayProfile?.name ?? '')
  const [reminderTime, setReminderTime] = useState('07:00')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium')

  const handleSaveName = async () => {
    if (!name.trim() || demoMode) return
    await db.studentProfile.update(1, { name: name.trim() })
    addToast({ message: 'Name updated!', severity: 'success' })
  }

  const handleExport = async () => {
    const data = {
      profile: await db.studentProfile.toArray(),
      chatSessions: await db.chatSessions.toArray(),
      chatMessages: await db.chatMessages.toArray(),
      quizResults: await db.quizResults.toArray(),
      marksEntries: await db.marksEntries.toArray(),
      chapterMastery: await db.chapterMastery.toArray(),
      dailyPlans: await db.dailyPlans.toArray(),
      flashcards: await db.flashcards.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thinkr-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ message: 'Progress exported!', severity: 'success' })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.profile) await db.studentProfile.bulkPut(data.profile)
      if (data.chatSessions) await db.chatSessions.bulkPut(data.chatSessions)
      if (data.chatMessages) await db.chatMessages.bulkPut(data.chatMessages)
      if (data.quizResults) await db.quizResults.bulkPut(data.quizResults)
      if (data.marksEntries) await db.marksEntries.bulkPut(data.marksEntries)
      if (data.chapterMastery) await db.chapterMastery.bulkPut(data.chapterMastery)
      if (data.dailyPlans) await db.dailyPlans.bulkPut(data.dailyPlans)
      if (data.flashcards) await db.flashcards.bulkPut(data.flashcards)
      addToast({ message: 'Progress imported!', severity: 'success' })
    } catch {
      addToast({ message: 'Import failed — invalid file.', severity: 'error' })
    }
  }

  const handleReset = async () => {
    await db.studentProfile.clear()
    await db.pdfDocuments.clear()
    await db.textChunks.clear()
    await db.chatSessions.clear()
    await db.chatMessages.clear()
    await db.quizResults.clear()
    await db.marksEntries.clear()
    await db.chapterMastery.clear()
    await db.dailyPlans.clear()
    await db.flashcards.clear()
    setDemoMode(false)
    localStorage.clear()
    window.location.href = '/onboarding'
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-24 md:pb-6 space-y-5">
      <h1 className="font-heading font-extrabold text-2xl text-text">Profile & Settings</h1>

      {/* Profile card */}
      {displayProfile && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-brand rounded-card p-6 text-white flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <HootMascot expression="happy" size="sm" animate={false} />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl">{displayProfile.name}</h2>
            <p className="text-sm opacity-90">Class {displayProfile.classLevel} · {displayProfile.board.toUpperCase()}</p>
            <p className="text-sm opacity-80 mt-0.5">⭐ {displayProfile.xp} XP · 🔥 {displayProfile.streak} day streak</p>
          </div>
        </motion.div>
      )}

      {/* Badges */}
      <Section title="🏆 Badges">
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(badge => (
            <div key={badge.id} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${badge.earned ? 'border-primary/30 bg-primary-soft' : 'border-border bg-elevated opacity-50'}`}>
              <span className="text-2xl">{badge.icon}</span>
              <p className="text-xs font-bold text-text">{badge.label}</p>
              <p className="text-[10px] text-text-muted leading-tight">{badge.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Profile settings */}
      <Section title="👤 Profile">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
            <button onClick={handleSaveName} className="bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-btn hover:bg-primary-hover transition-colors">
              Save
            </button>
          </div>
          <p className="text-xs text-text-muted">Class {displayProfile?.classLevel} · {displayProfile?.board.toUpperCase()}</p>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="🎨 Appearance">
        <SettingRow label="Theme" description="Colour scheme">
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all capitalize ${theme === t ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'}`}
              >
                {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '⚙️'} {t}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Language" description="UI and tutor language">
          <div className="flex gap-2">
            {(['en', 'hi'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${language === l ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'}`}
              >
                {l === 'en' ? '🇬🇧 English' : '🇮🇳 Hindi'}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Text size">
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map(s => (
              <button
                key={s}
                onClick={() => setTextSize(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all capitalize ${textSize === s ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* Daily reminder */}
      <Section title="🔔 Reminders">
        <SettingRow label="Daily reminder time" description="Best when Thinkr is installed on home screen">
          <input
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            className="bg-elevated border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
          />
        </SettingRow>
        <p className="text-xs text-text-muted mt-2">PWA notifications work best when Thinkr is installed as an app on your home screen.</p>
      </Section>

      {/* Privacy */}
      <Section title="🔒 Privacy">
        <div className="space-y-2">
          {[
            'Your PDF files are processed entirely in your browser — they never leave your device.',
            'Only small retrieved text snippets (not whole PDFs) are sent to the AI model.',
            'No login, no account, no tracking. All data stays in this browser\'s IndexedDB.',
            'API keys are environment variables on the server — your client code never sees them.',
          ].map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-muted">{p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Data management */}
      <Section title="💾 Data">
        <div className="space-y-3">
          <button onClick={handleExport} className="w-full flex items-center gap-3 p-3 bg-elevated border border-border rounded-xl hover:border-primary/40 transition-all">
            <Download className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text">Export progress</p>
              <p className="text-xs text-text-muted">Download all your data as JSON</p>
            </div>
          </button>

          <label className="w-full flex items-center gap-3 p-3 bg-elevated border border-border rounded-xl hover:border-primary/40 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text">Import progress</p>
              <p className="text-xs text-text-muted">Restore from a backup JSON file</p>
            </div>
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>

          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)} className="w-full flex items-center gap-3 p-3 bg-danger/5 border border-danger/20 rounded-xl hover:bg-danger/10 transition-all">
              <Trash2 className="w-4 h-4 text-danger" />
              <div className="text-left">
                <p className="text-sm font-semibold text-danger">Reset all data</p>
                <p className="text-xs text-text-muted">Delete everything and start fresh</p>
              </div>
            </button>
          ) : (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <p className="text-sm font-bold text-danger">This will delete ALL your data permanently.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-elevated border border-border text-text font-semibold py-2 rounded-btn text-sm">Cancel</button>
                <button onClick={handleReset} className="flex-1 bg-danger text-white font-semibold py-2 rounded-btn text-sm hover:bg-danger/90">Yes, reset</button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
