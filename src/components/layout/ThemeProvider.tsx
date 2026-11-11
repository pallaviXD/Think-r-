/**
 * ThemeProvider — syncs the app's theme preference to data-theme on <html>.
 *
 * The index.html no-flash script sets data-theme before React mounts.
 * This provider keeps it in sync after mount and when the user changes theme.
 * 200ms CSS transition is handled by global.css html rule.
 */

import { useEffect, type ReactNode } from 'react'
import { useAppStore } from '../../store/appStore'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    const applyTheme = (t: typeof theme) => {
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }

    applyTheme(theme)

    // Also persist to localStorage so the no-flash script reads it on next load
    try {
      localStorage.setItem('thinkr-theme', theme)
    } catch {
      // localStorage may be blocked in some environments
    }

    // Listen for system theme changes when theme = 'system'
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme, setTheme])

  return <>{children}</>
}
