import { motion } from 'framer-motion'
import heroImage from '../../../assets/hero.png'

const IMAGES = [
  heroImage,
  heroImage,
  heroImage,
  heroImage,
  heroImage,
  heroImage,
]

export default function InstagramStyleGallery() {
  return (
    <section className="bg-[#FFFFFF] py-24 px-6 md:px-12 max-w-[1400px] mx-auto rounded-3xl my-12 border border-[rgba(0,0,0,0.03)] shadow-soft">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
            COMMUNITY & INSPIRATION
          </span>
          <h2 className="mt-3 font-heading text-3xl md:text-4xl font-medium text-[#111111] leading-tight">
            Instagram Gallery
          </h2>
        </div>
        <a
          href="https://www.instagram.com/hokhiyoti_biponi/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs font-semibold tracking-widest text-[#111111] hover:text-[#B08D57] transition-colors duration-300 cursor-pointer pb-1 border-b border-[#111111]"
        >
          @HOKHIYOTI
        </a>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {IMAGES.map((img, index) => (
          <a
            key={index}
            href="https://www.instagram.com/hokhiyoti_biponi/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-xl bg-[#FAF9F6] border border-[rgba(0,0,0,0.03)] cursor-pointer"
            >
              <img
                src={img}
                alt={`Instagram editorial styling feature ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Soft Hover Overlay */}
              <div className="absolute inset-0 bg-[#111111]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="bg-white/95 text-[#111111] font-sans text-[10px] tracking-widest font-semibold py-2 px-4 rounded-full shadow-soft transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  VIEW LOOK
                </span>
              </div>
            </motion.div>
          </a>
        ))}
      </div>
    </section>
  )
}
