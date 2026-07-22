import { motion } from 'framer-motion'
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
  { to: '#contact', label: 'Contact' },
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
  if (!open) return null

  const close = () => onOpenChange(false)

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        className="fixed inset-0 bg-[#111111]/40 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.aside
        role="dialog"
        aria-modal="true"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 flex h-full w-full max-w-[380px] flex-col bg-[#FAF9F6] p-8 shadow-soft border-r border-[rgba(0,0,0,0.06)]"
      >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between pb-8 border-b border-[rgba(0,0,0,0.06)]">
          <AppLink to="/" onClick={close} className="inline-block">
            <img
              src={logo}
              alt="Hokhiyoti Biponi"
              className="h-8 w-auto object-contain"
            />
          </AppLink>
          <button
            type="button"
            onClick={close}
            className="p-2 text-[#111111] hover:text-[#B08D57] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 stroke-[1.2]" />
          </button>
        </div>

        {/* Navigation links with stagger */}
        <div className="flex-1 py-12 flex flex-col justify-between">
          <nav className="flex flex-col gap-6">
            <div className="space-y-4">
              <p className="text-xs font-medium tracking-widest text-[#666666] mb-4">MENU</p>
              {leftItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AppLink
                    to={item.to}
                    onClick={close}
                    className="font-heading text-xl font-medium tracking-wide text-[#111111] hover:text-[#B08D57] transition-colors block"
                  >
                    {item.label}
                  </AppLink>
                </motion.div>
              ))}
            </div>
            <div className="space-y-4 pt-6">
              <p className="text-xs font-medium tracking-widest text-[#666666] mb-4">EXPLORE</p>
              {rightItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + leftItems.length) * 0.05 }}
                >
                  <AppLink
                    to={item.to}
                    onClick={close}
                    className="font-heading text-xl font-medium tracking-wide text-[#111111] hover:text-[#B08D57] transition-colors block"
                  >
                    {item.label}
                  </AppLink>
                </motion.div>
              ))}
            </div>
          </nav>

          {/* Socials / Footer of Mobile Drawer */}
          <div className="space-y-6 pt-8 border-t border-[rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-6">
              <AppLink
                to="/search"
                onClick={close}
                className="flex items-center gap-3 text-xs tracking-wider text-[#666666] hover:text-[#111111]"
              >
                <Search className="h-4 w-4 stroke-[1.2]" />
                <span>SEARCH</span>
              </AppLink>
              <AppLink
                to="/collection"
                onClick={close}
                className="flex items-center gap-3 text-xs tracking-wider text-[#666666] hover:text-[#111111]"
              >
                <ShoppingBag className="h-4 w-4 stroke-[1.2]" />
                <span>SHOP</span>
              </AppLink>
              <a
                href="https://wa.me/916003426591"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-xs tracking-wider text-[#666666] hover:text-[#25D366]"
                onClick={close}
              >
                <MessageCircle className="h-4 w-4 stroke-[1.2]" />
                <span>WHATSAPP</span>
              </a>
              <a
                href="https://www.instagram.com/hokhiyoti_biponi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-xs tracking-wider text-[#666666] hover:text-[#E1306C]"
                onClick={close}
              >
                <Camera className="h-4 w-4 stroke-[1.2]" />
                <span>INSTAGRAM</span>
              </a>
            </div>
            <div className="text-[11px] text-[#666666] leading-relaxed tracking-wide">
              <p className="font-medium text-[#111111] mb-1">ASSAM, INDIA</p>
              <p>Muga &amp; Eri Silk Curations</p>
              <p>hokhiyotibiponi@gmail.com</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  )
}
