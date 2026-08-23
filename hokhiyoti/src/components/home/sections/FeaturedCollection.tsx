import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AppLink } from '../../../lib/navigation'
import { supabaseCollectionService } from '../../../services/supabase/collection.service'
import type { Collection } from '../../../types/collection.types'

export default function FeaturedCollection() {
  const [collections, setCollections] = useState<Collection[] | null>(null)

  useEffect(() => {
    let cancelled = false
    supabaseCollectionService
      .getFeaturedCollections()
      .then((res) => {
        if (!cancelled) setCollections(res)
      })
      .catch(() => {
        if (!cancelled) setCollections([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="collection" className="bg-[#FAF9F6] py-20 md:py-28 px-6 md:px-12 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-[650px]">
          <span className="font-sans text-[11px] font-medium tracking-[0.2em] text-[#B08D57] uppercase">
            Curated Selections
          </span>
          <h2 className="mt-4 font-heading text-3xl md:text-4xl font-medium text-[#0a0a0a] leading-tight">
            Featured Collections
          </h2>
          <p className="mt-4 font-sans text-sm text-[#4a4a4a] leading-relaxed">
            Discover thoughtfully grouped selections of hand-loomed heritage fibers, curated for the modern wardrobe.
          </p>
        </div>
        <AppLink
          to="/collection"
          className="font-sans text-xs font-semibold tracking-[0.15em] text-[#0a0a0a] hover:text-[#B08D57] transition-colors duration-400 pb-1 border-b border-[#0a0a0a] hover:border-[#B08D57]"
        >
          VIEW ALL COLLECTIONS
        </AppLink>
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {collections && collections.length > 0 ? collections.map((col, index) => {
          const colRoute = `/collection/${col.slug || col.id}`
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: index * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <AppLink
                to={colRoute}
                className="group relative flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-elevated border border-[rgba(0,0,0,0.04)] cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF9F6]">
                  <img
                    src={col.imageUrl || '/assets/hero.png'}
                    alt={col.name}
                    className="w-full h-full object-cover transition-transform duration-1200 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-600" />
                  <div className="absolute bottom-8 left-8 text-white">
                    <span className="font-sans text-[10px] tracking-[0.2em] uppercase font-semibold text-[#FAF9F6]/90">
                      Collection
                    </span>
                    <h3 className="font-heading text-2xl font-medium mt-2">{col.name}</h3>
                  </div>
                </div>

                {/* Description & Link */}
                <div className="p-10 flex flex-col justify-between flex-grow">
                  <p className="font-sans text-sm text-[#4a4a4a] leading-relaxed mb-8 font-light">
                    {col.description}
                  </p>
                  <button
                    type="button"
                    className="h-12 w-full rounded-lg border border-[#0a0a0a] text-[#0a0a0a] group-hover:bg-[#0a0a0a] group-hover:text-[#FAF9F6] transition-colors duration-400 font-sans text-xs font-semibold tracking-[0.15em] cursor-pointer"
                  >
                    EXPLORE COLLECTION
                  </button>
                </div>
              </AppLink>
            </motion.div>
          )
        }) : (
          <div className="md:col-span-2 py-16 text-center text-sm font-sans text-[#8a8a8a] tracking-wide">
            Featured collections will appear here once collections are marked as featured in the admin panel.
          </div>
        )}
      </div>
    </section>
  )
}
