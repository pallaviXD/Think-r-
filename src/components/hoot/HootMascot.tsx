/**
 * HootMascot — Animated owl mascot component.
 *
 * Renders the correct Hoot SVG for the given expression with
 * AnimatePresence crossfade on expression change.
 * When no expression prop is given, reads from uiStore.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useUIStore, type HootExpression } from '../../store/uiStore'

// Import all Hoot expression SVGs
import hootThinking from '../../assets/hoot/hoot-thinking.svg'
import hootHappy from '../../assets/hoot/hoot-happy.svg'
import hootCelebrating from '../../assets/hoot/hoot-celebrating.svg'
import hootSleeping from '../../assets/hoot/hoot-sleeping.svg'
import hootEncouraging from '../../assets/hoot/hoot-encouraging.svg'

const EXPRESSION_SRCS: Record<HootExpression, string> = {
  thinking: hootThinking,
  happy: hootHappy,
  celebrating: hootCelebrating,
  sleeping: hootSleeping,
  encouraging: hootEncouraging,
}

const SIZE_MAP = {
  sm: 48,
  md: 80,
  lg: 120,
}

interface HootMascotProps {
  expression?: HootExpression
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
  alt?: string
}

export function HootMascot({
  expression,
  size = 'md',
  animate = true,
  className = '',
  alt,
}: HootMascotProps) {
  const storeExpression = useUIStore((s) => s.hootExpression)
  const activeExpression = expression ?? storeExpression
  const shouldReduceMotion = useReducedMotion()

  const px = SIZE_MAP[size]
  const src = EXPRESSION_SRCS[activeExpression]

  if (!animate || shouldReduceMotion) {
    return (
      <img
        src={src}
        width={px}
        height={px}
        alt={alt ?? `Hoot is ${activeExpression}`}
        className={className}
        style={{ imageRendering: 'crisp-edges' }}
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.img
        key={activeExpression}
        src={src}
        width={px}
        height={px}
        alt={alt ?? `Hoot is ${activeExpression}`}
        className={className}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ imageRendering: 'crisp-edges' }}
      />
    </AnimatePresence>
  )
}

export default HootMascot
