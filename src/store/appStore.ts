/**
 * Thinkr App Store — global application state.
 * Persisted to localStorage so preferences survive page reloads.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type Language = 'en' | 'hi'

interface AppState {
  theme: Theme
  demoMode: boolean
  sidebarOpen: boolean
  language: Language

  setTheme: (theme: Theme) => void
  setDemoMode: (demo: boolean) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setLanguage: (lang: Language) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      demoMode: false,
      sidebarOpen: true,
      language: 'en',

      setTheme: (theme) => set({ theme }),
      setDemoMode: (demoMode) => set({ demoMode }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'thinkr-app',
      // Only persist these keys — don't persist transient state
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        language: state.language,
        // demoMode intentionally NOT persisted — always starts as false
      }),
    }
  )
)
