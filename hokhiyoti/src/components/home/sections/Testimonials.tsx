import { motion } from 'framer-motion'

export default function Testimonials() {
  const reviews = [
    {
      q: '“The Eri silk scarf feels living—soft yet structured, with a beautiful organic weight that drapes like nothing else in my wardrobe.”',
      a: 'Aparna S., Guwahati',
      loc: 'Verified Purchase',
    },
    {
      q: '“Pure minimalism. The color of the Muga silk is stunning in natural light. Zero dyes, just golden heritage that feels incredibly premium.”',
      a: 'Marc R., Geneva',
      loc: 'Verified Purchase',
    },
    {
      q: '“Every seam is finished with couture precision. The packaging arrived wrapped in handmade paper, reflecting true respect for slow luxury.”',
      a: 'Evelyn K., Kyoto',
      loc: 'Verified Purchase',
    },
  ]

  return (
    <section className="bg-[#FAF9F6] py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="max-w-[600px] mb-16">
        <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
          CLIENT NOTES
        </span>
        <h2 className="mt-3 font-heading text-3xl md:text-4xl font-medium text-[#111111] leading-tight">
          Customer Reviews
        </h2>
      </div>

      {/* Grid of Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.map((r, index) => (
          <motion.div
            key={r.a}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col justify-between bg-white p-8 md:p-10 rounded-2xl shadow-soft border border-[rgba(0,0,0,0.03)]"
          >
            <p className="font-sans text-sm md:text-base text-[#111111] leading-relaxed font-light italic">
              {r.q}
            </p>
            <div className="mt-8 pt-6 border-t border-[rgba(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <h4 className="font-sans text-xs font-semibold text-[#111111]">
                  {r.a.toUpperCase()}
                </h4>
                <p className="font-sans text-[10px] text-[#666666] mt-0.5 tracking-wider">
                  {r.loc}
                </p>
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="text-[#B08D57] text-[10px]">
                    ★
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
