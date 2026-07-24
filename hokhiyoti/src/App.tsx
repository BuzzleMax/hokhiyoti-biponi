import { useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Router, Switch, useLocation } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'

import { SiteLayout } from './components/layout'
import HomePage from './pages/home.page'
import QueryProvider from './components/layout/QueryProvider'
import ThemeProvider from './components/layout/ThemeProvider'

// Route-based code splitting
const AdminLoginPage = lazy(() => import('./pages/admin-login.page'))
const AdminPage = lazy(() => import('./pages/admin.page'))
const CategoryPage = lazy(() => import('./pages/category.page'))
const CollectionPage = lazy(() => import('./pages/collection.page'))
const PolicyPage = lazy(() => import('./pages/policy.page'))
const ProductPage = lazy(() => import('./pages/product.page'))
const SearchPage = lazy(() => import('./pages/search.page'))

/**
 * Scroll to top when navigating to a new *page* route.
 * With hash-based routing, we use the wouter location hook which tracks the hash path.
 */
function ScrollToTopOnRouteChange() {
  const [location] = useLocation()

  useEffect(() => {
    // Scroll to top on route changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location])

  return null
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <Router hook={useHashLocation}>
          <SiteLayout>
            <ScrollToTopOnRouteChange />
            <AnimatePresence mode="wait">
              <motion.div
                key={typeof window !== 'undefined' ? window.location.pathname : 'ssr'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Suspense
                  fallback={
                    <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF9F6]">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border border-[#B08D57]/20 border-t-[#B08D57] rounded-full animate-spin" />
                        <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#B08D57]/60">Loading Hokhiyoti</span>
                      </div>
                    </div>
                  }
                >
                  <Switch>
                    <Route path="/" component={HomePage} />
                    <Route path="/collection" component={CollectionPage} />
                    <Route path="/category" component={CategoryPage} />
                    <Route path="/product/:id" component={ProductPage} />
                    <Route path="/search" component={SearchPage} />
                    <Route path="/policy" component={PolicyPage} />
                    <Route path="/privacy" component={PolicyPage} />
                    <Route path="/terms" component={PolicyPage} />
                    <Route path="/refund" component={PolicyPage} />
                    <Route path="/shipping" component={PolicyPage} />
                    <Route path="/contact" component={PolicyPage} />
                    <Route path="/about" component={PolicyPage} />
                    <Route path="/faq" component={PolicyPage} />
                    <Route path="/admin-login" component={AdminLoginPage} />
                    <Route path="/admin" component={AdminPage} />
                  </Switch>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </SiteLayout>
        </Router>
      </ThemeProvider>
    </QueryProvider>
  )
}

