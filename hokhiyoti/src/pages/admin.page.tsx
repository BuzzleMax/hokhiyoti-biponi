import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabaseProductService } from '../services/supabase/product.service'
import { supabaseCategoryService } from '../services/supabase/category.service'
import { supabaseCollectionService } from '../services/supabase/collection.service'
import { supabaseReviewService } from '../services/supabase/review.service'
import { supabaseNewsletterService } from '../services/supabase/newsletter.service'
import { signOut } from '../lib/auth'

import type { Product } from '../types/product.types'
import type { Category } from '../types/category.types'
import type { Collection } from '../types/collection.types'
import type { ProductReview } from '../types/review.types'
import type { NewsletterSubscriber } from '../types/newsletter.types'

import {
  Package,
  Star,
  Mail,
  FolderTree,
  Layers,
  AlertTriangle,
  Eye,
  TrendingUp,
  Download,
  Trash2,
  Plus,
  LogOut,
} from 'lucide-react'

type AdminTab = 'products' | 'reviews' | 'newsletter' | 'categories' | 'collections'

export default function AdminPage() {
  const [, setLocation] = useLocation()
  const [activeTab, setActiveTab] = useState<AdminTab>('products')

  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalProducts: 0,
    featuredProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    pendingReviews: 0,
    newsletterSubscribers: 0,
    mostViewedProduct: 'None',
  })

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const [prods, revs, subs] = await Promise.all([
        supabaseProductService.getProducts(),
        supabaseReviewService.getAllReviewsForAdmin(),
        supabaseNewsletterService.getSubscribers(),
      ])

      const totalProducts = prods.length
      const featuredProducts = prods.filter((p) => p.featured).length
      const outOfStock = prods.filter((p) => p.availabilityStatus === 'out_of_stock').length
      const lowStock = prods.filter((p) => p.availabilityStatus === 'low_stock').length
      const pendingReviews = revs.filter((r) => !r.isApproved).length
      const newsletterSubscribers = subs.length

      const sortedByViews = [...prods].sort((a, b) => b.viewsCount - a.viewsCount)
      const mostViewedProduct = sortedByViews[0]?.name || 'None'

      setStats({
        totalProducts,
        featuredProducts,
        outOfStock,
        lowStock,
        pendingReviews,
        newsletterSubscribers,
        mostViewedProduct,
      })
    } catch (err) {
      console.warn('Could not load dashboard stats:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(0,0,0,0.06)] pb-6">
          <div>
            <h1 className="font-heading text-3xl font-medium text-[#111111]">Admin Management Dashboard</h1>
            <p className="font-sans text-xs text-gray-500 font-light mt-1">
              Hokhiyoti Biponi Luxury Ecommerce System Controls
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

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Total Products</span>
              <Package className="w-4 h-4 text-[#B08D57]" />
            </div>
            <p className="text-2xl font-bold text-[#111111]">{stats.totalProducts}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Featured</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-[#111111]">{stats.featuredProducts}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Out of Stock</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Low Stock</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Pending Reviews</span>
              <Star className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.pendingReviews}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Subscribers</span>
              <Mail className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-[#111111]">{stats.newsletterSubscribers}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-black/5 shadow-xs space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Most Viewed</span>
              <Eye className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xs font-bold text-[#111111] truncate">{stats.mostViewedProduct}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[rgba(0,0,0,0.06)] pb-2">
          {[
            { id: 'products', label: 'Products', icon: Package },
            { id: 'reviews', label: `Reviews (${stats.pendingReviews} Pending)`, icon: Star },
            { id: 'newsletter', label: 'Newsletter Subscribers', icon: Mail },
            { id: 'categories', label: 'Categories', icon: FolderTree },
            { id: 'collections', label: 'Collections', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#B08D57] border-t-2 border-[#B08D57] shadow-xs'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'products' && <ProductsPanel onUpdateStats={loadDashboardStats} />}
        {activeTab === 'reviews' && <ReviewsPanel onUpdateStats={loadDashboardStats} />}
        {activeTab === 'newsletter' && <NewsletterPanel onUpdateStats={loadDashboardStats} />}
        {activeTab === 'categories' && <CategoriesPanel />}
        {activeTab === 'collections' && <CollectionsPanel />}
      </div>
    </div>
  )
}

/* =========================================================================
   1. PRODUCTS PANEL
   ========================================================================= */
function ProductsPanel({ onUpdateStats }: { onUpdateStats: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [enableSizes, setEnableSizes] = useState(false)
  const [fabric, setFabric] = useState('')
  const [careInstructions, setCareInstructions] = useState('')
  const [shippingInfo, setShippingInfo] = useState('')
  const [returnPolicy, setReturnPolicy] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [featured, setFeatured] = useState(false)
  const [newArrival, setNewArrival] = useState(false)
  const [bestSeller, setBestSeller] = useState(false)
  const [stockQuantity, setStockQuantity] = useState('10')
  const [lowStockLimit, setLowStockLimit] = useState('3')

  // Dynamic Lists
  const [highlights, setHighlights] = useState<string[]>([''])
  const [colours, setColours] = useState<Array<{ name: string; hexCode: string }>>([{ name: '', hexCode: '#111111' }])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

  const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Custom']

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [prods, cats, cols] = await Promise.all([
        supabaseProductService.getProducts(),
        supabaseCategoryService.listCategories(),
        supabaseCollectionService.listCollections(),
      ])
      setProducts(prods)
      setCategories(cats)
      setCollections(cols)
      onUpdateStats()
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setSlug(product.slug)
    setDescription(product.description)
    setPrice(product.price.toString())
    setComparePrice(product.comparePrice ? product.comparePrice.toString() : '')
    setCategoryId(product.category?.id || '')
    setCollectionId(product.collection?.id || '')
    setEnableSizes(product.enableSizes)
    setFabric(product.fabric || '')
    setCareInstructions(product.careInstructions || '')
    setShippingInfo(product.shippingInfo || '')
    setReturnPolicy(product.returnPolicy || '')
    setAdditionalInfo(product.additionalInfo || '')
    setFeatured(product.featured)
    setNewArrival(product.newArrival)
    setBestSeller(product.bestSeller)
    setStockQuantity(product.stockQuantity.toString())
    setLowStockLimit(product.lowStockLimit.toString())

    setHighlights(product.highlights.length > 0 ? product.highlights : [''])
    setColours(
      product.colours.length > 0
        ? product.colours.map((c) => ({ name: c.name, hexCode: c.hexCode || '#111111' }))
        : [{ name: '', hexCode: '#111111' }]
    )
    setSelectedSizes(product.sizes.map((s) => s.size))
    setExistingImages(product.images.map((i) => i.url))
    setImageFiles([])
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const targetId = editingProduct?.id || crypto.randomUUID()

      const uploadedUrls: string[] = []
      for (const file of imageFiles) {
        const url = await supabaseProductService.uploadProductImage(file, targetId)
        uploadedUrls.push(url)
      }

      const allImageUrls = [...existingImages, ...uploadedUrls]
      const finalImages = allImageUrls.map((url) => ({ url, alt: name }))

      const selectedCategory = categories.find((c) => c.id === categoryId)
      const selectedCollection = collections.find((c) => c.id === collectionId)

      const productPayload: Partial<Product> = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        price: parseFloat(price) || 0,
        comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
        images: finalImages,
        category: selectedCategory ? { id: selectedCategory.id, slug: selectedCategory.slug, name: selectedCategory.name } : undefined,
        collection: selectedCollection ? { id: selectedCollection.id, slug: selectedCollection.slug, name: selectedCollection.name } : undefined,
        enableSizes,
        fabric: fabric || undefined,
        careInstructions: careInstructions || undefined,
        shippingInfo: shippingInfo || undefined,
        returnPolicy: returnPolicy || undefined,
        additionalInfo: additionalInfo || undefined,
        featured,
        newArrival,
        bestSeller,
        stockQuantity: parseInt(stockQuantity) || 10,
        lowStockLimit: parseInt(lowStockLimit) || 3,
        highlights: highlights.filter((h) => h.trim().length > 0),
        colours: colours.filter((c) => c.name.trim().length > 0),
        sizes: selectedSizes.map((s) => ({ size: s, stockQuantity: 5 })),
      }

      if (editingProduct) {
        await supabaseProductService.updateProduct(editingProduct.id, productPayload)
      } else {
        await supabaseProductService.createProduct(productPayload)
      }

      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await supabaseProductService.deleteProduct(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product.')
    }
  }

  const resetForm = () => {
    setName(''); setSlug(''); setDescription(''); setPrice(''); setComparePrice('')
    setCategoryId(''); setCollectionId(''); setEnableSizes(false); setFabric('')
    setCareInstructions(''); setShippingInfo(''); setReturnPolicy(''); setAdditionalInfo('')
    setFeatured(false); setNewArrival(false); setBestSeller(false); setStockQuantity('10'); setLowStockLimit('3')
    setHighlights(['']); setColours([{ name: '', hexCode: '#111111' }]); setSelectedSizes([])
    setExistingImages([]); setImageFiles([])
    setShowForm(false); setEditingProduct(null)
  }

  if (loading) return <p className="text-xs text-gray-500 py-8">Loading products catalog...</p>

  return (
    <div className="space-y-6">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-[#111111] font-semibold text-lg">Product Catalog</h2>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B08D57] hover:bg-[#111111] text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-4">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative">
                  {product.images[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                  )}
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/80 text-white uppercase">
                    {product.category?.name || 'Unassigned'}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-lg font-medium text-[#111111]">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-semibold text-[#111111]">₹{product.price}</span>
                    {product.comparePrice && <span className="text-xs text-gray-400 line-through">₹{product.comparePrice}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full ${
                    product.availabilityStatus === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Stock: {product.stockQuantity} ({product.availabilityStatus})
                  </span>
                  {product.enableSizes && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Sizes Enabled</span>}
                  {product.featured && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button onClick={() => handleEdit(product)} className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800">Edit</button>
                  <button onClick={() => handleDelete(product.id)} className="flex-1 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-black/10 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-heading font-medium">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={resetForm} className="text-xs font-semibold text-gray-500 hover:text-black">Cancel</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Product Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold mb-1">URL Slug (Auto-generated if empty)</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Product Description *</label>
              <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border rounded-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold mb-1">Price (₹) *</label>
                <input type="number" required step="1" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Original Price (Compare ₹)</label>
                <input type="number" step="1" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Stock Quantity *</label>
                <input type="number" required value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Low Stock Limit</label>
                <input type="number" value={lowStockLimit} onChange={(e) => setLowStockLimit(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Collection</label>
                <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  <option value="">-- Select Collection --</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm block">Enable Sizes System</span>
                  <span className="text-gray-500 font-light">Turn ON for Blouses; Turn OFF for Sarees / Mekhela Chador.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={enableSizes} onChange={(e) => setEnableSizes(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08D57]"></div>
                </label>
              </div>

              {enableSizes && (
                <div className="pt-2">
                  <label className="block font-semibold mb-2">Available Sizes</label>
                  <div className="flex flex-wrap gap-3">
                    {standardSizes.map((sz) => {
                      const checked = selectedSizes.includes(sz)
                      return (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => {
                            if (checked) setSelectedSizes(selectedSizes.filter((s) => s !== sz))
                            else setSelectedSizes([...selectedSizes, sz])
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold border transition-all ${
                            checked ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border space-y-3">
              <span className="font-bold text-sm block">Available Colours</span>
              {colours.map((c, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Colour Name (e.g. Royal Golden)"
                    value={c.name}
                    onChange={(e) => {
                      const updated = [...colours]
                      if (updated[idx]) {
                        updated[idx].name = e.target.value
                        setColours(updated)
                      }
                    }}
                    className="flex-1 p-2 border rounded-lg bg-white"
                  />
                  <input
                    type="color"
                    value={c.hexCode}
                    onChange={(e) => {
                      const updated = [...colours]
                      if (updated[idx]) {
                        updated[idx].hexCode = e.target.value
                        setColours(updated)
                      }
                    }}
                    className="w-10 h-10 border rounded-lg p-1 bg-white cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setColours(colours.filter((_, i) => i !== idx))}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setColours([...colours, { name: '', hexCode: '#111111' }])}
                className="text-xs font-semibold text-[#B08D57] hover:underline"
              >
                + Add Another Colour
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border space-y-3">
              <span className="font-bold text-sm block">Product Highlights (Bullet Points)</span>
              {highlights.map((h, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="e.g. • Pure Assam Silk"
                    value={h}
                    onChange={(e) => {
                      const updated = [...highlights]
                      updated[idx] = e.target.value
                      setHighlights(updated)
                    }}
                    className="flex-1 p-2 border rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setHighlights(highlights.filter((_, i) => i !== idx))}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setHighlights([...highlights, ''])}
                className="text-xs font-semibold text-[#B08D57] hover:underline"
              >
                + Add Highlight Bullet
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Fabric & Weave Info</label>
                <input type="text" value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="e.g. 100% Handwoven Mulberry Silk" className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Care Instructions</label>
                <input type="text" value={careInstructions} onChange={(e) => setCareInstructions(e.target.value)} placeholder="e.g. Dry clean only in cotton pouch" className="w-full p-2.5 border rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Upload Product Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                className="w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#B08D57] file:text-white"
              />
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4" />
                <span>Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input type="checkbox" checked={newArrival} onChange={(e) => setNewArrival(e.target.checked)} className="w-4 h-4" />
                <span>New Arrival</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input type="checkbox" checked={bestSeller} onChange={(e) => setBestSeller(e.target.checked)} className="w-4 h-4" />
                <span>Best Seller</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 py-3 bg-[#B08D57] hover:bg-[#111111] text-white rounded-full font-semibold transition-colors">
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
              <button type="button" onClick={resetForm} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-semibold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   2. REVIEWS MODERATION PANEL
   ========================================================================= */
function ReviewsPanel({ onUpdateStats }: { onUpdateStats: () => void }) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const data = await supabaseReviewService.getAllReviewsForAdmin()
      setReviews(data)
      onUpdateStats()
    } catch (err) {
      console.warn('Failed to fetch admin reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleApprove = async (id: string, currentStatus: boolean) => {
    try {
      await supabaseReviewService.updateReviewStatus(id, !currentStatus)
      loadReviews()
    } catch (err) {
      alert('Failed to update review status.')
    }
  }

  const handleToggleVerified = async (id: string, currentStatus: boolean) => {
    try {
      await supabaseReviewService.toggleVerifiedPurchase(id, !currentStatus)
      loadReviews()
    } catch (err) {
      alert('Failed to update verified badge.')
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

  if (loading) return <p className="text-xs text-gray-500 py-8">Loading review queue...</p>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[#111111] font-semibold text-lg">Customer Reviews Moderation Queue</h2>
        <span className="text-xs text-gray-500 font-light">{reviews.length} total reviews</span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-xs text-gray-500 py-8">No customer reviews submitted yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[#111111]">{rev.customerName}</span>
                  {rev.city && <span className="text-xs text-gray-400">({rev.city})</span>}
                  <span className="text-xs font-bold text-[#B08D57]">{rev.rating} ★</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleApprove(rev.id, rev.isApproved)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                      rev.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {rev.isApproved ? 'Approved (Live)' : 'Pending Approval'}
                  </button>

                  <button
                    onClick={() => handleToggleVerified(rev.id, rev.isVerifiedPurchase)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      rev.isVerifiedPurchase ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rev.isVerifiedPurchase ? 'Verified Buyer' : 'Mark Verified'}
                  </button>

                  <button onClick={() => handleDelete(rev.id)} className="p-1 text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {rev.title && <h4 className="text-xs font-semibold text-[#111111]">{rev.title}</h4>}
              <p className="text-xs text-gray-600 font-light leading-relaxed">{rev.comment}</p>

              {rev.photoUrl && (
                <div className="w-20 aspect-square rounded-lg overflow-hidden border">
                  <img src={rev.photoUrl} alt="Review attachment" className="w-full h-full object-cover" />
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
   3. NEWSLETTER SUBSCRIBERS PANEL
   ========================================================================= */
function NewsletterPanel({ onUpdateStats }: { onUpdateStats: () => void }) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscribers()
  }, [])

  const loadSubscribers = async () => {
    try {
      const data = await supabaseNewsletterService.getSubscribers()
      setSubscribers(data)
      onUpdateStats()
    } catch (err) {
      console.warn('Failed to load newsletter subscribers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove subscriber?')) return
    try {
      await supabaseNewsletterService.deleteSubscriber(id)
      loadSubscribers()
    } catch (err) {
      alert('Failed to remove subscriber.')
    }
  }

  if (loading) return <p className="text-xs text-gray-500 py-8">Loading subscribers list...</p>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[#111111] font-semibold text-lg">Newsletter Subscribers ({subscribers.length})</h2>
        <button
          onClick={() => supabaseNewsletterService.exportCSV(subscribers)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#B08D57] transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {subscribers.length === 0 ? (
        <p className="text-xs text-gray-500 py-8">No newsletter subscribers yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] border-b text-gray-600 font-semibold">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Subscribed Date</th>
                <th className="p-4">Source</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-[#111111]">{sub.email}</td>
                  <td className="p-4 text-gray-500">{new Date(sub.subscribedAt).toLocaleString()}</td>
                  <td className="p-4 text-gray-500 uppercase">{sub.source || 'website'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(sub.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   4. CATEGORIES PANEL
   ========================================================================= */
function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => setCategories(await supabaseCategoryService.listCategories())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await supabaseCategoryService.createCategory({ name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), description })
      setName(''); setSlug(''); setDescription('')
      load()
    } catch (err) {
      alert('Failed to save category.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete category?')) return
    await supabaseCategoryService.deleteCategory(id)
    load()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-5 bg-white p-6 rounded-2xl border space-y-4 text-xs">
        <h3 className="font-semibold text-sm">Add New Category</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#B08D57] text-white rounded-full font-semibold">Save Category</button>
        </form>
      </div>

      <div className="md:col-span-7 space-y-3">
        <h3 className="font-semibold text-sm">Existing Categories ({categories.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 rounded-xl bg-white border space-y-2 text-xs">
              <h4 className="font-bold text-sm">{cat.name}</h4>
              <p className="text-gray-500">Slug: {cat.slug}</p>
              <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   5. COLLECTIONS PANEL
   ========================================================================= */
function CollectionsPanel() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [featured, setFeatured] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => setCollections(await supabaseCollectionService.listCollections())

  const resetForm = () => {
    setName(''); setSlug(''); setDescription(''); setImageUrl(''); setFeatured(false)
    setEditingCollection(null)
  }

  const handleEdit = (col: Collection) => {
    setEditingCollection(col)
    setName(col.name)
    setSlug(col.slug)
    setDescription(col.description || '')
    setImageUrl(col.imageUrl || '')
    setFeatured(col.featured || false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        imageUrl: imageUrl || undefined,
        featured,
      }
      if (editingCollection) {
        await supabaseCollectionService.updateCollection(editingCollection.id, payload)
      } else {
        await supabaseCollectionService.createCollection(payload)
      }
      resetForm()
      load()
    } catch (err) {
      alert('Failed to save collection.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete collection?')) return
    await supabaseCollectionService.deleteCollection(id)
    load()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-5 bg-[#FFFFFF] p-6 rounded-2xl border space-y-4 text-xs">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">{editingCollection ? 'Edit Collection' : 'Add New Collection'}</h3>
          {editingCollection && (
            <button onClick={resetForm} className="text-[#B08D57] hover:underline text-xs">Cancel Edit</button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Image URL</label>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full p-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08D57]"></div>
            </label>
            <span className="font-semibold">Featured Collection</span>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#B08D57] text-white rounded-full font-semibold hover:bg-[#111111] transition-colors">
            {editingCollection ? 'Update Collection' : 'Save Collection'}
          </button>
        </form>
      </div>

      <div className="md:col-span-7 space-y-3">
        <h3 className="font-semibold text-sm">Existing Collections ({collections.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col) => (
            <div key={col.id} className="p-4 rounded-xl bg-white border space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {col.imageUrl && (
                    <img src={col.imageUrl} alt={col.name} className="w-10 h-10 rounded-lg object-cover border" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">{col.name}</h4>
                    <p className="text-gray-500">Slug: {col.slug}</p>
                  </div>
                </div>
                {col.featured && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Featured</span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => handleEdit(col)} className="text-blue-600 hover:underline font-semibold">Edit</button>
                <button onClick={() => handleDelete(col.id)} className="text-red-500 hover:underline font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
