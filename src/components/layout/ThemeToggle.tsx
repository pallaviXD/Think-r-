/**
 * ThemeToggle — animated sun/moon button.
 * Framer Motion rotate + scale animation on toggle.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const shouldReduceMotion = useReducedMotion()

  // Determine effective theme (treat 'system' as its resolved value)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggle = () => setTheme(isDark ? 'light' : 'dark')

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={cn(
        'relative h-10 w-10 rounded-btn',
        'flex items-center justify-center',
        'text-text-muted hover:text-primary hover:bg-primary-soft',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={shouldReduceMotion ? false : { opacity: 0, rotate: -90, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {isDark ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </motion.div>
    </button>
  )
}
