import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, ShoppingBag, MessageCircle, Camera } from 'lucide-react'
import { AppLink } from '../../lib/navigation'
import logo from '../../assets/logo.png'

/**
 * Same hash-anchor structure as Navbar.
 * All home-section links use #id — never navigate outside /hokhiyoti-biponi/.
 */
const leftItems: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Collections' },
  { to: '/category', label: 'Categories' },
  { to: '#about', label: 'About' },
]

const rightItems: Array<{ to: string; label: string }> = [
  { to: '/contact', label: 'Contact' },
  { to: '#newsletter', label: 'Newsletter' },
  { to: '/search', label: 'Search' },
]

export default function MobileMenu({
  onOpenChange,
  open,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const close = () => onOpenChange(false)

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-[#111111]/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            className="relative z-10 flex h-full w-full max-w-[400px] flex-col bg-[#FAF9F6] p-10 shadow-editorial border-r border-[rgba(0,0,0,0.04)] overflow-hidden"
          >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between pb-10 border-b border-[rgba(0,0,0,0.04)]">
          <AppLink to="/" onClick={close} className="inline-block">
            <img
              src={logo}
              alt="Hokhiyoti Biponi"
              className="h-10 w-auto object-contain"
            />
          </AppLink>
          <button
            type="button"
            onClick={close}
            className="p-3 text-[#0a0a0a] hover:text-[#B08D57] transition-colors duration-300"
            aria-label="Close"
          >
            <X className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>

        {/* Navigation links with stagger */}
        <div className="flex-1 py-12 flex flex-col justify-between overflow-y-auto">
          <nav className="flex flex-col gap-8">
            <div className="space-y-6">
              <p className="text-[11px] font-medium tracking-[0.2em] text-[#8a8a8a] mb-6">MENU</p>
              {leftItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                >
                  <AppLink
                    to={item.to}
                    onClick={close}
                    className="font-heading text-2xl font-medium tracking-tight text-[#0a0a0a] hover:text-[#B08D57] transition-colors duration-300 block"
                  >
                    {item.label}
                  </AppLink>
                </motion.div>
              ))}
            </div>
            <div className="space-y-6 pt-8">
              <p className="text-[11px] font-medium tracking-[0.2em] text-[#8a8a8a] mb-6">EXPLORE</p>
              {rightItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + leftItems.length) * 0.06, duration: 0.4 }}
                >
                  <AppLink
                    to={item.to}
                    onClick={close}
                    className="font-heading text-2xl font-medium tracking-tight text-[#0a0a0a] hover:text-[#B08D57] transition-colors duration-300 block"
                  >
                    {item.label}
                  </AppLink>
                </motion.div>
              ))}
            </div>
          </nav>

          {/* Socials / Footer of Mobile Drawer */}
          <div className="space-y-8 pt-10 border-t border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-8">
              <AppLink
                to="/search"
                onClick={close}
                className="flex items-center gap-3 text-[11px] tracking-[0.15em] text-[#8a8a8a] hover:text-[#0a0a0a] transition-colors duration-300"
              >
                <Search className="h-4 w-4 stroke-[1.5]" />
                <span>SEARCH</span>
              </AppLink>
              <AppLink
                to="/collection"
                onClick={close}
                className="flex items-center gap-3 text-[11px] tracking-[0.15em] text-[#8a8a8a] hover:text-[#0a0a0a] transition-colors duration-300"
              >
                <ShoppingBag className="h-4 w-4 stroke-[1.5]" />
                <span>SHOP</span>
              </AppLink>
              <a
                href="https://wa.me/916003426591"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[11px] tracking-[0.15em] text-[#8a8a8a] hover:text-[#25D366] transition-colors duration-300"
                onClick={close}
              >
                <MessageCircle className="h-4 w-4 stroke-[1.5]" />
                <span>WHATSAPP</span>
              </a>
              <a
                href="https://www.instagram.com/hokhiyoti_biponi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[11px] tracking-[0.15em] text-[#8a8a8a] hover:text-[#E1306C] transition-colors duration-300"
                onClick={close}
              >
                <Camera className="h-4 w-4 stroke-[1.5]" />
                <span>INSTAGRAM</span>
              </a>
            </div>
            <div className="text-[11px] text-[#8a8a8a] leading-relaxed tracking-wide">
              <p className="font-medium text-[#0a0a0a] mb-2">ASSAM, INDIA</p>
              <p>Muga &amp; Eri Silk Curations</p>
              <p>hokhiyotibiponi@gmail.com</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
      )}
    </AnimatePresence>
  )
}
