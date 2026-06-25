import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-surface2 border-border text-text [&>svg]:text-text',
        destructive: 'bg-red-500/10 border-red-500/30 text-red-400 [&>svg]:text-red-400',
        success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 [&>svg]:text-emerald-400',
        warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400 [&>svg]:text-amber-400',
        info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 [&>svg]:text-cyan-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const alertIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & { showIcon?: boolean }
>(({ className, variant = 'default', showIcon = true, children, ...props }, ref) => {
  const Icon = alertIcons[variant ?? 'default']
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {showIcon && <Icon className="h-4 w-4" />}
      {children}
    </div>
  )
})
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
