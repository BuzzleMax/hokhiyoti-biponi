import { AppLink } from '../../lib/navigation'

export type NavItem = {
  to: string
  label: string
}

const leftItems: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Collections' },
  { to: '/category', label: 'Categories' },
  { to: '/about', label: 'About' },
]

const rightItems: NavItem[] = [
  { to: '/contact', label: 'Contact' },
  { to: '/search', label: 'Search' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/account', label: 'Account' },
]

function NavLink({ item, className }: { item: NavItem; className?: string }) {
  return (
    <AppLink
      to={item.to}
      className={`relative px-4 py-2 text-sm font-sans font-medium tracking-wide text-[#111111] hover:text-[#B08D57] transition-all duration-300 group ${className || ''}`}
    >
      <span className="relative inline-block">
        {item.label}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B08D57] transition-all duration-300 group-hover:w-full"></span>
      </span>
    </AppLink>
  )
}

export default function Navbar({ className }: { className?: string }) {
  return (
    <nav className={className} aria-label="Primary">
      <div className="flex items-center gap-1">
        {leftItems.map((item) => (
          <NavLink key={item.to} item={item} />
        ))}
      </div>
    </nav>
  )
}

export { rightItems }
