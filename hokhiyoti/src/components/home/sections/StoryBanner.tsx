import { motion } from 'framer-motion'
import { AppLink } from '../../../lib/navigation'
import heroImage from '../../../assets/hero.png'

export default function StoryBanner() {
  return (
    <section className="bg-[#FAF9F6] py-20 px-6 md:px-12 max-w-[1400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative overflow-hidden rounded-2xl bg-[#111111] text-white min-h-[500px] flex items-center shadow-soft border border-[rgba(0,0,0,0.06)]"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src={heroImage}
            alt="Material curation detail - raw cotton and organic linen yarn"
            className="w-full h-full object-cover filter saturate-[0.7] contrast-[0.95]"
          />
        </div>

        {/* Content */}
        <div className="relative z-20 w-full max-w-[700px] p-8 md:p-16 space-y-6">
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
            EDITORIAL EDIT
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-medium leading-[1.1] text-white">
            The Material Moment: <br />
            Assam's Muga Gold
          </h2>
          <p className="font-sans text-sm md:text-base text-white/80 max-w-[50ch] leading-relaxed font-light">
            Eri and Muga silks possess unique thermal qualities: warm in winter, cool in summer. Naturally gold, zero dyes are used. Reframe your relationship with fibers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <AppLink to="/collection">
              <button
                type="button"
                className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#FFFFFF] text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6] transition-colors duration-300 font-sans text-xs font-semibold tracking-widest"
              >
                READ THE EDIT
              </button>
            </AppLink>
            <AppLink to="/search">
              <button
                type="button"
                className="w-full sm:w-auto h-12 px-8 rounded-full bg-transparent border border-white/30 text-white hover:bg-white/10 transition-colors duration-300 font-sans text-xs font-semibold tracking-widest"
              >
                SHOP THE LOOK
              </button>
            </AppLink>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
