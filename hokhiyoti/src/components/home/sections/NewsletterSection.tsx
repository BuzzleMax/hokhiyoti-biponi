import { motion } from 'framer-motion'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

export default function NewsletterSection() {
  return (
    <section className="mx-auto max-w-[1126px] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.25 }}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)]/70 bg-[var(--color-surface)] shadow-[var(--shadow-soft)] p-6 sm:p-8 backdrop-blur supports-[backdrop-filter]:bg-[rgba(251,250,248,0.35)] dark:supports-[backdrop-filter]:bg-[rgba(21,22,28,0.35)]"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Newsletter</div>
            <h2 className="mt-2 font-heading text-2xl sm:text-3xl">Private drops, early access</h2>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Signature offers and curated edits—delivered with restraint.
            </p>
          </div>

          <form
            className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              className="sm:max-w-[380px]"
              placeholder="Your email"
              type="email"
              required
            />
            <Button type="submit" className="w-full sm:w-auto">
              Subscribe
            </Button>
          </form>
        </div>
      </motion.div>
    </section>
  )
}

