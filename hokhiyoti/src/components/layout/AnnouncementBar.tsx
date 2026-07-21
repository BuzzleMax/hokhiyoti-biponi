import { motion } from 'framer-motion'

export default function AnnouncementBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="w-full bg-[#111111] text-[#FAF9F6] py-2.5 px-4 text-center border-b border-transparent"
    >
      <div className="mx-auto flex items-center justify-center gap-2 text-[10px] tracking-widest font-sans font-medium">
        <span>SHOP DIRECTLY ON WHATSAPP FOR AVAILABILITY, SHIPPING, AND ORDER CONFIRMATION</span>
      </div>
    </motion.div>
  )
}
