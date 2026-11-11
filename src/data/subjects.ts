/**
 * Subjects offered per class (6–10) for Indian school boards.
 *
 * Notes:
 *  - Physics, Chemistry, Biology appear as separate subjects from Class 8
 *  - Sanskrit is optional and varies by board
 *  - EVS (Environmental Studies) is typically for Classes 6–8
 *  - Computer Science availability varies by board and school
 */

export interface Subject {
  id: string
  name: string
  shortName: string
  emoji: string
  category: 'core' | 'language' | 'optional'
  parent?: string
}

const MATH: Subject = { id: 'math', name: 'Mathematics', shortName: 'Maths', emoji: '🔢', category: 'core' }
const ENGLISH: Subject = { id: 'english', name: 'English', shortName: 'Eng', emoji: '📚', category: 'language' }
const HINDI: Subject = { id: 'hindi', name: 'Hindi', shortName: 'Hindi', emoji: '🇮🇳', category: 'language' }
const SST: Subject = { id: 'social_science', name: 'Social Science', shortName: 'SST', emoji: '🌍', category: 'core' }
const SCIENCE: Subject = { id: 'science', name: 'Science', shortName: 'Sci', emoji: '🔬', category: 'core' }
const PHYSICS: Subject = { id: 'physics', name: 'Physics', shortName: 'Phy', emoji: '⚡', category: 'core', parent: 'science' }
const CHEMISTRY: Subject = { id: 'chemistry', name: 'Chemistry', shortName: 'Chem', emoji: '🧪', category: 'core', parent: 'science' }
const BIOLOGY: Subject = { id: 'biology', name: 'Biology', shortName: 'Bio', emoji: '🧬', category: 'core', parent: 'science' }
const CS: Subject = { id: 'computer_science', name: 'Computer Science', shortName: 'CS', emoji: '💻', category: 'optional' }
const SANSKRIT: Subject = { id: 'sanskrit', name: 'Sanskrit', shortName: 'Sans', emoji: '📜', category: 'optional' }
const EVS: Subject = { id: 'evs', name: 'Environmental Studies', shortName: 'EVS', emoji: '🌱', category: 'optional' }

/** Subjects per class with emoji, ordered for display. */
export const SUBJECTS_BY_CLASS: Record<number, Subject[]> = {
  6: [SCIENCE, MATH, SST, ENGLISH, HINDI, EVS, CS, SANSKRIT],
  7: [SCIENCE, MATH, SST, ENGLISH, HINDI, EVS, CS, SANSKRIT],
  8: [PHYSICS, CHEMISTRY, BIOLOGY, MATH, SST, ENGLISH, HINDI, EVS, CS, SANSKRIT],
  9: [PHYSICS, CHEMISTRY, BIOLOGY, MATH, SST, ENGLISH, HINDI, CS, SANSKRIT],
  10: [PHYSICS, CHEMISTRY, BIOLOGY, MATH, SST, ENGLISH, HINDI, CS, SANSKRIT],
}

/**
 * Get the list of subjects for a given class level.
 */
export function getSubjects(classLevel: number, _board?: string): Subject[] {
  return SUBJECTS_BY_CLASS[classLevel] ?? SUBJECTS_BY_CLASS[9]
}

/**
 * Get all unique subject IDs for a class.
 */
export function getSubjectIds(classLevel: number, board?: string): string[] {
  return getSubjects(classLevel, board).map((s) => s.id)
}
