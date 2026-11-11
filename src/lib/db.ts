/**
 * Thinkr IndexedDB database via Dexie v4.
 * All student data lives here — no server, no login required.
 * Schema: 10 tables covering profile, PDFs, chat, quizzes, marks, and gamification.
 */

import Dexie, { type EntityTable } from 'dexie'

// ── Type definitions ──────────────────────────────────────────────────────

export interface StudentProfile {
  id: number // Always 1 (singleton row)
  name: string
  board: string
  classLevel: number
  subjects: string[]
  language: 'en' | 'hi'
  xp: number
  streak: number
  lastStudyDate: string | null
  examDates?: Array<{ subject: string; date: string }>
  createdAt: string
}

export interface PDFDocument {
  id: string
  name: string
  subject: string
  chapter: string
  type: 'textbook' | 'notes' | 'question_paper' | 'marks_card'
  status: 'processing' | 'ready' | 'error'
  pageCount: number
  fileSize: number
  thumbnail: string | null // base64 JPEG of page 1
  uploadedAt: string
}

export interface TextChunk {
  id: string
  docId: string
  pageNumber: number
  text: string
  wordCount: number
  chunkIndex: number
}

export interface ChatSession {
  id: string
  subject: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: Array<{ docId: string; docName: string; pageNumber: number }>
  timestamp: string
}

export interface QuizResult {
  id: string
  subject: string
  chapter: string
  score: number
  maxScore: number
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  questions: QuizQuestion[]
  timestamp: string
}

export interface QuizQuestion {
  question: string
  type: 'mcq' | 'short' | 'long' | 'case_based'
  options?: string[]
  correctAnswer: string
  explanation: string
  studentAnswer?: string
  marksAwarded?: number
  maxMarks: number
}

export interface MarksEntry {
  id: string
  examName: string
  entries: Array<{
    subject: string
    obtained: number
    maximum: number
  }>
  uploadedAt: string
}

export interface ChapterMastery {
  id: string // `${subject}-${chapter}`
  subject: string
  chapter: string
  mastery: number // 0–100
  quizCount: number
  lastStudied: string | null
}

export interface DailyPlan {
  id: string // ISO date string YYYY-MM-DD
  items: Array<{
    subject: string
    chapter: string
    task: string
    duration: number // minutes
    done: boolean
  }>
  createdAt: string
}

export interface Flashcard {
  id: string
  subject: string
  chapter: string
  front: string
  back: string
  // SM-2 fields
  interval: number // days until next review
  easeFactor: number // default 2.5
  repetitions: number
  nextReviewDue: string // ISO date string
  createdAt: string
}

// ── Database class ────────────────────────────────────────────────────────

export class ThinkrDB extends Dexie {
  studentProfile!: EntityTable<StudentProfile, 'id'>
  pdfDocuments!: EntityTable<PDFDocument, 'id'>
  textChunks!: EntityTable<TextChunk, 'id'>
  chatSessions!: EntityTable<ChatSession, 'id'>
  chatMessages!: EntityTable<ChatMessage, 'id'>
  quizResults!: EntityTable<QuizResult, 'id'>
  marksEntries!: EntityTable<MarksEntry, 'id'>
  chapterMastery!: EntityTable<ChapterMastery, 'id'>
  dailyPlans!: EntityTable<DailyPlan, 'id'>
  flashcards!: EntityTable<Flashcard, 'id'>

  constructor() {
    super('ThinkrDB')

    // Dexie v4 schema: &id = primary key, additional = indexed fields
    this.version(1).stores({
      studentProfile: '&id',
      pdfDocuments: '&id, subject, type, status',
      textChunks: '&id, docId, pageNumber',
      chatSessions: '&id, subject',
      chatMessages: '&id, sessionId, role, timestamp',
      quizResults: '&id, subject, timestamp',
      marksEntries: '&id, uploadedAt',
      chapterMastery: '&id, subject',
      dailyPlans: '&id',
      flashcards: '&id, subject, nextReviewDue',
    })
  }
}

// Singleton database instance
export const db = new ThinkrDB()

// ── Typed live-query wrappers (re-exported for convenience) ───────────────

export { useLiveQuery } from 'dexie-react-hooks'
