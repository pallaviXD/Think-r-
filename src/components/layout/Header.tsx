/**
 * Header — top navigation bar with logo, XP pill, streak, theme toggle.
 * Glass-effect on scroll. Compact on mobile.
 */

import { Link } from 'react-router-dom'
import { Flame, Zap } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useLiveQuery } from '../../lib/db'
import { db } from '../../lib/db'
import { getLevelFromXP } from '../../lib/xp'
import { useAppStore } from '../../store/appStore'
import { cn } from '../../lib/utils'

// Import logo SVGs
import logoLight from '../../assets/logo-light.svg'
import logoDark from '../../assets/logo-dark.svg'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const theme = useAppStore((s) => s.theme)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Live profile data for XP and streak display
  const profile = useLiveQuery(() => db.studentProfile.get(1), [])

  const xp = profile?.xp ?? 0
  const streak = profile?.streak ?? 0
  const level = getLevelFromXP(xp)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-16',
        'flex items-center justify-between px-4 md:px-6',
        'glass border-b border-border',
        'transition-all duration-200',
        className
      )}
      role="banner"
    >
      {/* Logo */}
      <Link
        to="/"
        aria-label="Thinkr — go to home"
        className="shrink-0"
      >
        <img
          src={isDark ? logoDark : logoLight}
          alt="Thinkr"
          height={32}
          className="h-8 w-auto"
        />
      </Link>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Streak indicator */}
        {streak > 0 && (
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn bg-warning/15 text-warning"
            title={`${streak}-day study streak`}
            aria-label={`${streak} day study streak`}
          >
            <Flame className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold tabular-nums">{streak}</span>
          </div>
        )}

        {/* XP / Level pill */}
        {xp > 0 && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-primary-soft text-primary"
            title={`Level ${level} — ${xp} XP`}
            aria-label={`Level ${level}, ${xp} XP`}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden />
            <span className="text-xs font-semibold">Lv.{level}</span>
            <span className="text-xs text-text-muted tabular-nums">{xp.toLocaleString()} XP</span>
          </div>
        )}

        <ThemeToggle />
      </div>
    </header>
  )
}
