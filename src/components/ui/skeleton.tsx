/**
 * Skeleton — pulsing placeholder loader.
 */

import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-btn bg-elevated animate-skeleton-pulse', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
