import type { ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'

import AnnouncementBar from './AnnouncementBar'
import BackToTop from './BackToTop'
import Footer from './Footer'
import Header from './Header'
import Newsletter from './Newsletter'
import MobileMenu from './MobileMenu'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-[#FAF9F6] text-[#111111] flex flex-col font-sans">
      <AnnouncementBar />

      <Header>
        {(menuOpen: boolean, setMenuOpen: (v: boolean) => void) => (
          <AnimatePresence>
            {menuOpen ? (
              <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
            ) : null}
          </AnimatePresence>
        )}
      </Header>

      <main className="flex-1 flex flex-col">
        <div className="flex-1">{children}</div>
        <Newsletter />
        <Footer />
      </main>

      <BackToTop />
    </div>
  )
}
