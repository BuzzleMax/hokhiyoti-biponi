import type { NavigateOptions } from 'wouter'
import { Link } from 'wouter'
import type { ReactNode } from 'react'

export type AppLinkProps = {
  to: string
  className?: string
  children: ReactNode
  prefetch?: boolean
  options?: NavigateOptions
  onClick?: () => void
  'aria-label'?: string
}

export function AppLink({ to, className, children, onClick, 'aria-label': ariaLabel }: AppLinkProps) {
  return (
    <Link to={to} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}
