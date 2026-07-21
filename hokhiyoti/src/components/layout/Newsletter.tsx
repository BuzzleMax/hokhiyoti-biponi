import { motion } from 'framer-motion'
import { Button } from '../ui/button'

export default function Newsletter() {
  return (
    <section className="bg-[#FAF9F6] py-24 px-6 md:px-12 max-w-[1400px] mx-auto border-t border-[rgba(0,0,0,0.06)]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-[800px] mx-auto text-center space-y-8"
      >
        <div className="space-y-3">
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
            STAY IN TOUCH
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-medium text-[#111111] leading-tight">
            The Newsletter
          </h2>
          <p className="font-sans text-sm md:text-base text-[#666666] leading-relaxed max-w-[50ch] mx-auto font-light">
            Sign up to receive private editorial drops, early collection access, and brand announcements. Delivered with absolute restraint.
          </p>
        </div>

        <form
          className="flex flex-col sm:flex-row gap-4 max-w-[500px] mx-auto pt-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            className="flex-1 h-12 px-6 rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#B08D57]"
            placeholder="Enter your email address"
            type="email"
            required
          />
          <Button type="submit">
            SUBSCRIBE
          </Button>
        </form>
      </motion.div>
    </section>
  )
}
