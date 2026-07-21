import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Switch, useLocation } from 'wouter'

import { SiteLayout } from './components/layout'
import AdminLoginPage from './pages/admin-login.page'
import AdminPage from './pages/admin.page'
import CategoryPage from './pages/category.page'
import CollectionPage from './pages/collection.page'
import HomePage from './pages/home.page'
import PolicyPage from './pages/policy.page'
import ProductPage from './pages/product.page'
import SearchPage from './pages/search.page'
import QueryProvider from './components/layout/QueryProvider'
import ThemeProvider from './components/layout/ThemeProvider'

function ScrollToTopOnRouteChange() {
  const [location] = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location])

  return null
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <SiteLayout>
          <ScrollToTopOnRouteChange />
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== 'undefined' ? window.location.pathname : 'ssr'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
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
            </motion.div>
          </AnimatePresence>
        </SiteLayout>
      </ThemeProvider>
    </QueryProvider>
  )
}
