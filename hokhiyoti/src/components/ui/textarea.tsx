import type { TextareaHTMLAttributes } from 'react'

import { cn } from '../../lib/utils'


export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
'flex min-h-[100px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)]/70 bg-transparent px-[var(--space-3)] py-2 text-sm',
        'text-[var(--color-text-strong)] placeholder:text-[var(--color-text)]/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/80',
        className,
      )}
      {...props}
    />
  )
}

