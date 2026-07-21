import { useEffect, useState } from 'react'
import { AppLink } from '../../lib/navigation'

export type NavItem = {
  to: string
  label: string
}

/**
 * Left-side nav: Home + hash-anchor sections on the home page.
 * These links never leave /hokhiyoti-biponi/.
 */
const leftItems: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '#collection', label: 'Collections' },
  { to: '#categories', label: 'Categories' },
  { to: '#about', label: 'About' },
]

const rightItems: NavItem[] = [
  { to: '#contact', label: 'Contact' },
  { to: '#newsletter', label: 'Newsletter' },
]

function NavLink({ item, className, active }: { item: NavItem; className?: string; active?: boolean }) {
  return (
    <AppLink
      to={item.to}
      className={`relative px-4 py-2 text-sm font-sans font-medium tracking-wide transition-all duration-300 group ${
        active ? 'text-[#B08D57]' : 'text-[#111111] hover:text-[#B08D57]'
      } ${className || ''}`}
    >
      <span className="relative inline-block">
        {item.label}
        <span
          className={`absolute bottom-0 left-0 h-0.5 bg-[#B08D57] transition-all duration-300 ${
            active ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
        />
      </span>
    </AppLink>
  )
}

export default function Navbar({ className }: { className?: string }) {
  const [activeHash, setActiveHash] = useState<string>('')

  // Track which section is currently in view for active highlighting.
  useEffect(() => {
    const sectionIds = ['hero', 'collection', 'categories', 'about', 'contact', 'newsletter']

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(entry.target.id)
          }
        })
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const isActive = (item: NavItem) => {
    if (item.to === '/') return activeHash === '' || activeHash === 'hero'
    if (item.to.startsWith('#')) return '#' + activeHash === item.to
    return false
  }

  return (
    <nav className={className} aria-label="Primary">
      <div className="flex items-center gap-1">
        {leftItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item)} />
        ))}
      </div>
    </nav>
  )
}

export { rightItems }
