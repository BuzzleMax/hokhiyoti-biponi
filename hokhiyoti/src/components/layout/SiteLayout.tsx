import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'

import AnnouncementBar from './AnnouncementBar'
import BackToTop from './BackToTop'
import Footer from './Footer'
import Header from './Header'
import Newsletter from './Newsletter'

const HokhiyotiAIStylist = lazy(() => import('../ui/HokhiyotiAIStylist'))

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-[#FAF9F6] text-[#111111] flex flex-col font-sans">
      <AnnouncementBar />

      <Header />

      <main className="flex-1 flex flex-col">
        <div className="flex-1">{children}</div>
        <Newsletter />
        <Footer />
      </main>

      <BackToTop />
      <Suspense fallback={null}>
        <HokhiyotiAIStylist />
      </Suspense>
    </div>
  )
}

