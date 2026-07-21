import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const total = Math.max(1, el.scrollHeight - el.clientHeight)
      const p = (el.scrollTop / total) * 100
      setProgress(Math.min(100, Math.max(0, p)))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed left-0 top-[var(--site-announcement-height,44px)] z-[80] h-[2px] w-full bg-transparent">
      <motion.div
        className="h-full bg-[var(--color-accent)]"
        style={{ width: `${progress}%` }}
        initial={false}
        transition={{ duration: 0.12, ease: 'linear' }}
      />
    </div>
  )
}

