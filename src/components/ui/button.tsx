/**
 * Button — CVA-based button component with Thinkr brand variants.
 * Min 44px height on md/lg for accessibility (WCAG tap target).
 */

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  // Base styles — shared across all variants
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-btn font-heading font-semibold',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-brand text-white',
          'shadow-md',
          'hover:opacity-90 hover:shadow-lg',
          'active:scale-[0.98]',
        ],
        secondary: [
          'bg-transparent text-primary',
          'border-2 border-primary',
          'hover:bg-primary-soft',
          'active:scale-[0.98]',
        ],
        ghost: [
          'bg-transparent text-text-muted',
          'hover:bg-primary-soft hover:text-primary',
          'active:scale-[0.98]',
        ],
        danger: [
          'bg-danger text-white',
          'hover:opacity-90',
          'active:scale-[0.98]',
        ],
        outline: [
          'bg-transparent text-text',
          'border border-border',
          'hover:bg-elevated hover:border-primary',
          'active:scale-[0.98]',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-sm', // 44px = h-11 satisfies WCAG 2.5.5
        lg: 'h-12 px-7 text-base', // 48px
        icon: 'h-11 w-11', // square icon button
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
