import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-8 text-[#111111] shadow-soft border border-[rgba(0,0,0,0.03)]',
        className,
      )}
      {...props}
    />
  )
}
