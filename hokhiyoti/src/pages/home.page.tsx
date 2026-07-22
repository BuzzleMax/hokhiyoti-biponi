import {
  FeaturedCollection,
  FeaturedProducts,
  NewArrivals,
  BestSellers,
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
      <NewArrivals />
      <BestSellers />
      <AboutHokhiyoti />
      <StoryBanner />
      <Testimonials />
      <InstagramStyleGallery />
    </div>
  )
}
