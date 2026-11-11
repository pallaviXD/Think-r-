/**
 * Sidebar — desktop-only collapsible navigation.
 * Hidden on mobile (< 768px). Framer Motion collapse animation.
 */

import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, MessageSquare, BookOpen, Library, BarChart2, User, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/app/home', icon: Home, label: 'Home' },
  { to: '/app/tutor', icon: MessageSquare, label: 'Tutor' },
  { to: '/app/study', icon: BookOpen, label: 'Study' },
  { to: '/app/library', icon: Library, label: 'Library' },
  { to: '/app/progress', icon: BarChart2, label: 'Progress' },
  { to: '/app/profile', icon: User, label: 'Profile' },
]

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <aside
      className="hidden md:flex flex-col h-full border-r border-border bg-surface relative"
      aria-label="Main navigation"
    >
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-3 flex-1 mt-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-btn',
                  'text-sm font-medium transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  'min-h-[44px]', // WCAG tap target
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:bg-primary-soft hover:text-primary'
                )
              }
              aria-label={!sidebarOpen ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center m-3 h-9 w-9 rounded-btn',
            'text-text-muted hover:text-primary hover:bg-primary-soft',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'self-end'
          )}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </motion.div>
    </aside>
  )
}
