/**
 * Thinkr UI Store — transient UI state.
 * Not persisted — resets on page load.
 */

import { create } from 'zustand'

export type HootExpression = 'thinking' | 'happy' | 'celebrating' | 'sleeping' | 'encouraging'

export interface Toast {
  id: string
  message: string
  severity: 'info' | 'success' | 'warning' | 'error'
  duration?: number // ms, default 4000
}

interface UIState {
  hootExpression: HootExpression
  confettiActive: boolean
  toasts: Toast[]

  setHootExpression: (expression: HootExpression) => void
  triggerConfetti: () => void
  stopConfetti: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  hootExpression: 'happy',
  confettiActive: false,
  toasts: [],

  setHootExpression: (expression) => set({ hootExpression: expression }),

  triggerConfetti: () => {
    set({ confettiActive: true })
    // Auto-stop after 3 seconds
    setTimeout(() => set({ confettiActive: false }), 3000)
  },

  stopConfetti: () => set({ confettiActive: false }),

  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
