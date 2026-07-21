import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center h-12 px-8 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D57] disabled:pointer-events-none disabled:opacity-50',
        'bg-[#111111] text-[#FAF9F6] border border-[#111111] hover:bg-transparent hover:text-[#111111]',
        className,
      )}
      {...props}
    />
  )
}
