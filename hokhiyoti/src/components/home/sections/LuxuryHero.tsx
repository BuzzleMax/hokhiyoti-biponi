import { motion } from 'framer-motion'
import { ArrowDown, ShoppingBag, MessageCircle } from 'lucide-react'
import { AppLink } from '../../../lib/navigation'
import heroImage from '../../../assets/mekhela-chador-hero.png'
import logo from '../../../assets/logo.png'

export default function LuxuryHero() {
  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    })
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Background Image Container with Slow Zoom */}
      <div className="absolute inset-0 w-full h-full">
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, ease: 'linear' }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={heroImage}
            alt="Handwoven Mekhela Chador by Hokhiyoti Biponi"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
        {/* Luxury Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 z-10" />
        <div className="absolute inset-0 bg-black/20 z-10" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 flex h-full w-full flex-col justify-center px-6 md:px-16 lg:px-24 max-w-[1600px] mx-auto">
        <div className="max-w-[800px]">
          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-6"
          >
            <img
              src={logo}
              alt="Hokhiyoti Biponi"
              className="h-12 md:h-16 w-auto object-contain"
            />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-serif text-[clamp(3rem,7vw,6rem)] font-medium leading-[1.1] tracking-tight mb-6 text-[#FFF8E7]"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Premium Assamese<br />
            Handloom Collection
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-sans text-[#FFF8E7]/90 text-base md:text-lg max-w-[50ch] leading-relaxed mb-12 font-light tracking-wide"
          >
            Handwoven Mekhela Chador crafted by Assamese artisans.
          </motion.p>

          {/* Premium CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <AppLink to="/collection">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative h-14 px-10 bg-[#D4AF37] text-[#0a0a0a] overflow-hidden transition-all duration-500"
              >
                <div className="absolute inset-0 bg-[#B8960C] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <span className="relative flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.2em] uppercase">
                  <ShoppingBag className="w-4 h-4" />
                  Shop Collection
                </span>
              </motion.button>
            </AppLink>
            
            <motion.a
              href="https://wa.me/916003426591?text=I'm interested in ordering a Mekhela Chador from Hokhiyoti Biponi"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative h-14 px-10 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] overflow-hidden transition-all duration-500"
            >
              <div className="absolute inset-0 bg-[#D4AF37] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <span className="relative flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.2em] uppercase group-hover:text-[#0a0a0a] transition-colors duration-300">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Order
              </span>
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 cursor-pointer"
        onClick={scrollToNextSection}
      >
        <span className="font-sans text-[10px] tracking-[0.35em] text-[#D4AF37]/80 font-medium uppercase">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-4 h-4 text-[#D4AF37]/80 stroke-[1.5]" />
        </motion.div>
      </motion.div>
    </section>
  )
}
