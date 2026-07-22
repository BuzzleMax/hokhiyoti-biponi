import { motion } from 'framer-motion'
import heroImage from '../../../assets/hero.png'

export default function AboutHokhiyoti() {
  return (
    <section id="about" className="bg-[#FFFFFF] py-24 px-6 md:px-12 max-w-[1400px] mx-auto rounded-3xl my-12 border border-[rgba(0,0,0,0.03)] shadow-soft">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Story Text */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
              OUR HERITAGE
            </span>
            <h2 className="mt-3 font-heading text-3xl md:text-5xl font-medium text-[#111111] leading-tight">
              A Quiet Dialogue Between Loom and Wardrobe
            </h2>
          </div>

          <p className="font-sans text-base text-[#666666] leading-relaxed font-light">
            Founded in Assam, Hokhiyoti stands as an editorial tribute to India’s most prized natural fibers: the golden Muga and organic Eri silk. We believe that true luxury lies in the silent confidence of hand-loomed heritage, crafted for contemporary wardrobes.
          </p>

          <p className="font-sans text-base text-[#666666] leading-relaxed font-light">
            Every thread is spun by hand, dyed with local botanicals, and woven on traditional wooden fly-shuttle looms. This slow process results in unique, living textures that gather character, deepening in beauty and softness over a lifetime.
          </p>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <h4 className="font-heading text-lg font-medium text-[#111111]">Muga & Eri Silk</h4>
              <p className="font-sans text-xs text-[#666666] leading-relaxed font-light">
                Indigenously sourced, organic, and naturally cruelty-free wild silks.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-heading text-lg font-medium text-[#111111]">Slow Craft</h4>
              <p className="font-sans text-xs text-[#666666] leading-relaxed font-light">
                Weeks of dedicated hand-looming condensed into single, unique silhouettes.
              </p>
            </div>
          </div>
        </div>

        {/* Story Image */}
        <div className="lg:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-soft bg-[#FAF9F6] border border-[rgba(0,0,0,0.03)]"
          >
            <img
              src={heroImage}
              alt="Assamese traditional handloom weaving detail with gold threads"
              className="w-full h-full object-cover filter saturate-[0.8]"
            />
          </motion.div>
          
          {/* Subtle floating quote block */}
          <div className="absolute -bottom-6 -left-6 bg-[#FAF9F6] p-6 rounded-2xl max-w-[240px] border border-[rgba(0,0,0,0.06)] shadow-soft hidden sm:block">
            <p className="font-heading text-sm italic text-[#111111] mb-2">
              "An heirloom curation designed to transcend seasonal trends."
            </p>
            <p className="font-sans text-[10px] tracking-wider text-[#B08D57] font-semibold">
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
