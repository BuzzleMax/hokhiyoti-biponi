import {
  FeaturedCollection,
  FeaturedProducts,
  AboutHokhiyoti,
  LuxuryHero,
  StoryBanner,
  Testimonials,
  InstagramStyleGallery,
} from '../components/home/sections'

export default function HomePage() {
  return (
    <div className="space-y-0">
      <LuxuryHero />
      <FeaturedCollection />
      <FeaturedProducts />
      <AboutHokhiyoti />
      <StoryBanner />
      <Testimonials />
      <InstagramStyleGallery />
    </div>
  )
}
