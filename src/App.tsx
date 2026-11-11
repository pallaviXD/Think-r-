/**
 * Thinkr App — root component with full routing.
 *
 * All pages are React.lazy-loaded with Suspense fallback.
 * ThemeProvider wraps the entire tree so the theme is available everywhere.
 *
 * Routes:
 *   /              → LandingPage
 *   /onboarding    → OnboardingWizard
 *   /app/*         → AppShell (checks for profile, redirects to /onboarding if none)
 *     /app/home        → HomePage
 *     /app/tutor       → TutorPage
 *     /app/study       → StudyPage
 *     /app/library     → LibraryPage
 *     /app/progress    → ProgressPage
 *     /app/profile     → ProfilePage
 *     /app/how-it-works → HowItWorksPage
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { Skeleton } from './components/ui/skeleton'

// Lazy-load all pages for code splitting
const Landing = lazy(() => import('./pages/Landing'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Home = lazy(() => import('./pages/Home'))
const Tutor = lazy(() => import('./pages/Tutor'))
const Study = lazy(() => import('./pages/Study'))
const Library = lazy(() => import('./pages/Library'))
const Progress = lazy(() => import('./pages/Progress'))
const Profile = lazy(() => import('./pages/Profile'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))

// Full-screen skeleton for Suspense fallback during lazy page loading
function SkeletonPage() {
  return (
    <div className="min-h-screen bg-bg p-6 space-y-4" aria-label="Loading…" role="status">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
      <span className="sr-only">Loading page…</span>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<SkeletonPage />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* App routes — protected by AppShell (checks profile) */}
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="tutor" element={<Tutor />} />
              <Route path="study" element={<Study />} />
              <Route path="library" element={<Library />} />
              <Route path="progress" element={<Progress />} />
              <Route path="profile" element={<Profile />} />
              <Route path="how-it-works" element={<HowItWorks />} />
            </Route>

            {/* Fallback — redirect unknown routes to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}
