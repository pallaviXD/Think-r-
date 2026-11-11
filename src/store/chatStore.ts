/**
 * Thinkr Chat Store — ephemeral state for the active chat session.
 * Not persisted (messages saved to Dexie separately).
 */

import { create } from 'zustand'
import type { ChatMessage as LLMMessage } from '../lib/llm'

export type ChatMode = 'guide' | 'explain' | 'exam'
export type ChatLevel = 'simple' | 'class' | 'topper'

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ docId: string; docName: string; pageNumber: number }>
  timestamp: string
}

interface ChatState {
  activeSessionId: string | null
  messages: UIMessage[]
  isStreaming: boolean
  streamingContent: string
  mode: ChatMode
  level: ChatLevel
  scopeDocIds: string[]
  scopeSubject: string
  // Track Socratic mode attempts
  socratiAttempts: number

  // Actions
  setActiveSession: (id: string | null) => void
  setMessages: (messages: UIMessage[]) => void
  addMessage: (message: UIMessage) => void
  setMode: (mode: ChatMode) => void
  setLevel: (level: ChatLevel) => void
  setScope: (docIds: string[], subject: string) => void
  startStreaming: () => void
  appendDelta: (delta: string) => void
  finalizeMessage: (sources?: UIMessage['sources']) => void
  clearStream: () => void
  incrementSocraticAttempts: () => void
  resetSocraticAttempts: () => void
  clearSession: () => void

  // Build history for LLM payload (last 4 turns = 8 messages)
  getRecentHistory: () => LLMMessage[]
}

export const useChatStore = create<ChatState>()((set, get) => ({
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  mode: 'explain',
  level: 'class',
  scopeDocIds: [],
  scopeSubject: '',
  socratiAttempts: 0,

  setActiveSession: (id) => set({ activeSessionId: id, messages: [], streamingContent: '' }),
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  setMode: (mode) => set({ mode }),
  setLevel: (level) => set({ level }),
  setScope: (scopeDocIds, scopeSubject) => set({ scopeDocIds, scopeSubject }),

  startStreaming: () => set({ isStreaming: true, streamingContent: '' }),

  appendDelta: (delta) =>
    set((s) => ({ streamingContent: s.streamingContent + delta })),

  finalizeMessage: (sources) => {
    const { streamingContent } = get()
    const finalMsg: UIMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: streamingContent,
      sources,
      timestamp: new Date().toISOString(),
    }
    set((s) => ({
      isStreaming: false,
      streamingContent: '',
      messages: [...s.messages, finalMsg],
    }))
  },

  clearStream: () => set({ isStreaming: false, streamingContent: '' }),

  incrementSocraticAttempts: () =>
    set((s) => ({ socratiAttempts: s.socratiAttempts + 1 })),

  resetSocraticAttempts: () => set({ socratiAttempts: 0 }),

  clearSession: () =>
    set({
      activeSessionId: null,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      socratiAttempts: 0,
    }),

  getRecentHistory: (): LLMMessage[] => {
    const { messages } = get()
    // Last 4 turns = last 8 messages (4 user + 4 assistant)
    return messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }))
  },
}))
