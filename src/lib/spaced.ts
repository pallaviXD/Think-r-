/**
 * Thinkr Spaced Repetition — SM-2 Algorithm Implementation.
 *
 * SM-2 uses quality grades 0–5:
 *   5 = perfect recall
 *   4 = correct with slight hesitation
 *   3 = correct with difficulty
 *   2 = incorrect, remembered on seeing answer
 *   1 = incorrect, easy answer remembered
 *   0 = complete blackout
 *
 * Grades 0–2 reset the interval; grades 3–5 advance the schedule.
 */

import type { Flashcard, QuizResult } from './db'

export type SM2Grade = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Update a flashcard's SM-2 schedule based on the recall quality grade.
 * Returns a new Flashcard object (immutable update).
 */
export function updateCard(card: Flashcard, grade: SM2Grade): Flashcard {
  let { interval, easeFactor, repetitions } = card

  if (grade >= 3) {
    // Correct response — advance the schedule
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    // Incorrect response — reset to beginning
    repetitions = 0
    interval = 1
  }

  // Update ease factor (minimum 1.3 to prevent too-short intervals)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  )

  // Calculate next review date
  const nextReviewDue = new Date()
  nextReviewDue.setDate(nextReviewDue.getDate() + interval)

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReviewDue: nextReviewDue.toISOString().split('T')[0],
  }
}

/**
 * Filter cards that are due for review today or overdue.
 */
export function getDueCards(cards: Flashcard[]): Flashcard[] {
  const today = new Date().toISOString().split('T')[0]
  return cards.filter((card) => card.nextReviewDue <= today)
}

/**
 * Calculate mastery score (0–100) for a subject/chapter combination
 * based on quiz results and chat engagement.
 *
 * Formula:
 *  - Quiz performance contributes 70% (weighted average of recent scores)
 *  - Chat engagement contributes 30% (more interactions = more practice)
 */
export function calculateMastery(
  quizResults: QuizResult[],
  chatCount: number
): number {
  if (quizResults.length === 0 && chatCount === 0) return 0

  let quizScore = 0
  if (quizResults.length > 0) {
    // Weighted average of recent quiz results (more recent = higher weight)
    const weights = quizResults.map((_, i) => i + 1)
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    const weightedSum = quizResults.reduce((sum, result, i) => {
      const percentage = (result.score / result.maxScore) * 100
      return sum + percentage * weights[i]
    }, 0)
    quizScore = weightedSum / totalWeight
  }

  // Chat engagement: each interaction adds ~5 points, capped at 30
  const chatScore = Math.min(30, chatCount * 5)

  // Combine: quiz 70%, chat 30%
  if (quizResults.length === 0) {
    return Math.round(chatScore)
  }

  return Math.round(quizScore * 0.7 + chatScore * 0.3)
}
