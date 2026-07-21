import { useEffect, useMemo, useState } from 'react'
import { Menu, Search, ShoppingBag, MessageCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'wouter'

import Navbar, { rightItems } from './Navbar'
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
    document.documentElement.style.setProperty('--site-header-offset', '80px')
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
    return children ? children(menuOpen, setMenuOpen) : null
  }, [children, menuOpen])

  return (
    <header
      className={`sticky top-0 z-[55] w-full border-b border-[rgba(0,0,0,0.06)] transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] h-20 items-center justify-between px-4 md:px-8">
        {/* Left Side Navigation (Desktop) */}
        <div className="hidden lg:flex items-center w-1/3 justify-start">
          <Navbar />
        </div>

        {/* Mobile Menu Trigger */}
        <div className="lg:hidden flex items-center w-1/3 justify-start">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-start text-[#111111] hover:text-[#B08D57] transition-colors"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5 stroke-[1.2]" aria-hidden="true" />
          </button>
        </div>

        {/* Center Logo */}
        <div className="flex items-center justify-center w-1/3 text-center">
          <AppLink to="/" className="inline-block group" onClick={handleLogoClick}>
            <img
              src={logo}
              alt="Hokhiyoti Biponi"
              className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </AppLink>
        </div>

        {/* Right Side Navigation (Desktop) */}
        <div className="hidden lg:flex items-center w-1/3 justify-end gap-1">
          {rightItems.map((item) => (
            <AppLink
              key={item.to}
              to={item.to}
              className="relative px-4 py-2 text-sm font-sans font-medium tracking-wide text-[#111111] hover:text-[#B08D57] transition-all duration-300 group"
            >
              <span className="relative inline-block">
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B08D57] transition-all duration-300 group-hover:w-full"></span>
              </span>
            </AppLink>
          ))}
          {/* WhatsApp Icon */}
          <a
            href="https://wa.me/916003426591"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center text-[#111111] hover:text-[#25D366] transition-all duration-300 hover:scale-110"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-5 w-5 stroke-[1.2]" aria-hidden="true" />
          </a>
        </div>

        {/* Right Side Icons (Mobile) */}
        <div className="lg:hidden flex items-center w-1/3 justify-end gap-2">
          <AppLink
            to="/search"
            className="inline-flex h-10 w-10 items-center justify-center text-[#111111] hover:text-[#B08D57] transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 stroke-[1.2]" aria-hidden="true" />
          </AppLink>
          <AppLink
            to="/collection"
            className="inline-flex h-10 w-10 items-center justify-center text-[#111111] hover:text-[#B08D57] transition-colors relative"
            aria-label="Shop"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.2]" aria-hidden="true" />
          </AppLink>
        </div>
      </div>

      {content}

      {/* Close on ESC */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            onKeyDown={(e) => {
              if (e.key === 'Escape') setMenuOpen(false)
            }}
          />
        ) : null}
      </AnimatePresence>
    </header>
  )
}
