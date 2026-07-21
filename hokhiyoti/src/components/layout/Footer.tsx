import { motion } from 'framer-motion'
import { AppLink } from '../../lib/navigation'
import logo from '../../assets/logo.png'

export default function Footer() {
  return (
    <footer className="bg-[#FAF9F6] border-t border-[rgba(0,0,0,0.06)] pt-24 pb-12 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-[rgba(0,0,0,0.06)]"
        >
          {/* Brand Story Column */}
          <div className="lg:col-span-5 space-y-6">
            <AppLink to="/" className="inline-block">
              <img
                src={logo}
                alt="Hokhiyoti Biponi"
                className="h-10 w-auto object-contain mb-4"
              />
            </AppLink>
            <p className="font-sans text-xs text-[#666666] leading-relaxed max-w-[40ch] font-light">
              Redefining luxury through Assamese handloom heritage. Curating pure Eri and golden Muga silk, crafted by local master weavers to cultivate a quiet, confident, and timeless presence.
            </p>
            <div className="text-[10px] tracking-widest text-[#111111] font-semibold">
              ASSAM · INDIA
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Collections Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-sans text-[10px] font-semibold tracking-widest text-[#111111] uppercase">
              Collections
            </h4>
            <ul className="space-y-2.5">
              <li>
                <AppLink to="/collection" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light">
                  All Collections
                </AppLink>
              </li>
              <li>
                <AppLink to="/category" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light">
                  Categories
                </AppLink>
              </li>
              <li>
                <AppLink to="/search" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light">
                  Search
                </AppLink>
              </li>
            </ul>
          </div>

          {/* Customer Service Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-sans text-[10px] font-semibold tracking-widest text-[#111111] uppercase">
              Customer Service
            </h4>
            <ul className="space-y-2.5">
              <li>
                <AppLink to="/shipping" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light">
                  Shipping Policy
                </AppLink>
              </li>
              <li>
                <AppLink to="/refund" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light">
                  Refund Policy
                </AppLink>
              </li>
              <li>
                <AppLink to="/terms" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light">
                  Terms & Conditions
                </AppLink>
              </li>
              <li>
                <AppLink to="/contact" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light">
                  Contact
                </AppLink>
              </li>
            </ul>
          </div>

          {/* Socials / Journal Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-sans text-[10px] font-semibold tracking-widest text-[#111111] uppercase">
              Connect
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://www.instagram.com/hokhiyoti_biponi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light tracking-wide block"
                >
                  INSTAGRAM
                </a>
              </li>
              <li>
                <AppLink to="/about" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light tracking-wide block">
                  ABOUT
                </AppLink>
              </li>
              <li>
                <AppLink to="/faq" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light tracking-wide block">
                  FAQ
                </AppLink>
              </li>
              <li>
                <AppLink to="/privacy" className="font-sans text-xs text-[#666666] hover:text-[#B08D57] transition-colors font-light tracking-wide block">
                  PRIVACY POLICY
                </AppLink>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[11px] text-[#666666] font-light">
          <div>
            © {new Date().getFullYear()} HOKHIYOTI BIPONI. ALL RIGHTS RESERVED.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <AppLink to="/privacy" className="hover:text-[#111111] transition-colors">PRIVACY POLICY</AppLink>
            <AppLink to="/terms" className="hover:text-[#111111] transition-colors">TERMS & CONDITIONS</AppLink>
            <AppLink to="/refund" className="hover:text-[#111111] transition-colors">REFUND POLICY</AppLink>
            <AppLink to="/shipping" className="hover:text-[#111111] transition-colors">SHIPPING POLICY</AppLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
