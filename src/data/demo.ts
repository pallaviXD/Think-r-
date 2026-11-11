/**
 * Thinkr Demo Mode Seed Data.
 *
 * Used when demoMode = true in appStore.
 * Provides rich sample data for every page so the exhibition demo looks complete.
 * No actual file data or LLM calls happen in demo mode.
 */

import type { ThinkrDB } from '../lib/db'

export const DEMO_DATA = {
  profile: {
    id: 1,
    name: 'Arjun Sharma',
    board: 'cbse',
    classLevel: 9,
    subjects: ['physics', 'chemistry', 'biology', 'math', 'social_science', 'english', 'hindi'],
    language: 'en' as const,
    xp: 1240,
    streak: 7,
    lastStudyDate: new Date().toISOString().split('T')[0],
    examDates: [
      { subject: 'Mathematics', date: '2025-03-15' },
      { subject: 'Science', date: '2025-03-18' },
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },

  pdfDocuments: [
    {
      id: 'demo-pdf-1',
      name: 'Science Textbook Class 9',
      subject: 'science',
      chapter: 'Chapter 6: Tissues',
      type: 'textbook' as const,
      status: 'ready' as const,
      pageCount: 45,
      fileSize: 2400000,
      thumbnail: null,
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-pdf-2',
      name: 'Maths Practice Paper',
      subject: 'math',
      chapter: 'Polynomials',
      type: 'question_paper' as const,
      status: 'ready' as const,
      pageCount: 8,
      fileSize: 450000,
      thumbnail: null,
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-pdf-3',
      name: 'Half-Yearly Marks Card',
      subject: 'math',
      chapter: '',
      type: 'marks_card' as const,
      status: 'ready' as const,
      pageCount: 1,
      fileSize: 150000,
      thumbnail: null,
      uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  chatSession: {
    id: 'demo-session-1',
    subject: 'science',
    title: 'What is photosynthesis?',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },

  chatMessages: [
    {
      id: 'demo-msg-1',
      sessionId: 'demo-session-1',
      role: 'user' as const,
      content: 'What is photosynthesis?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-msg-2',
      sessionId: 'demo-session-1',
      role: 'assistant' as const,
      content: `Great question, Arjun! **Photosynthesis** is the process by which plants, algae, and some bacteria convert light energy into chemical energy (food).

The overall equation is:

$$6CO_2 + 6H_2O \\xrightarrow{\\text{sunlight}} C_6H_{12}O_6 + 6O_2$$

**Key points:**
1. Occurs in the **chloroplasts** (specifically the thylakoid membranes and stroma)
2. Requires: sunlight, water (from roots), and CO₂ (from air via stomata)
3. Produces: glucose (stored as starch) and oxygen (released into air)

The process has two stages:
- **Light reactions** (in thylakoids): capture light energy, split water, produce ATP and NADPH
- **Calvin cycle** (in stroma): uses ATP/NADPH to fix CO₂ into glucose

Would you like me to explain either stage in more detail?`,
      sources: [{ docId: 'demo-pdf-1', docName: 'Science Textbook Class 9', pageNumber: 42 }],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
    },
    {
      id: 'demo-msg-3',
      sessionId: 'demo-session-1',
      role: 'user' as const,
      content: 'What happens in the light reactions?',
      timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-msg-4',
      sessionId: 'demo-session-1',
      role: 'assistant' as const,
      content: `The **light reactions** (also called the light-dependent reactions) happen in the **thylakoid membranes** of the chloroplast.

**Steps:**
1. Light hits chlorophyll pigments → electrons get excited to higher energy levels
2. Water molecules are split (**photolysis**): $2H_2O \\rightarrow 4H^+ + 4e^- + O_2$
3. The released $O_2$ is the oxygen we breathe! 🌱
4. Excited electrons pass through the **electron transport chain** → produces ATP
5. NADP⁺ accepts electrons + H⁺ → forms **NADPH**

The products (ATP and NADPH) are then used in the Calvin cycle to make sugar.

> Think of it this way: light reactions are like **charging a battery** (ATP + NADPH), and the Calvin cycle is using that battery to do work (make glucose).`,
      sources: [{ docId: 'demo-pdf-1', docName: 'Science Textbook Class 9', pageNumber: 43 }],
      timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000 + 8000).toISOString(),
    },
  ],

  quizResults: [
    {
      id: 'demo-quiz-1',
      subject: 'science',
      chapter: 'Tissues',
      score: 8,
      maxScore: 10,
      questionCount: 10,
      difficulty: 'medium' as const,
      questions: [],
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-quiz-2',
      subject: 'math',
      chapter: 'Polynomials',
      score: 6,
      maxScore: 10,
      questionCount: 10,
      difficulty: 'hard' as const,
      questions: [],
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  marksEntry: {
    id: 'demo-marks-1',
    examName: 'Half-Yearly Examination',
    entries: [
      { subject: 'Mathematics', obtained: 78, maximum: 100 },
      { subject: 'Science', obtained: 85, maximum: 100 },
      { subject: 'Social Science', obtained: 72, maximum: 100 },
      { subject: 'English', obtained: 88, maximum: 100 },
      { subject: 'Hindi', obtained: 65, maximum: 100 },
    ],
    uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },

  dailyPlan: {
    id: new Date().toISOString().split('T')[0],
    items: [
      { subject: 'Mathematics', chapter: 'Polynomials', task: 'Solve 10 practice problems on factorisation', duration: 30, done: false },
      { subject: 'Science', chapter: 'Tissues', task: 'Revise plant tissue types with diagrams', duration: 20, done: true },
      { subject: 'Hindi', chapter: 'Grammar', task: 'Practice sandhi rules — 15 examples', duration: 25, done: false },
    ],
    createdAt: new Date().toISOString(),
  },

  chapterMastery: [
    { id: 'science-tissues', subject: 'Science', chapter: 'Tissues', mastery: 72, quizCount: 2, lastStudied: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: 'math-polynomials', subject: 'Mathematics', chapter: 'Polynomials', mastery: 55, quizCount: 1, lastStudied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'science-photosynthesis', subject: 'Science', chapter: 'Photosynthesis', mastery: 80, quizCount: 3, lastStudied: new Date().toISOString() },
  ],
}

/**
 * Seed the Dexie database with demo data.
 * Safe to call multiple times — clears and repopulates demo records.
 */
export async function seedDemoData(db: ThinkrDB): Promise<void> {
  // Clear existing data first
  await db.studentProfile.clear()
  await db.pdfDocuments.clear()
  await db.chatSessions.clear()
  await db.chatMessages.clear()
  await db.quizResults.clear()
  await db.marksEntries.clear()
  await db.dailyPlans.clear()
  await db.chapterMastery.clear()

  // Seed all tables
  await db.studentProfile.add(DEMO_DATA.profile)
  await db.pdfDocuments.bulkAdd(DEMO_DATA.pdfDocuments)
  await db.chatSessions.add(DEMO_DATA.chatSession)
  await db.chatMessages.bulkAdd(DEMO_DATA.chatMessages)
  await db.quizResults.bulkAdd(DEMO_DATA.quizResults)
  await db.marksEntries.add(DEMO_DATA.marksEntry)
  await db.dailyPlans.add(DEMO_DATA.dailyPlan)
  await db.chapterMastery.bulkAdd(DEMO_DATA.chapterMastery)
}
