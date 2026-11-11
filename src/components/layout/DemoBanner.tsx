/**
 * DemoBanner — orange sticky banner shown in demo mode.
 */

import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { db } from '../../lib/db'

export function DemoBanner() {
  const demoMode = useAppStore((s) => s.demoMode)
  const setDemoMode = useAppStore((s) => s.setDemoMode)
  const navigate = useNavigate()

  if (!demoMode) return null

  const handleExit = async () => {
    setDemoMode(false)
    // Clear demo data from db
    try {
      await db.studentProfile.clear()
    } catch {
      // Ignore errors
    }
    navigate('/')
  }

  return (
    <div
      className="relative flex items-center justify-center gap-3 px-4 py-2.5 bg-gradient-brand text-white text-sm font-medium"
      role="alert"
      aria-live="polite"
    >
      <span>
        <strong>Demo mode</strong> — no AI calls, sample data only.
      </span>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 px-3 py-1 rounded-btn bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
        aria-label="Exit demo mode"
      >
        Exit demo
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}
