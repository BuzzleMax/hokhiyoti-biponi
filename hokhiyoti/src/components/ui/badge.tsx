import type { HTMLAttributes } from 'react'

import { cn } from '../../lib/utils'


export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
'inline-flex items-center rounded-full border border-[var(--color-accent-border)]/60 bg-[var(--color-accent-bg)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]',
        className,
      )}
      {...props}
    />
  )
}

