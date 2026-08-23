import {
  FeaturedCollection,
  FeaturedProducts,
  NewArrivals,
  BestSellers,
  PremiumCollection,
  ExploreSection,
  AboutHokhiyoti,
  LuxuryHero,
  StoryBanner,
  Testimonials,
  InstagramStyleGallery,
  WatchBuySection,
} from '../components/home/sections'


export default function HomePage() {
  return (
    <div className="space-y-0">
      <LuxuryHero />
      <FeaturedCollection />
      <FeaturedProducts />
      <WatchBuySection />
      <NewArrivals />
      <BestSellers />
      <PremiumCollection />
      <ExploreSection />
      <AboutHokhiyoti />
      <StoryBanner />
      <Testimonials />
      <InstagramStyleGallery />
    </div>
  )
}
