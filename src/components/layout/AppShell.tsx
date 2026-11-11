/**
 * AppShell — wrapper for all authenticated /app/* routes.
 *
 * Checks if a student profile exists in Dexie.
 * If not (and not in demo mode), redirects to /onboarding.
 * Renders: ThemeProvider + DemoBanner + Header + Sidebar + Outlet + BottomTabBar + ToastManager.
 */

import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { DemoBanner } from './DemoBanner'
import { ThemeProvider } from './ThemeProvider'
import { ToastManager } from '../ui/toast'
import { db } from '../../lib/db'
import { useAppStore } from '../../store/appStore'
import { Skeleton } from '../ui/skeleton'

function LoadingShell() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="h-16 border-b border-border">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex flex-1">
        <div className="hidden md:block w-16 border-r border-border">
          <Skeleton className="h-full w-full" />
        </div>
        <main className="flex-1 p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-card" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export function AppShell() {
  const navigate = useNavigate()
  const demoMode = useAppStore((s) => s.demoMode)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkProfile() {
      try {
        const profile = await db.studentProfile.get(1)
        if (!profile && !demoMode) {
          navigate('/onboarding', { replace: true })
        }
      } catch {
        // If DB fails, still try to show the app
      } finally {
        setChecking(false)
      }
    }

    checkProfile()
  }, [demoMode, navigate])

  if (checking) {
    return (
      <ThemeProvider>
        <LoadingShell />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-bg flex flex-col">
        <DemoBanner />
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main
            className="flex-1 overflow-y-auto pb-20 md:pb-0"
            id="main-content"
          >
            <Outlet />
          </main>
        </div>
        <BottomTabBar />
        <ToastManager />
      </div>
    </ThemeProvider>
  )
}
