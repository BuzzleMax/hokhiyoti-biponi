import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-8 right-8 z-[40] flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.06)] bg-[#FFFFFF] text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6] shadow-soft transition-colors duration-300"
        >
          <ArrowUp className="h-4 w-4 stroke-[1.2]" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
