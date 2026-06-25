import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/20 text-primary',
        secondary: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
        destructive: 'border-red-500/30 bg-red-500/20 text-red-400',
        outline: 'border-border text-muted',
        success: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
        warning: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
        muted: 'border-slate-500/30 bg-slate-500/20 text-slate-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
