import { motion } from 'framer-motion'

export default function AnnouncementBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full bg-[#0a0a0a] text-[#FAF9F6] py-2 px-4 text-center border-b border-[rgba(176,141,87,0.15)]"
    >
      <div className="mx-auto flex items-center justify-center gap-3 text-[10px] tracking-[0.2em] font-sans font-medium">
        <span className="text-[#B08D57]">✦</span>
        <span className="text-[#FAF9F6]/90">SHOP DIRECTLY ON WHATSAPP</span>
        <span className="text-[#FAF9F6]/60">·</span>
        <span className="text-[#FAF9F6]/70">Availability · Shipping · Order Confirmation</span>
        <span className="text-[#B08D57]">✦</span>
      </div>
    </motion.div>
  )
}
