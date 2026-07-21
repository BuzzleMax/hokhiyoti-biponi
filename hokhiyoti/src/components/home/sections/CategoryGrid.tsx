import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'wouter'

import type { Category } from '../../../types/category.types'
import { categoryService } from '../../../services/data'

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[] | null>(null)

  void categories

  useEffect(() => {
    let cancelled = false
    categoryService
      .listCategories()
      .then((res) => {
        if (!cancelled) setCategories(res)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto max-w-[1126px] px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Category Grid</div>
          <h2 className="mt-2 font-heading text-2xl sm:text-3xl">Shop by mood</h2>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.25 }}
        className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        {["Dresses","Tops","Bottoms","Outerwear","Sets","Accessories"].map((c) => (
          <Link
            key={c}
            to="/category"
            className="group rounded-[var(--radius-md)] border border-[var(--color-border)]/70 bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-med)] transition-[transform,box-shadow]"
          >
            <div className="aspect-[1/1] bg-[rgba(229,228,231,0.35)] relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.32),transparent_55%)]" />
              <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-muted)]">{c}</div>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  )
}

