import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AppLink } from '../../../lib/navigation'
import { collectionService } from '../../../services/data'
import type { Collection } from '../../../types/collection.types'
import heroImage from '../../../assets/hero.png'

export default function FeaturedCollection() {
  const [collections, setCollections] = useState<Collection[] | null>(null)

  useEffect(() => {
    let cancelled = false
    collectionService
      .listCollections()
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
    <section id="collection" className="bg-[#FAF9F6] py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-[600px]">
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
            CURATED SELECTIONS
          </span>
          <h2 className="mt-3 font-heading text-3xl md:text-4xl font-medium text-[#111111] leading-tight">
            Featured Collections
          </h2>
          <p className="mt-3 font-sans text-sm text-[#666666] leading-relaxed">
            Discover thoughtfully grouped selections of hand-loomed heritage fibers, curated for the modern wardrobe.
          </p>
        </div>
        <AppLink
          to="/collection"
          className="font-sans text-xs font-semibold tracking-widest text-[#111111] hover:text-[#B08D57] transition-colors duration-300 pb-1 border-b border-[#111111]"
        >
          VIEW ALL COLLECTIONS
        </AppLink>
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {collections && collections.length > 0 ? collections.map((col, index) => {
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-soft border border-[rgba(0,0,0,0.03)]"
            >
              {/* Image */}
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#FAF9F6]">
                <img
                  src={heroImage}
                  alt={col.name}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="absolute bottom-6 left-6 text-white">
                  <span className="font-sans text-[10px] tracking-widest uppercase font-semibold text-[#FAF9F6]/90">
                    COLLECTION
                  </span>
                  <h3 className="font-heading text-2xl font-medium mt-1">{col.name}</h3>
                </div>
              </div>

              {/* Description & Link */}
              <div className="p-8 flex flex-col justify-between flex-grow">
                <p className="font-sans text-sm text-[#666666] leading-relaxed mb-6 font-light">
                  {col.description}
                </p>
                <AppLink to="/collection">
                  <button
                    type="button"
                    className="h-12 w-full rounded-full border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6] transition-colors duration-300 font-sans text-xs font-semibold tracking-widest"
                  >
                    EXPLORE COLLECTION
                  </button>
                </AppLink>
              </div>
            </motion.div>
          )
        }) : (
          <div className="md:col-span-2 py-12 text-center text-sm font-sans text-[#666666] tracking-wide">
            Featured collections will appear here once real store collections are added.
          </div>
        )}
      </div>
    </section>
  )
}
