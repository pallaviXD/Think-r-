/**
 * Toast — Radix Toast with four severity variants.
 * Auto-managed via uiStore.
 */

import * as ToastPrimitive from '@radix-ui/react-toast'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { useUIStore } from '../../store/uiStore'

const ToastProvider = ToastPrimitive.Provider
const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4',
      'sm:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

type ToastSeverity = 'info' | 'success' | 'warning' | 'error'

const severityConfig: Record<ToastSeverity, {
  icon: React.ComponentType<{ className?: string }>
  className: string
}> = {
  info: { icon: Info, className: 'border-border bg-surface text-text' },
  success: { icon: CheckCircle, className: 'border-success/30 bg-success/10 text-success' },
  warning: { icon: AlertTriangle, className: 'border-warning/30 bg-warning/10 text-warning' },
  error: { icon: AlertCircle, className: 'border-danger/30 bg-danger/10 text-danger' },
}

const Toast = forwardRef<
  ElementRef<typeof ToastPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
    severity?: ToastSeverity
  }
>(({ className, severity = 'info', ...props }, ref) => {
  const config = severityConfig[severity]

  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        'pointer-events-auto relative flex w-full items-center gap-3',
        'rounded-card border p-4 shadow-lg',
        'transition-all duration-300',
        'data-[state=open]:animate-slide-up',
        config.className,
        className
      )}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitive.Root.displayName

const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'ml-auto shrink-0 rounded-btn p-1',
      'opacity-60 hover:opacity-100 transition-opacity',
      'focus:outline-none focus:ring-2 focus:ring-primary',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

// ── Toast Manager — renders all active toasts from uiStore ────────────────

export function ToastManager() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((toast) => {
        const config = severityConfig[toast.severity]
        const Icon = config.icon
        return (
          <Toast
            key={toast.id}
            severity={toast.severity}
            duration={toast.duration ?? 4000}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id)
            }}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <ToastTitle>{toast.message}</ToastTitle>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

export { Toast, ToastTitle, ToastClose, ToastProvider, ToastViewport }
