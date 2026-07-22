import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'wouter'

import type { Product } from '../../../types/product.types'
import { supabaseProductService } from '../../../services/supabase/product.service'

export default function EditorsPicks() {
  const [products, setProducts] = useState<Product[] | null>(null)

  void products




  useEffect(() => {
    let cancelled = false
    supabaseProductService
      .getProducts()
      .then((res) => {
        if (!cancelled) setProducts(res.slice(0, 6))
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto max-w-[1126px] px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Editor’s Picks</div>
          <h2 className="mt-2 font-heading text-2xl sm:text-3xl">Quiet statements, curated</h2>
        </div>
        <Link
          to="/collection"
          className="hidden sm:inline-flex text-sm text-[var(--color-muted)] hover:text-[var(--color-text-strong)]"
        >
          Explore
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.25 }}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]/70 bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
            <div className="aspect-[16/10] bg-[rgba(229,228,231,0.35)] relative">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.20),rgba(0,0,0,0))]" />
              <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-muted)]">Editorial Photo</div>
            </div>
            <div className="p-4">
              <div className="font-heading text-[15px]">Editor’s pick #{i + 1}</div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">Material-focused styling and subtle contrast</div>
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-text-strong)]">
                Read the story <span aria-hidden="true">→</span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)]/70 bg-[var(--color-surface)] overflow-hidden">
            <div className="aspect-[4/5] bg-[rgba(229,228,231,0.35)]" />
            <div className="p-4">
              <div className="h-4 w-4/5 rounded bg-[rgba(229,228,231,0.55)]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[rgba(229,228,231,0.45)]" />
              <div className="mt-3 h-3 w-1/3 rounded bg-[rgba(229,228,231,0.45)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

