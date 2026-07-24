import { useState, lazy, Suspense } from 'react'
import { useLocation } from 'wouter'
import { signOut } from '../lib/auth'
import ErrorBoundary from '../components/ui/ErrorBoundary'

import {
  Package,
  Star,
  FolderTree,
  Layers,
  LogOut,
  ShoppingCart,
  DollarSign,
  Percent,
  BarChart3,
} from 'lucide-react'

type AdminTab =
  | 'analytics'
  | 'products'
  | 'orders'
  | 'seller-payouts'
  | 'marketplace-settings'
  | 'reviews'
  | 'categories'
  | 'collections'

// Lazy-load panels for modular code-splitting
const AnalyticsPanel = lazy(() => import('../components/admin/panels/AnalyticsPanel'))
const ProductsPanel = lazy(() => import('../components/admin/panels/ProductsPanel'))
const OrdersPanel = lazy(() => import('../components/admin/panels/OrdersPanel'))
const SellerPayoutsPanel = lazy(() => import('../components/admin/panels/SellerPayoutsPanel'))
const MarketplaceSettingsPanel = lazy(() => import('../components/admin/panels/MarketplaceSettingsPanel'))
const ReviewsPanel = lazy(() => import('../components/admin/panels/ReviewsPanel'))
const CategoriesPanel = lazy(() => import('../components/admin/panels/CategoriesPanel'))
const CollectionsPanel = lazy(() => import('../components/admin/panels/CollectionsPanel'))

function TabPanelSkeleton() {
  return (
    <div className="space-y-6 font-sans py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-lg w-48" />
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  )
}

export default function AdminPage() {
  const [, setLocation] = useLocation()
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics')

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
          <div>
            <h1 className="font-heading text-3xl font-medium text-[#111111]">
              Hokhiyoti Biponi Admin Hub
            </h1>
            <p className="font-sans text-xs text-gray-500 font-light mt-1">
              Production Luxury Marketplace Engine & Store Controls
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await signOut()
                setLocation('/')
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-white hover:bg-[#B08D57] font-sans text-xs font-semibold tracking-wider transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-black/10 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'seller-payouts', label: 'Seller Payouts', icon: DollarSign },
            { id: 'marketplace-settings', label: 'Commission Settings', icon: Percent },
            { id: 'reviews', label: 'Reviews', icon: Star },
            { id: 'categories', label: 'Categories', icon: FolderTree },
            { id: 'collections', label: 'Collections', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`inline-flex items-center gap-2 px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#B08D57] text-[#B08D57] bg-white/60 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-[#111111]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Active Tab Panel Renderer with Suspense and Error Boundary */}
        <div className="pt-2">
          <ErrorBoundary>
            <Suspense fallback={<TabPanelSkeleton />}>
              {activeTab === 'analytics' && <AnalyticsPanel />}
              {activeTab === 'products' && <ProductsPanel />}
              {activeTab === 'orders' && <OrdersPanel />}
              {activeTab === 'seller-payouts' && <SellerPayoutsPanel />}
              {activeTab === 'marketplace-settings' && <MarketplaceSettingsPanel />}
              {activeTab === 'reviews' && <ReviewsPanel />}
              {activeTab === 'categories' && <CategoriesPanel />}
              {activeTab === 'collections' && <CollectionsPanel />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
