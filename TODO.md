# Admin Panel & Data Management Overhaul

## Steps

### 1. Supabase SQL
- [ ] Create complete SQL with categories & collections tables, RLS policies, triggers, indexes

### 2. Supabase Services
- [ ] Create `src/services/supabase/category.service.ts`
- [ ] Create `src/services/supabase/collection.service.ts`
- [ ] Export new services

### 3. Admin Panel Overhaul
- [ ] Rewrite `admin.page.tsx` with tabs: Products | Categories | Collections
- [ ] Product form: fix checkboxes, add dropdown selectors
- [ ] Category CRUD form
- [ ] Collection CRUD form
- [ ] Update `admin-login.page.tsx` styling to match

### 4. Home Page Sections
- [ ] Add `NewArrivals` section to `home.page.tsx`
- [ ] Fix `FeaturedProducts.tsx` to use `getFeaturedProducts()` instead of `getBestSellers()`

### 5. Test & Verify
- [ ] Run `npm run build` to verify no errors

