# TODO - HOKHIYOTI (Luxury Static React for GitHub Pages)

## Step 1: Scaffold project
- [ ] Create Vite + React 19 + TypeScript project
- [ ] Configure Vite for GitHub Pages static hosting (base path support)
- [ ] Add routing entry for Wouter

## Step 2: Styling system
- [ ] Install Tailwind CSS v4 and configure
- [ ] Set up shadcn/ui and Tailwind integration
- [ ] Add global design tokens (luxury palette, typography, spacing, motion)

## Step 3: Core app shell
- [ ] Create layout shell components (Header, Footer, Grid)
- [ ] Implement consistent Page container + responsive nav

## Step 4: Data layer (services)
- [x] Create `src/types/*` for product/category/collection schemas
- [x] Create `src/services/data/product.service.ts`
- [x] Create `src/services/data/category.service.ts`
- [x] Create `src/services/data/collection.service.ts`
- [x] Add caching + typed fetch from `public/data/*.json`


## Step 5: Pages + sections
- [ ] Create Wouter pages: home, category, collection, product, search, policy
- [ ] Build home page sections (editorial, collections grid, featured products)

## Step 6: Product UI system
- [ ] Product gallery (main image + thumbnails)
- [ ] Product purchase panel (size selection UI)
- [ ] Product card + quick view modal

## Step 7: Luxury motion
- [ ] Add Framer Motion wrappers with reduced-motion support
- [ ] Ensure subtle transitions, no cheap effects

## Step 8: Cart (optional but recommended)
- [ ] Implement cart context with localStorage persistence
- [ ] Add Bag drawer UI (motion + accessibility)

## Step 9: Forms & validation
- [ ] Implement newsletter form with React Hook Form + Zod
- [ ] Implement policy/contact forms as client-only (no backend)

## Step 10: Build & GitHub Pages verification
- [ ] Run `npm run build` and fix warnings/errors
- [ ] Confirm `dist/` can deploy to GitHub Pages
- [ ] Validate direct route access behavior

