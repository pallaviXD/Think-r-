/**
 * Thinkr XP and Gamification System.
 *
 * Students earn XP for learning activities. XP accumulates to levels (1–10).
 * Badges are unlocked by milestones.
 */

import type { StudentProfile, QuizResult, ChapterMastery } from './db'

// ── XP Table — thresholds per level ────────────────────────────────────────

export const XP_TABLE: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 3500,
  8: 5500,
  9: 8000,
  10: 12000,
}

export type XPAction =
  | 'quiz_complete'
  | 'quiz_perfect'
  | 'chat_answered'
  | 'flashcard_reviewed'
  | 'flashcard_session_done'
  | 'streak_maintained'
  | 'pdf_uploaded'
  | 'marks_card_uploaded'
  | 'daily_plan_completed'

// XP awarded per action
const XP_REWARDS: Record<XPAction, number> = {
  quiz_complete: 15,
  quiz_perfect: 50,
  chat_answered: 5,
  flashcard_reviewed: 2,
  flashcard_session_done: 20,
  streak_maintained: 10,
  pdf_uploaded: 25,
  marks_card_uploaded: 30,
  daily_plan_completed: 40,
}

/**
 * Get XP awarded for a specific action.
 */
export function awardXP(action: XPAction): number {
  return XP_REWARDS[action] ?? 0
}

/**
 * Get the current level (1–10) for a given XP total.
 */
export function getLevelFromXP(xp: number): number {
  let level = 1
  for (const [lvl, threshold] of Object.entries(XP_TABLE)) {
    if (xp >= threshold) {
      level = Number(lvl)
    }
  }
  return Math.min(level, 10)
}

/**
 * Get XP needed for the next level (or 0 if at max level).
 */
export function getXPForNextLevel(xp: number): number {
  const currentLevel = getLevelFromXP(xp)
  if (currentLevel >= 10) return 0
  return XP_TABLE[currentLevel + 1] - xp
}

/**
 * Get XP progress within the current level as a percentage (0–100).
 */
export function getLevelProgress(xp: number): number {
  const level = getLevelFromXP(xp)
  if (level >= 10) return 100
  const start = XP_TABLE[level]
  const end = XP_TABLE[level + 1]
  return Math.round(((xp - start) / (end - start)) * 100)
}

// ── Badge Definitions ────────────────────────────────────────────────────

export interface Badge {
  id: string
  name: string
  description: string
  icon: string // lucide-react icon name
  earned: boolean
  earnedAt?: string
}

type BadgeDef = Omit<Badge, 'earned' | 'earnedAt'> & {
  check: (
    profile: StudentProfile,
    quizResults: QuizResult[],
    masteries: ChapterMastery[]
  ) => boolean
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'first_chat',
    name: 'First Questions',
    description: 'Ask your first question to Hoot',
    icon: 'MessageCircle',
    check: (profile) => (profile.xp ?? 0) > 0,
  },
  {
    id: 'first_upload',
    name: 'PDF Pro',
    description: 'Upload your first PDF or notes',
    icon: 'FileText',
    check: (profile) => (profile.xp ?? 0) >= XP_REWARDS.pdf_uploaded,
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Complete 10 quizzes',
    icon: 'Trophy',
    check: (_profile, quizResults) => quizResults.length >= 10,
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: 'Star',
    check: (_profile, quizResults) =>
      quizResults.some((r) => r.score === r.maxScore),
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: 'Flame',
    check: (profile) => (profile.streak ?? 0) >= 7,
  },
  {
    id: 'streak_30',
    name: 'Monthly Champion',
    description: 'Maintain a 30-day study streak',
    icon: 'Award',
    check: (profile) => (profile.streak ?? 0) >= 30,
  },
  {
    id: 'mastery_80',
    name: 'Subject Expert',
    description: 'Achieve 80%+ mastery in any subject',
    icon: 'BookOpen',
    check: (_profile, _quizResults, masteries) =>
      masteries.some((m) => m.mastery >= 80),
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: 'Zap',
    check: (profile) => getLevelFromXP(profile.xp ?? 0) >= 5,
  },
  {
    id: 'level_10',
    name: 'Thinkr Legend',
    description: 'Reach the maximum Level 10',
    icon: 'Crown',
    check: (profile) => getLevelFromXP(profile.xp ?? 0) >= 10,
  },
  {
    id: 'marks_card',
    name: 'Report Card Ready',
    description: 'Upload your marks card for analysis',
    icon: 'BarChart2',
    check: (profile) => (profile.xp ?? 0) >= XP_REWARDS.marks_card_uploaded,
  },
]

/**
 * Check which badges have been earned and return a list with earned status.
 */
export function getBadges(
  profile: StudentProfile,
  quizResults: QuizResult[],
  masteries: ChapterMastery[]
): Badge[] {
  return BADGE_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    earned: def.check(profile, quizResults, masteries),
  }))
}
