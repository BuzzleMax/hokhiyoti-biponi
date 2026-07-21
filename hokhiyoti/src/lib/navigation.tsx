import type { NavigateOptions } from 'wouter'
import { Link, useLocation } from 'wouter'
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

/**
 * Smart navigation component.
 *
 * - `to="#section"` → smooth-scrolls to the element with that id, even if
 *   we're on a sub-page (navigates home first, then scrolls after paint).
 * - `to="/"` → navigates to the app root (works with base "/hokhiyoti-biponi/").
 * - Any other path → standard wouter <Link>.
 */
export function AppLink({
  to,
  className,
  children,
  onClick,
  'aria-label': ariaLabel,
}: AppLinkProps) {
  const [, navigate] = useLocation()

  const isHash = to.startsWith('#')

  if (isHash) {
    const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      onClick?.()

      const id = to.slice(1)
      const el = document.getElementById(id)

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        // We're on a sub-page — navigate home, then scroll after React re-renders.
        navigate('/')
        // Use a small delay to let React render the home page sections.
        setTimeout(() => {
          const target = document.getElementById(id)
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      }
    }

    return (
      <a
        href={to}
        className={className}
        aria-label={ariaLabel}
        onClick={handleHashClick}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}
