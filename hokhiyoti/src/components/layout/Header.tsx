import { useEffect, useMemo, useState } from 'react'
import { Menu, Search, ShoppingBag, MessageCircle } from 'lucide-react'
import { useLocation } from 'wouter'

import Navbar, { rightItems } from './Navbar'
import MobileMenu from './MobileMenu'
import { AppLink } from '../../lib/navigation'
import logo from '../../assets/logo.png'

export default function Header({
  children,
}: {
  children?: (menuOpen: boolean, setMenuOpen: (v: boolean) => void) => React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoClicks, setLogoClicks] = useState(0)
  const [, setLocation] = useLocation()

  useEffect(() => {
    document.documentElement.style.setProperty('--site-header-offset', '72px')
    document.documentElement.style.setProperty('--site-announcement-height', '0px')
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (logoClicks > 0) {
      const timeout = setTimeout(() => setLogoClicks(0), 5000)
      return () => clearTimeout(timeout)
    }
  }, [logoClicks])

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const newCount = prev + 1
      if (newCount === 7) {
        setLocation('/admin-login')
        return 0
      }
      return newCount
    })
  }

  const content = useMemo(() => {
    return children ? children(menuOpen, setMenuOpen) : <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
  }, [children, menuOpen])

  return (
    <header
      className={`sticky top-0 z-[55] w-full border-b border-[rgba(0,0,0,0.04)] transition-all duration-500 ${
        scrolled ? 'bg-white/98 backdrop-blur-sm shadow-soft' : 'bg-white'
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] h-[72px] items-center justify-between px-6 md:px-10 lg:px-16">
        {/* Left Side Navigation (Desktop) */}
        <div className="hidden lg:flex items-center w-1/3 justify-start">
          <Navbar />
        </div>

        {/* Mobile Menu Trigger */}
        <div className="lg:hidden flex items-center w-1/3 justify-start">
          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-start text-[#0a0a0a] hover:text-[#B08D57] transition-colors duration-300"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
          </button>
        </div>

        {/* Center Logo */}
        <div className="flex items-center justify-center w-1/3 text-center">
          <AppLink to="/" className="inline-block group" onClick={handleLogoClick}>
            <img
              src={logo}
              alt="Hokhiyoti Biponi"
              className="h-9 md:h-11 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </AppLink>
        </div>

        {/* Right Side Navigation (Desktop) */}
        <div className="hidden lg:flex items-center w-1/3 justify-end gap-2">
          {rightItems.map((item) => (
            <AppLink
              key={item.to}
              to={item.to}
              className="relative px-5 py-2 text-xs font-sans font-medium tracking-[0.15em] text-[#0a0a0a] hover:text-[#B08D57] transition-all duration-400 group"
            >
              <span className="relative inline-block">
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#B08D57] transition-all duration-400 group-hover:w-full"></span>
              </span>
            </AppLink>
          ))}

          {/* Search Icon */}
          <AppLink
            to="/search"
            className="inline-flex h-11 w-11 items-center justify-center text-[#0a0a0a] hover:text-[#B08D57] transition-all duration-400 hover:scale-105"
            aria-label="Search"
          >
            <Search className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
          </AppLink>
          {/* WhatsApp Icon */}
          <a
            href="https://wa.me/916003426591"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center text-[#0a0a0a] hover:text-[#25D366] transition-all duration-400 hover:scale-105"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
          </a>
        </div>

        {/* Right Side Icons (Mobile) */}
        <div className="lg:hidden flex items-center w-1/3 justify-end gap-3">
          <AppLink
            to="/search"
            className="inline-flex h-11 w-11 items-center justify-center text-[#0a0a0a] hover:text-[#B08D57] transition-colors duration-300"
            aria-label="Search"
          >
            <Search className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
          </AppLink>
          <AppLink
            to="/collection"
            className="inline-flex h-11 w-11 items-center justify-center text-[#0a0a0a] hover:text-[#B08D57] transition-colors duration-300 relative"
            aria-label="Shop"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
          </AppLink>
        </div>
      </div>

      {content}
    </header>
  )
}
