import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabaseProductService } from '../services/supabase/product.service'
import { supabaseCategoryService } from '../services/supabase/category.service'
import { supabaseCollectionService } from '../services/supabase/collection.service'
import { supabaseReviewService } from '../services/supabase/review.service'
import { supabaseOrderService } from '../services/supabase/order.service'
import { supabaseAnalyticsService } from '../services/supabase/analytics.service'
import { signOut } from '../lib/auth'

import type { Product } from '../types/product.types'
import type { Category } from '../types/category.types'
import type { Collection } from '../types/collection.types'
import type { ProductReview } from '../types/review.types'
import type { Order, OrderStatus, PaymentStatus, PayoutSummary, OrderTimeline } from '../types/order.types'
import type { AnalyticsOverview } from '../types/analytics.types'

import ProductMediaManager, { type ManagedMedia } from '../components/admin/ProductMediaManager'

import {
  Package,
  Star,
  FolderTree,
  Layers,
  Download,
  Trash2,
  Plus,
  LogOut,
  ShoppingCart,
  XCircle,
  DollarSign,
  Percent,
  Copy,
  Eye,
  EyeOff,
  BarChart3,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-white hover:bg-[#B08D57] font-sans text-xs font-semibold tracking-wider transition-colors"
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
                className={`inline-flex items-center gap-2 px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors ${
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

        {/* Active Tab Panel Renderer */}
        <div className="pt-2">
          {activeTab === 'analytics' && <AnalyticsPanel />}
          {activeTab === 'products' && <ProductsPanel />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'seller-payouts' && <SellerPayoutsPanel />}
          {activeTab === 'marketplace-settings' && <MarketplaceSettingsPanel />}
          {activeTab === 'reviews' && <ReviewsPanel />}
          {activeTab === 'categories' && <CategoriesPanel />}
          {activeTab === 'collections' && <CollectionsPanel />}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   1. ANALYTICS DASHBOARD PANEL
   ========================================================================= */
function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabaseAnalyticsService.getAnalyticsOverview().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return <p className="text-xs text-gray-500 py-8 text-center animate-pulse">Computing real-time store analytics...</p>
  }

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`

  return (
    <div className="space-y-8 font-sans">

      {/* ── Sales Dashboard ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-4 h-4 text-[#B08D57]" />
          <h3 className="font-semibold text-sm text-[#111111] uppercase tracking-wider">Sales Dashboard</h3>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Today's Revenue</span>
            <p className="text-2xl font-bold text-[#111111]">{formatINR(data.todayRevenue)}</p>
            <span className="text-[11px] text-emerald-600 font-medium">{data.todayOrders} Delivered Today</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Monthly Revenue</span>
            <p className="text-2xl font-bold text-emerald-700">{formatINR(data.monthlyRevenue)}</p>
            <span className="text-[11px] text-gray-500 font-light">{data.monthlyOrders} Delivered This Month</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Revenue (Earned)</span>
            <p className="text-2xl font-bold text-[#111111]">{formatINR(data.totalRevenue)}</p>
            <span className="text-[11px] text-gray-500 font-light">{data.totalOrders} Total Leads</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Avg Order Value</span>
            <p className="text-2xl font-bold text-[#111111]">{formatINR(data.averageOrderValue)}</p>
            <span className="text-[11px] text-gray-500 font-light">From delivered orders</span>
          </div>
        </div>

        {/* Order Status Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Leads Created', value: data.leadsCreated, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
            { label: 'Cust. Contacted', value: data.customerContacted, color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
            { label: 'Confirmed', value: data.confirmedOrders, color: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
            { label: 'Packed', value: data.packedOrders, color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
            { label: 'Shipped', value: data.shippedOrders, color: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
            { label: 'Delivered', value: data.deliveredOrders, color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
            { label: 'Cancelled', value: data.cancelledOrders, color: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
            { label: 'Rejected', value: data.rejectedOrders, color: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
          ].map((item) => (
            <div key={item.label} className={`p-3 rounded-xl border ${item.color} border-current/10 space-y-1 text-center`}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Commission Dashboard ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-4 h-4 text-[#B08D57]" />
          <h3 className="font-semibold text-sm text-[#111111] uppercase tracking-wider">Commission Dashboard</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Today's Commission</span>
            <p className="text-2xl font-bold text-[#B08D57]">{formatINR(data.todayCommission)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Monthly Commission</span>
            <p className="text-2xl font-bold text-[#B08D57]">{formatINR(data.monthlyCommission)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Commission</span>
            <p className="text-2xl font-bold text-[#B08D57]">{formatINR(data.totalCommission)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Seller Earnings</span>
            <p className="text-2xl font-bold text-emerald-600">{formatINR(data.sellerEarnings)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-700">Pending Commission</span>
            <p className="text-xl font-bold text-amber-700">{formatINR(data.pendingCommission)}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">Earned Commission</span>
            <p className="text-xl font-bold text-emerald-700">{formatINR(data.earnedCommission)}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-red-700">Cancelled</span>
            <p className="text-xl font-bold text-red-700">{formatINR(data.cancelledCommission)}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-700">Rejected</span>
            <p className="text-xl font-bold text-rose-700">{formatINR(data.rejectedCommission)}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-700">Paid Commission</span>
            <p className="text-xl font-bold text-blue-700">{formatINR(data.paidCommission)}</p>
          </div>
        </div>
      </div>

      {/* ── Graphs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-black/5 space-y-4">
          <h3 className="font-semibold text-sm text-[#111111] uppercase tracking-wider">Revenue Trend (Last 6 Months)</h3>
          <p className="text-[10px] text-gray-400">Only delivered orders counted</p>
          <div className="h-48 flex items-end justify-between gap-3 pt-2">
            {data.revenueGraph.map((item, idx) => {
              const maxRev = Math.max(...data.revenueGraph.map((r) => r.revenue), 1)
              const heightPct = Math.round((item.revenue / maxRev) * 100)
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-emerald-700">₹{item.revenue}</span>
                  <div className="w-full bg-emerald-600/80 hover:bg-emerald-600 rounded-t-lg transition-all" style={{ height: `${Math.max(heightPct, 8)}%` }} />
                  <span className="text-[10px] font-semibold text-gray-500">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-black/5 space-y-4">
          <h3 className="font-semibold text-sm text-[#111111] uppercase tracking-wider">Commission Trend (Last 6 Months)</h3>
          <p className="text-[10px] text-gray-400">Pending + Earned + Paid</p>
          <div className="h-48 flex items-end justify-between gap-3 pt-2">
            {data.commissionGraph.map((item, idx) => {
              const maxComm = Math.max(...data.commissionGraph.map((c) => c.commission), 1)
              const heightPct = Math.round((item.commission / maxComm) * 100)
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-[#B08D57]">₹{item.commission}</span>
                  <div className="w-full bg-[#B08D57]/80 hover:bg-[#B08D57] rounded-t-lg transition-all" style={{ height: `${Math.max(heightPct, 8)}%` }} />
                  <span className="text-[10px] font-semibold text-gray-500">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Best Sellers & Top Categories ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-black/5 space-y-4">
          <h3 className="font-semibold text-sm text-[#111111] uppercase tracking-wider">Best Selling Products</h3>
          {data.bestSellingProducts.length === 0 ? (
            <p className="text-xs text-gray-400">No delivered sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.bestSellingProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6]">
                  <div className="flex items-center gap-3">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-10 h-12 object-cover rounded-lg border" />}
                    <div>
                      <h4 className="font-semibold text-xs text-[#111111]">{p.name}</h4>
                      <p className="text-[10px] text-gray-500">₹{p.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-emerald-700">{p.soldCount} Sold</span>
                    <p className="text-[10px] text-gray-500">₹{p.revenue.toLocaleString('en-IN')} Rev</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-black/5 space-y-4">
          <h3 className="font-semibold text-sm text-[#111111] uppercase tracking-wider">Top Categories</h3>
          {data.topCategories.length === 0 ? (
            <p className="text-xs text-gray-400">No category sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topCategories.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6]">
                  <span className="font-semibold text-xs text-[#111111]">{c.categoryName}</span>
                  <div className="text-right">
                    <span className="font-bold text-xs text-[#B08D57]">{c.orderCount} Orders</span>
                    <p className="text-[10px] text-gray-500">₹{c.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   ORDER STATUS HELPERS
   ========================================================================= */
const ORDER_STATUSES: Array<{ value: OrderStatus; label: string; color: string; bg: string }> = [
  { value: 'lead_created',       label: 'Lead Created',       color: 'text-gray-600',   bg: 'bg-gray-100' },
  { value: 'customer_contacted', label: 'Customer Contacted', color: 'text-blue-700',   bg: 'bg-blue-50' },
  { value: 'confirmed',          label: 'Confirmed',          color: 'text-amber-800',  bg: 'bg-amber-50' },
  { value: 'packed',             label: 'Packed',             color: 'text-orange-700', bg: 'bg-orange-50' },
  { value: 'shipped',            label: 'Shipped',            color: 'text-indigo-700', bg: 'bg-indigo-50' },
  { value: 'delivered',          label: 'Delivered',          color: 'text-emerald-700',bg: 'bg-emerald-50' },
  { value: 'cancelled',          label: 'Cancelled',          color: 'text-red-700',    bg: 'bg-red-50' },
  { value: 'rejected',           label: 'Rejected',           color: 'text-rose-700',   bg: 'bg-rose-50' },
]

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUSES.find((x) => x.value === status)
  if (!s) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{status}</span>
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  )
}

/* =========================================================================
   2. PRODUCTS MANAGEMENT PANEL
   ========================================================================= */
function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    comparePrice: 0,
    categorySlug: '',
    categoryName: '',
    collectionSlug: '',
    collectionName: '',
    enableSizes: false,
    fabric: '',
    careInstructions: '',
    shippingInfo: '',
    returnPolicy: '',
    additionalInfo: '',
    featured: false,
    newArrival: false,
    bestSeller: false,
    stockQuantity: 10,
    media: [] as ManagedMedia[],
    coloursText: '',
    sizesText: '',
    highlightsText: '',
    seoTitle: '',
    seoDescription: '',
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await supabaseProductService.getProducts({ includeInactive: true })
      setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingProduct(null)
    setForm({
      name: '',
      slug: '',
      description: '',
      price: 0,
      comparePrice: 0,
      categorySlug: '',
      categoryName: '',
      collectionSlug: '',
      collectionName: '',
      enableSizes: false,
      fabric: '',
      careInstructions: '',
      shippingInfo: '',
      returnPolicy: '',
      additionalInfo: '',
      featured: false,
      newArrival: true,
      bestSeller: false,
      stockQuantity: 10,
      media: [],
      coloursText: '',
      sizesText: '',
      highlightsText: '',
      seoTitle: '',
      seoDescription: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod)
    const media: ManagedMedia[] = [
      ...prod.images.map((img, idx) => ({
        id: img.id,
        type: 'image' as const,
        url: img.url,
        alt: img.alt,
        isCover: img.isCover,
        sortOrder: img.sortOrder ?? idx,
      })),
      ...prod.videos.map((vid, idx) => ({
        id: vid.id,
        type: 'video' as const,
        url: vid.url,
        thumbnailUrl: vid.thumbnailUrl,
        alt: vid.alt,
        isCover: vid.isCover,
        sortOrder: vid.sortOrder ?? idx,
      })),
    ]

    setForm({
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      price: prod.price,
      comparePrice: prod.comparePrice || 0,
      categorySlug: prod.category?.slug || '',
      categoryName: prod.category?.name || '',
      collectionSlug: prod.collection?.slug || '',
      collectionName: prod.collection?.name || '',
      enableSizes: prod.enableSizes,
      fabric: prod.fabric || '',
      careInstructions: prod.careInstructions || '',
      shippingInfo: prod.shippingInfo || '',
      returnPolicy: prod.returnPolicy || '',
      additionalInfo: prod.additionalInfo || '',
      featured: prod.featured,
      newArrival: prod.newArrival,
      bestSeller: prod.bestSeller,
      stockQuantity: prod.stockQuantity,
      media,
      coloursText: prod.colours.map((c) => c.name).join(', '),
      sizesText: prod.sizes.map((s) => s.size).join(', '),
      highlightsText: prod.highlights.join('\n'),
      seoTitle: prod.seoTitle || '',
      seoDescription: prod.seoDescription || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      alert('Product Name and Price are required.')
      return
    }

    const images = form.media.filter((m) => m.type === 'image')
    const videos = form.media.filter((m) => m.type === 'video')

    const colours = form.coloursText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((name) => ({ name }))

    const sizes = form.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((size) => ({ size }))

    const highlights = form.highlightsText
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean)

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      categorySlug: form.categorySlug || undefined,
      categoryName: form.categoryName || undefined,
      collectionSlug: form.collectionSlug || undefined,
      collectionName: form.collectionName || undefined,
      enableSizes: form.enableSizes,
      fabric: form.fabric || undefined,
      careInstructions: form.careInstructions || undefined,
      shippingInfo: form.shippingInfo || undefined,
      returnPolicy: form.returnPolicy || undefined,
      additionalInfo: form.additionalInfo || undefined,
      featured: form.featured,
      newArrival: form.newArrival,
      bestSeller: form.bestSeller,
      stockQuantity: Number(form.stockQuantity),
      images: images.map((img) => ({ url: img.url, alt: img.alt, isCover: img.isCover })),
      videos: videos.map((vid) => ({ url: vid.url, thumbnailUrl: vid.thumbnailUrl, alt: vid.alt, isCover: vid.isCover })),
      colours,
      sizes,
      highlights,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
    }

    try {
      if (editingProduct) {
        await supabaseProductService.updateProduct(editingProduct.id, payload)
      } else {
        await supabaseProductService.createProduct(payload)
      }
      setIsModalOpen(false)
      loadProducts()
    } catch (err) {
      console.error(err)
      alert('Failed to save product.')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await supabaseProductService.duplicateProduct(id)
      loadProducts()
    } catch (err) {
      alert('Failed to duplicate product.')
    }
  }

  const handleTogglePublish = async (id: string, active: boolean) => {
    try {
      await supabaseProductService.toggleProductActive(id, !active)
      loadProducts()
    } catch (err) {
      alert('Failed to update product state.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await supabaseProductService.deleteProduct(id)
      loadProducts()
    } catch (err) {
      alert('Failed to delete product.')
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search products by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 pl-9 border rounded-lg text-xs bg-white focus:outline-none focus:border-[#B08D57]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-white hover:bg-[#B08D57] text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Product
        </button>
      </div>

      {/* Product List Table */}
      {loading ? (
        <p className="text-xs text-gray-500 py-8 text-center animate-pulse">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-xs text-gray-500 py-8 text-center">No products found.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b text-gray-600 font-semibold">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Media</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-[#111111]">
                      <div className="flex items-center gap-3">
                        {p.images[0]?.url ? (
                          <img src={p.images[0].url} alt={p.name} className="w-10 h-12 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-10 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            No Img
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-xs text-[#111111]">{p.name}</p>
                          <p className="text-[10px] text-gray-400">Slug: {p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-[#111111]">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-600">{p.category?.name || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stockQuantity <= 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.stockQuantity} in stock
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">
                      {p.images.length} images, {p.videos.length} vids
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleTogglePublish(p.id, p.active ?? true)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          p.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {p.active !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {p.active !== false ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 text-gray-600 hover:text-black rounded-lg border hover:bg-gray-100"
                          title="Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 rounded-lg border hover:bg-red-50"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-semibold text-lg text-[#111111]">
                {editingProduct ? 'Edit Product & Media' : 'Create New Luxury Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Product Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="e.g. Royal Muga Silk Mekhela Sador"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Slug (Auto-generated if empty)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="royal-muga-silk-mekhela-sador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Compare Price (₹)</label>
                  <input
                    type="number"
                    value={form.comparePrice}
                    onChange={(e) => setForm({ ...form, comparePrice: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              {/* Advanced Product Media Manager Component */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border space-y-2">
                <ProductMediaManager
                  media={form.media}
                  onChange={(updatedMedia) => setForm({ ...form, media: updatedMedia })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-1">Product Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Detailed description of the weave, heritage, motif work..."
                />
              </div>

              {/* Colours, Sizes, Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Colours (Comma separated)</label>
                  <input
                    type="text"
                    value={form.coloursText}
                    onChange={(e) => setForm({ ...form, coloursText: e.target.value })}
                    placeholder="Golden, Crimson Red, Royal Blue"
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sizes (Comma separated)</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={form.sizesText}
                      onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
                      placeholder="Free Size, S, M, L, XL"
                      className="w-full p-2.5 border rounded-lg"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.enableSizes}
                        onChange={(e) => setForm({ ...form, enableSizes: e.target.checked })}
                      />
                      <span>Enable Size Selector on Product Page</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Highlights (One per line)</label>
                <textarea
                  rows={3}
                  value={form.highlightsText}
                  onChange={(e) => setForm({ ...form, highlightsText: e.target.value })}
                  placeholder="100% Pure Assam Silk&#10;Hand-woven by Master Artisans&#10;Silk Mark Certified"
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              {/* Specifications & Policies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Fabric & Material</label>
                  <input
                    type="text"
                    value={form.fabric}
                    onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                    placeholder="Authentic Muga Silk / Pat Silk"
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Care Instructions</label>
                  <input
                    type="text"
                    value={form.careInstructions}
                    onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
                    placeholder="Dry clean only"
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Shipping Info</label>
                  <input
                    type="text"
                    value={form.shippingInfo}
                    onChange={(e) => setForm({ ...form, shippingInfo: e.target.value })}
                    placeholder="Free Express Shipping across India (3-5 business days)"
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Return / Exchange Policy</label>
                  <input
                    type="text"
                    value={form.returnPolicy}
                    onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                    placeholder="7-Day Easy Exchange Policy for unused products"
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              {/* Badges & SEO */}
              <div className="flex flex-wrap gap-4 pt-2 border-t">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  <span className="font-semibold">Featured Product</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.newArrival}
                    onChange={(e) => setForm({ ...form, newArrival: e.target.checked })}
                  />
                  <span className="font-semibold">New Arrival</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.bestSeller}
                    onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })}
                  />
                  <span className="font-semibold">Best Seller</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#111111] hover:bg-[#B08D57] text-white rounded-full font-semibold uppercase tracking-wider text-xs transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   3. ORDERS PANEL (Marketplace Workflow)
   ========================================================================= */
function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [timelines, setTimelines] = useState<Record<string, OrderTimeline[]>>({})
  const [timelineLoading, setTimelineLoading] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await supabaseOrderService.getOrders()
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    )
    try {
      await supabaseOrderService.updateOrderStatus(id, newStatus)
      // Refresh timeline if expanded
      if (expandedId === id) {
        loadTimeline(id)
      }
    } catch {
      alert('Failed to update order status.')
      loadOrders() // revert on failure
    }
  }

  const loadTimeline = async (orderId: string) => {
    setTimelineLoading((prev) => ({ ...prev, [orderId]: true }))
    try {
      const entries = await supabaseOrderService.getOrderTimeline(orderId)
      setTimelines((prev) => ({ ...prev, [orderId]: entries }))
    } catch {
      // silently fail
    } finally {
      setTimelineLoading((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      if (!timelines[id]) {
        loadTimeline(id)
      }
    }
  }

  const commissionStatusBadge = (order: Order) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      none:      { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'No Commission' },
      pending:   { bg: 'bg-amber-50',    text: 'text-amber-700',   label: 'Commission Pending' },
      earned:    { bg: 'bg-emerald-50',  text: 'text-emerald-700', label: 'Commission Earned' },
      paid:      { bg: 'bg-blue-50',     text: 'text-blue-700',    label: 'Commission Paid' },
      cancelled: { bg: 'bg-red-50',      text: 'text-red-700',     label: 'Comm. Cancelled' },
      rejected:  { bg: 'bg-rose-50',     text: 'text-rose-700',    label: 'Comm. Rejected' },
    }
    const s = map[order.commissionStatus] ?? map['none']!
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    )
  }

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.productName.toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.orderNumber || '').toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-[#111111] font-semibold text-lg">Customer Orders</h2>
        <span className="text-[11px] text-gray-500">
          {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by product, customer, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 pl-9 border rounded-lg text-xs bg-white focus:outline-none focus:border-[#B08D57]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="p-2.5 border rounded-lg text-xs bg-white min-w-[180px]"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500 py-8 text-center animate-pulse">Loading customer orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-xs text-gray-500 py-8 text-center">No orders found.</p>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden">
              {/* Order Row */}
              <div className="p-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => toggleExpand(o.id)}
                  className="text-gray-400 hover:text-[#111111] transition-colors flex-shrink-0"
                >
                  {expandedId === o.id
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#111111]">{o.productName}</span>
                    <span className="text-gray-400 font-normal">#{o.orderNumber || o.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-500">
                    <span>{o.customerName || 'WhatsApp Customer'}</span>
                    <span>•</span>
                    <span>₹{o.productPrice.toLocaleString('en-IN')}</span>
                    <span>•</span>
                    <span>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {commissionStatusBadge(o)}

                  {/* Status Dropdown */}
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                    className="p-1.5 border rounded-lg text-[11px] bg-white font-semibold focus:outline-none focus:border-[#B08D57] min-w-[140px]"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>

                  <StatusBadge status={o.status} />
                </div>
              </div>

              {/* Expanded Timeline */}
              {expandedId === o.id && (
                <div className="border-t border-black/5 bg-[#FAF9F6] p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[#111111] text-[11px] uppercase tracking-wider mb-3">Order Details</h4>
                      <div className="space-y-1 text-gray-600">
                        {o.selectedColour && <p><span className="font-semibold text-gray-700">Colour:</span> {o.selectedColour}</p>}
                        {o.selectedSize && <p><span className="font-semibold text-gray-700">Size:</span> {o.selectedSize}</p>}
                        <p><span className="font-semibold text-gray-700">Commission:</span> {o.commissionPercentage}% = ₹{o.commissionAmount.toLocaleString('en-IN')}</p>
                        <p><span className="font-semibold text-gray-700">Seller Earnings:</span> ₹{o.sellerEarnings.toLocaleString('en-IN')}</p>
                        <p><span className="font-semibold text-gray-700">Payment:</span> {o.paymentStatus}</p>
                        {o.productUrl && (
                          <p>
                            <a href={o.productUrl} target="_blank" rel="noreferrer" className="text-[#B08D57] hover:underline">
                              View Product Page
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-semibold text-[#111111] text-[11px] uppercase tracking-wider mb-3">
                        <Clock className="w-3 h-3 inline mr-1" />Order Timeline
                      </h4>
                      {timelineLoading[o.id] ? (
                        <p className="text-gray-400 animate-pulse">Loading timeline...</p>
                      ) : !timelines[o.id] || (timelines[o.id]?.length ?? 0) === 0 ? (
                        <p className="text-gray-400">No timeline entries yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {(timelines[o.id] ?? []).map((entry, idx) => (
                            <div key={entry.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-[#B08D57] mt-1 flex-shrink-0" />
                                {idx < (timelines[o.id] ?? []).length - 1 && (
                                  <div className="w-px flex-1 bg-[#B08D57]/20 mt-1" />
                                )}
                              </div>
                              <div className="pb-3">
                                <StatusBadge status={entry.status} />
                                <p className="text-gray-500 mt-1">{formatDate(entry.createdAt)}</p>
                                <p className="text-gray-400">{entry.changedBy}</p>
                                {entry.note && <p className="text-gray-600 italic">{entry.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   4. SELLER PAYOUTS PANEL
   ========================================================================= */
function SellerPayoutsPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<PayoutSummary>({
    pendingAmount: 0,
    totalSellerEarnings: 0,
    totalCommission: 0,
    paidAmount: 0,
    processingAmount: 0,
    pendingCommission: 0,
    earnedCommission: 0,
    cancelledCommission: 0,
    rejectedCommission: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all')
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [list, sum] = await Promise.all([
        supabaseOrderService.getPayouts(),
        supabaseOrderService.getPayoutSummary(),
      ])
      setOrders(list)
      setSummary(sum)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedOrder) return
    try {
      await supabaseOrderService.updatePayoutPaymentStatus(selectedOrder.id, 'paid', {
        paymentMethod,
        referenceNumber,
        notes,
      })
      setPayModalOpen(false)
      setSelectedOrder(null)
      loadData()
    } catch (err) {
      alert('Failed to mark as paid.')
    }
  }

  const handleMarkPending = async (id: string) => {
    try {
      await supabaseOrderService.updatePayoutPaymentStatus(id, 'pending')
      loadData()
    } catch (err) {
      alert('Failed to mark as pending.')
    }
  }

  const handleExportCSV = () => {
    const csv = supabaseOrderService.exportPayoutsCSV(filteredOrders)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seller-payouts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filterStatus === 'all' || order.paymentStatus === filterStatus
    const query = search.toLowerCase()
    const matchesSearch =
      !query ||
      order.productName.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query) ||
      (order.referenceNumber && order.referenceNumber.toLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6 font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-[#111111] font-semibold text-lg">Seller Payout Tracker</h2>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#B08D57] transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pending Payouts</span>
          <p className="text-2xl font-bold text-amber-600">₹{summary.pendingAmount.toLocaleString('en-IN')}</p>
          <span className="text-[9px] text-amber-600">Comm: ₹{summary.pendingCommission.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Paid Amount</span>
          <p className="text-2xl font-bold text-emerald-700">₹{summary.paidAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Earned Commission</span>
          <p className="text-2xl font-bold text-[#B08D57]">₹{summary.earnedCommission.toLocaleString('en-IN')}</p>
          <span className="text-[9px] text-gray-400">Cancelled: ₹{summary.cancelledCommission.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Seller Earnings</span>
          <p className="text-2xl font-bold text-emerald-600">₹{summary.totalSellerEarnings.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by product, order ID, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 pl-9 border rounded-lg text-xs bg-white focus:outline-none focus:border-[#B08D57]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="p-2.5 border rounded-lg text-xs bg-white min-w-[140px]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-xs text-gray-500 py-8 text-center animate-pulse">Loading payout ledger...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-xs text-gray-500 py-8 text-center">No payout records found.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b text-gray-600 font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Product Price</th>
                  <th className="p-3">Commission %</th>
                  <th className="p-3">Commission (₹)</th>
                  <th className="p-3">Seller Earnings (₹)</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Ref Number</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-medium text-[#111111]">{o.productName}</td>
                    <td className="p-3">₹{o.productPrice.toLocaleString('en-IN')}</td>
                    <td className="p-3">{o.commissionPercentage}%</td>
                    <td className="p-3 text-[#B08D57] font-semibold">₹{o.commissionAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-emerald-700 font-semibold">₹{o.sellerEarnings.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.paymentStatus === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{o.paymentMethod || '-'}</td>
                    <td className="p-3 text-gray-500">{o.referenceNumber || '-'}</td>
                    <td className="p-3 text-right">
                      {o.paymentStatus === 'paid' ? (
                        <button
                          onClick={() => handleMarkPending(o.id)}
                          className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold"
                        >
                          Mark Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOrder(o)
                            setPaymentMethod(o.paymentMethod || 'UPI')
                            setReferenceNumber(o.referenceNumber || '')
                            setNotes(o.notes || '')
                            setPayModalOpen(true)
                          }}
                          className="px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-sm text-[#111111]">Confirm Seller Payout</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#FAF9F6] space-y-1">
                <p className="font-semibold text-[#111111]">{selectedOrder.productName}</p>
                <div className="flex justify-between text-gray-600 pt-1">
                  <span>Seller Earnings:</span>
                  <span className="font-bold text-emerald-700">₹{selectedOrder.sellerEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reference Number / UTR</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR192837465029"
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Transaction details or remarks"
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleMarkPaid}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold text-xs transition-colors"
                >
                  Confirm Paid
                </button>
                <button
                  onClick={() => setPayModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   5. MARKETPLACE SETTINGS PANEL
   ========================================================================= */
function MarketplaceSettingsPanel() {
  const [commissionPct, setCommissionPct] = useState<number>(10)
  const [customPct, setCustomPct] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    supabaseOrderService.getCommissionPercentage().then((pct) => {
      setCommissionPct(pct)
    })
  }, [])

  const handleSaveCommission = async (val: number) => {
    setSaving(true)
    try {
      await supabaseOrderService.setCommissionPercentage(val)
      setCommissionPct(val)
      setCustomPct('')
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      alert('Failed to update commission percentage.')
    } finally {
      setSaving(false)
    }
  }

  const presets = [5, 8, 10, 12, 15, 20]

  return (
    <div className="max-w-2xl bg-white p-6 md:p-8 rounded-2xl border border-black/5 space-y-6 font-sans text-xs">
      <div>
        <h2 className="text-[#111111] font-semibold text-lg">Marketplace Commission Settings</h2>
        <p className="text-gray-500 font-light mt-1">
          Configure the default marketplace commission percentage. Updated rates apply to all new orders while preserving historical order rates.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Marketplace commission updated to {commissionPct}%!</span>
        </div>
      )}

      <div className="space-y-4">
        <label className="block font-semibold text-sm text-[#111111]">
          Current Active Commission Rate: <span className="text-[#B08D57] font-bold text-base">{commissionPct}%</span>
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {presets.map((pct) => (
            <button
              key={pct}
              type="button"
              disabled={saving}
              onClick={() => handleSaveCommission(pct)}
              className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                commissionPct === pct
                  ? 'border-[#111111] bg-[#111111] text-white shadow-sm scale-105'
                  : 'border-black/15 bg-[#FAF9F6] text-[#111111] hover:border-[#111111]'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Custom Percentage Input */}
        <div className="pt-4 border-t space-y-2">
          <label className="block font-semibold text-gray-700">Set Custom Percentage Rate</label>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="e.g. 7.5"
              value={customPct}
              onChange={(e) => setCustomPct(e.target.value)}
              className="flex-1 p-2.5 border rounded-lg focus:outline-none focus:border-[#B08D57]"
            />
            <button
              type="button"
              disabled={saving || !customPct}
              onClick={() => handleSaveCommission(Number(customPct))}
              className="px-6 py-2.5 bg-[#B08D57] hover:bg-[#111111] text-white rounded-lg font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Save Custom Rate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   6. REVIEWS MODERATION PANEL
   ========================================================================= */
function ReviewsPanel() {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const data = await supabaseReviewService.getAllReviewsForAdmin()
      setReviews(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleApprove = async (id: string, currentApproved: boolean) => {
    try {
      await supabaseReviewService.updateReviewStatus(id, !currentApproved)
      loadReviews()
    } catch (err) {
      alert('Failed to update review status.')
    }
  }

  const handleToggleVerified = async (id: string, currentVerified: boolean) => {
    try {
      await supabaseReviewService.toggleVerifiedPurchase(id, !currentVerified)
      loadReviews()
    } catch (err) {
      alert('Failed to update verified status.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    try {
      await supabaseReviewService.deleteReview(id)
      loadReviews()
    } catch (err) {
      alert('Failed to delete review.')
    }
  }

  return (
    <div className="space-y-6 font-sans text-xs">
      <h2 className="text-[#111111] font-semibold text-lg">Product Reviews Moderation Queue</h2>

      {loading ? (
        <p className="text-xs text-gray-500 py-8 text-center animate-pulse">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-gray-500 py-8 text-center">No submitted reviews found.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl bg-white border border-black/5 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#111111]">{r.customerName}</span>
                    {r.city && <span className="text-gray-400">• {r.city}</span>}
                    <div className="flex gap-1 text-[#B08D57]">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#B08D57]" />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Submitted on {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleApprove(r.id, r.isApproved)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      r.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.isApproved ? 'Approved (Visible)' : 'Pending Approval'}
                  </button>

                  <button
                    onClick={() => handleToggleVerified(r.id, r.isVerifiedPurchase)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      r.isVerifiedPurchase ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.isVerifiedPurchase ? 'Verified Purchase' : 'Mark Verified'}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {r.title && <h4 className="font-semibold text-xs text-[#111111]">{r.title}</h4>}
              <p className="text-gray-600 leading-relaxed font-light">{r.comment}</p>

              {r.photoUrls && r.photoUrls.length > 0 && (
                <div className="flex gap-2 pt-2">
                  {r.photoUrls.map((url, i) => (
                    <img key={i} src={url} alt="Review attachment" className="w-16 h-16 object-cover rounded-lg border" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   7. CATEGORIES PANEL
   ========================================================================= */
function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => setCategories(await supabaseCategoryService.getCategories())

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setEditingCat(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
      }
      if (editingCat) {
        await supabaseCategoryService.updateCategory(editingCat.id, payload)
      } else {
        await supabaseCategoryService.createCategory(payload)
      }
      resetForm()
      load()
    } catch {
      alert('Failed to save category.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete category?')) return
    await supabaseCategoryService.deleteCategory(id)
    load()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs font-sans">
      <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-black/5 space-y-4 shadow-xs">
        <h3 className="font-semibold text-sm text-[#111111]">
          {editingCat ? 'Edit Category' : 'Add New Category'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold mb-1">Category Name *</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border rounded-lg" rows={3} />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#111111] hover:bg-[#B08D57] text-white rounded-full font-semibold uppercase tracking-wider transition-colors">
            {editingCat ? 'Update Category' : 'Save Category'}
          </button>
        </form>
      </div>

      <div className="md:col-span-7 space-y-3">
        <h3 className="font-semibold text-sm text-[#111111]">Existing Categories ({categories.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-white border border-black/5 space-y-2">
              <h4 className="font-bold text-sm text-[#111111]">{c.name}</h4>
              <p className="text-gray-500">Slug: {c.slug}</p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setEditingCat(c); setName(c.name); setSlug(c.slug); setDescription(c.description || '') }} className="text-blue-600 hover:underline font-semibold">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   8. COLLECTIONS PANEL
   ========================================================================= */
function CollectionsPanel() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => setCollections(await supabaseCollectionService.listCollections())

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setEditingCollection(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
      }
      if (editingCollection) {
        await supabaseCollectionService.updateCollection(editingCollection.id, payload)
      } else {
        await supabaseCollectionService.createCollection(payload)
      }
      resetForm()
      load()
    } catch {
      alert('Failed to save collection.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete collection?')) return
    await supabaseCollectionService.deleteCollection(id)
    load()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs font-sans">
      <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-black/5 space-y-4 shadow-xs">
        <h3 className="font-semibold text-sm text-[#111111]">
          {editingCollection ? 'Edit Collection' : 'Add New Collection'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold mb-1">Collection Name *</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border rounded-lg" rows={3} />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#111111] hover:bg-[#B08D57] text-white rounded-full font-semibold uppercase tracking-wider transition-colors">
            {editingCollection ? 'Update Collection' : 'Save Collection'}
          </button>
        </form>
      </div>

      <div className="md:col-span-7 space-y-3">
        <h3 className="font-semibold text-sm text-[#111111]">Existing Collections ({collections.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col) => (
            <div key={col.id} className="p-4 rounded-xl bg-white border border-black/5 space-y-2">
              <h4 className="font-bold text-sm text-[#111111]">{col.name}</h4>
              <p className="text-gray-500">Slug: {col.slug}</p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setEditingCollection(col); setName(col.name); setSlug(col.slug); setDescription(col.description || '') }} className="text-blue-600 hover:underline font-semibold">Edit</button>
                <button onClick={() => handleDelete(col.id)} className="text-red-500 hover:underline font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
