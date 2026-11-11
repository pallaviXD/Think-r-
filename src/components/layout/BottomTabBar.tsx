/**
 * BottomTabBar — mobile-only bottom navigation.
 * Hidden on md+ screens. 44px+ tap targets. Safe area inset.
 */

import { NavLink } from 'react-router-dom'
import { Home, MessageSquare, BookOpen, BarChart2, User } from 'lucide-react'
import { cn } from '../../lib/utils'

const TABS = [
  { to: '/app/home', icon: Home, label: 'Home' },
  { to: '/app/tutor', icon: MessageSquare, label: 'Tutor' },
  { to: '/app/study', icon: BookOpen, label: 'Study' },
  { to: '/app/progress', icon: BarChart2, label: 'Progress' },
  { to: '/app/profile', icon: User, label: 'Profile' },
]

export function BottomTabBar() {
  return (
    <nav
      className={cn(
        'md:hidden',
        'fixed bottom-0 left-0 right-0 z-40',
        'flex items-stretch',
        'bg-surface border-t border-border',
        'glass',
        // Safe area inset for notched phones
        'pb-[env(safe-area-inset-bottom,0px)]'
      )}
      aria-label="Bottom navigation"
    >
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center',
              'min-h-[56px] py-2 gap-0.5',
              'text-xs font-medium transition-colors duration-200',
              'focus-visible:outline-none focus-visible:bg-primary-soft',
              isActive
                ? 'text-primary'
                : 'text-text-muted hover:text-primary'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'relative flex items-center justify-center h-6 w-6',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {/* Orange dot indicator on active tab */}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-primary"
                    aria-hidden
                  />
                )}
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
