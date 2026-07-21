# TODO - Luxury editorial redesign

## Step 1 — Establish luxury typography + tokens
- [ ] Update `hokhiyoti/index.html` to load Playfair Display + Inter
- [ ] Update `hokhiyoti/src/index.css` to enforce heading/body typography hierarchy
- [ ] Ensure colors match strict palette (bg/surface/borders/accent)

## Step 2 — Header redesign
- [ ] Rewrite `hokhiyoti/src/components/layout/Header.tsx`
- [ ] Update `hokhiyoti/src/components/layout/Navbar.tsx` for Apple-like alignment
- [ ] Update `hokhiyoti/src/components/layout/MobileMenu.tsx` for clean drawer content

## Step 3 — Hero redesign
- [ ] Replace `hokhiyoti/src/components/home/sections/LuxuryHero.tsx` with new 100vh editorial hero

## Step 4 — Product card redesign
- [ ] Replace `hokhiyoti/src/components/home/ProductCard.tsx` card layout (4:5, soft shadow, image zoom)

## Step 5 — Sections redesign + renaming to required set
- [ ] Update `hokhiyoti/src/pages/home.page.tsx` ordering + ensure required sections set
- [ ] Restyle: `FeaturedCollection`, `FeaturedProducts` (Best Sellers), `EditorsPicks`, `AboutHokhiyoti` (Brand Story), `StoryBanner` (Featured Banner), `Testimonials` (Customer Reviews), `InstagramStyleGallery`, `NewsletterSection`

## Step 6 — Footer redesign + consolidate newsletter
- [ ] Rewrite `hokhiyoti/src/components/layout/Footer.tsx` (luxury editorial footer)
- [ ] Decide between `layout/Newsletter.tsx` and `home/sections/NewsletterSection.tsx` and consolidate

## Step 7 — Global luxury polish
- [ ] Ensure no glassmorphism usage remains in key components
- [ ] Ensure buttons are 48px height and luxury hover/focus

## Step 8 — Build + fix
- [x] Run `npm run build`
- [x] Fix errors/warnings (build succeeded)
- [ ] Verify responsive behavior


