import { useState, useEffect } from 'react'
import { supabaseProductService } from '../../../services/supabase/product.service'
import type { Product } from '../../../types/product.types'
import ProductMediaManager, { type ManagedMedia } from '../ProductMediaManager'
import { Search, Plus, Eye, EyeOff, Copy, Trash2, XCircle } from 'lucide-react'

export default function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])

  const ADMIN_PAGE_SIZE = 50

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
    loadProducts(true)
  }, [])

  const loadProducts = async (isInitial = true) => {
    if (loading && !isInitial) return
    setLoading(true)
    setError(null)
    const activeCursor = isInitial ? null : cursors[cursors.length - 1]
    try {
      const data = await supabaseProductService.getProducts({
        includeInactive: true,
        limit: ADMIN_PAGE_SIZE,
        cursor: activeCursor,
      })

      if (isInitial) {
        setProducts(data)
        const last = data.at(-1)
        setCursors([null, last ? { createdAt: last.createdAt, id: last.id } : null])
      } else {
        setProducts((prev) => {
          const prevIds = new Set(prev.map((p) => p.id))
          return [...prev, ...data.filter((p) => !prevIds.has(p.id))]
        })
        const last = data.at(-1)
        if (last) {
          setCursors((prev) => [...prev, { createdAt: last.createdAt, id: last.id }])
        }
      }
      setHasMore(data.length >= ADMIN_PAGE_SIZE)
    } catch (err) {
      console.error(err)
      setError('Failed to load products.')
      if (isInitial) setProducts([])
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

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6 font-sans py-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-full max-w-md" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (error && products.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-red-600 font-sans">{error}</p>
        <button
          onClick={() => loadProducts(true)}
          className="px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase bg-[#111111] hover:bg-[#B08D57] rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

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
      {filteredProducts.length === 0 ? (
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

      {hasMore && filteredProducts.length > 0 && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => loadProducts(false)}
            className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-[#B08D57] text-white text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Load More Products
          </button>
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
