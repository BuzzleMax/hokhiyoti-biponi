import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  Loader2,
  Video,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  X,
  Search,
  ShoppingBag,
  Check,
  Save,
} from 'lucide-react'
import { supabaseWatchBuyService } from '../../../services/supabase/watchBuy.service'
import { supabaseProductService } from '../../../services/supabase/product.service'
import type { WatchBuyVideo, WatchBuyFormData } from '../../../types/watchBuy.types'
import type { Product } from '../../../types/product.types'
import { formatPriceINR } from '../../../lib/utils'

// ---------------------------------------------------------------------------
// Small local helper: availability badge text
// ---------------------------------------------------------------------------
function availBadge(product: Product) {
  if (product.outOfStock || product.stockQuantity <= 0) {
    return <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Out of Stock</span>
  }
  return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">In Stock</span>
}

// ---------------------------------------------------------------------------
// Product Search Picker
// ---------------------------------------------------------------------------
interface ProductPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function ProductPicker({ selectedIds, onChange }: ProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    setLoadingProducts(true)
    supabaseProductService
      .getProducts({ includeInactive: true, limit: 200 })
      .then((prods) => {
        setAllProducts(prods)
        setFiltered(prods)
      })
      .catch(console.error)
      .finally(() => setLoadingProducts(false))
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(allProducts)
    } else {
      const q = searchTerm.toLowerCase()
      setFiltered(allProducts.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)))
    }
  }, [searchTerm, allProducts])

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="border border-black/10 rounded-xl overflow-hidden">
      {/* Search Input */}
      <div className="flex items-center gap-2 p-3 border-b border-black/10 bg-[#FAF9F6]">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name or slug…"
          className="flex-1 bg-transparent font-sans text-xs text-[#111111] placeholder-gray-400 outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Product List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-black/5">
        {loadingProducts ? (
          <div className="p-6 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#B08D57] mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center font-sans text-xs text-gray-400">No products found.</div>
        ) : (
          filtered.map((product) => {
            const isSelected = selectedIds.includes(product.id)
            const coverImg = product.images?.[0]?.url || ''

            return (
              <div
                key={product.id}
                onClick={() => toggle(product.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#B08D57]/8 border-l-2 border-[#B08D57]' : 'hover:bg-gray-50 border-l-2 border-transparent'
                }`}
              >
                {/* Checkbox indicator */}
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                  isSelected ? 'bg-[#B08D57] border-[#B08D57]' : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Image */}
                <div className="w-10 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  {coverImg ? (
                    <img src={coverImg} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[8px]">N/A</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs font-semibold text-[#111111] truncate">{product.name}</p>
                  <p className="font-sans text-[10px] text-[#B08D57] font-medium">{formatPriceINR(product.price)}</p>
                  <div className="mt-0.5">{availBadge(product)}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Selection summary */}
      {selectedIds.length > 0 && (
        <div className="p-3 border-t border-black/10 bg-[#B08D57]/5 font-sans text-xs font-semibold text-[#B08D57] flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5" />
          {selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Video Form Modal
// ---------------------------------------------------------------------------
interface VideoFormProps {
  initial?: WatchBuyVideo | null
  onSave: (data: WatchBuyFormData) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function VideoForm({ initial, onSave, onCancel, saving }: VideoFormProps) {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl || '')
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl || '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [displayOrder, setDisplayOrder] = useState(String(initial?.displayOrder ?? 0))
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    (initial?.products || []).map((p) => p.id)
  )

  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingPoster, setUploadingPoster] = useState(false)

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    try {
      const url = await supabaseWatchBuyService.uploadMedia(file, 'video')
      setVideoUrl(url)
    } catch {
      alert('Video upload failed. Please ensure Supabase storage is configured.')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPoster(true)
    try {
      const url = await supabaseWatchBuyService.uploadMedia(file, 'poster')
      setPosterUrl(url)
    } catch {
      alert('Poster upload failed. Please ensure Supabase storage is configured.')
    } finally {
      setUploadingPoster(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !videoUrl.trim()) {
      alert('Title and Video URL are required.')
      return
    }
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      videoUrl: videoUrl.trim(),
      posterUrl: posterUrl.trim() || undefined,
      isActive,
      displayOrder: Number(displayOrder) || 0,
      productIds: selectedProductIds,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-black/10 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#B08D57]/10">
              <Video className="w-5 h-5 text-[#B08D57]" />
            </div>
            <h3 className="font-heading text-xl font-medium text-[#111111]">
              {initial ? 'Edit Watch & Buy Video' : 'Add Watch & Buy Video'}
            </h3>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block font-sans text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider">
              Video Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Mekhela Collection"
              className="w-full px-4 py-2.5 border border-black/15 rounded-lg font-sans text-sm text-[#111111] placeholder-gray-400 outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-sans text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider">
              Short Caption (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description shown below the video title"
              className="w-full px-4 py-2.5 border border-black/15 rounded-lg font-sans text-sm text-[#111111] placeholder-gray-400 outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 transition-colors"
            />
          </div>

          {/* Video URL + Upload */}
          <div>
            <label className="block font-sans text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider">
              Video *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://… or upload a file →"
                className="flex-1 px-4 py-2.5 border border-black/15 rounded-lg font-sans text-sm text-[#111111] placeholder-gray-400 outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#B08D57] text-[#B08D57] hover:bg-[#B08D57] hover:text-white rounded-lg font-sans text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoFileUpload}
              />
            </div>
            {videoUrl && (
              <video src={videoUrl} className="mt-2 w-full max-h-40 rounded-lg object-cover border border-black/10" muted />
            )}
          </div>

          {/* Poster / Thumbnail URL + Upload */}
          <div>
            <label className="block font-sans text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider">
              Poster / Thumbnail Image (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://… or upload a file →"
                className="flex-1 px-4 py-2.5 border border-black/15 rounded-lg font-sans text-sm text-[#111111] placeholder-gray-400 outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                disabled={uploadingPoster}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#B08D57] text-[#B08D57] hover:bg-[#B08D57] hover:text-white rounded-lg font-sans text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {uploadingPoster ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload
              </button>
              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePosterFileUpload}
              />
            </div>
            {posterUrl && (
              <img src={posterUrl} alt="Poster preview" className="mt-2 h-24 rounded-lg object-cover border border-black/10" />
            )}
          </div>

          {/* Active & Order */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-sans text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                min={0}
                className="w-full px-4 py-2.5 border border-black/15 rounded-lg font-sans text-sm text-[#111111] outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 transition-colors"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <label className="block font-sans text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider">
                Active
              </label>
              <div className="flex items-center gap-3 h-[42px]">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${isActive ? 'bg-[#B08D57]' : 'bg-gray-300'}`}
                  aria-label={isActive ? 'Set as inactive' : 'Set as active'}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="font-sans text-xs font-medium text-gray-600">{isActive ? 'Visible on homepage' : 'Hidden'}</span>
              </div>
            </div>
          </div>

          {/* Product Association */}
          <div>
            <label className="block font-sans text-xs font-semibold text-[#111111] mb-2 uppercase tracking-wider">
              Products Seen in This Video
            </label>
            <p className="font-sans text-[11px] text-gray-500 mb-3">
              Select existing products to link. They will appear in the "Products Seen in the video" panel on the storefront. Check/uncheck to add or remove.
            </p>
            <ProductPicker selectedIds={selectedProductIds} onChange={setSelectedProductIds} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-black/10">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-11 rounded-lg border border-black/15 text-gray-600 hover:bg-gray-50 font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingVideo || uploadingPoster}
              className="flex-1 h-11 rounded-lg bg-[#111111] hover:bg-[#B08D57] text-white font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main WatchBuyPanel
// ---------------------------------------------------------------------------
export default function WatchBuyPanel() {
  const [videos, setVideos] = useState<WatchBuyVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<WatchBuyVideo | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await supabaseWatchBuyService.getWatchBuyVideos(false)
      setVideos(data)
    } catch (err) {
      console.error('Failed to load Watch & Buy videos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleOpenCreate = () => {
    setEditingVideo(null)
    setShowForm(true)
  }

  const handleOpenEdit = (video: WatchBuyVideo) => {
    setEditingVideo(video)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingVideo(null)
  }

  const handleSave = async (formData: WatchBuyFormData) => {
    setSaving(true)
    try {
      if (editingVideo) {
        await supabaseWatchBuyService.updateWatchBuyVideo(editingVideo.id, formData)
      } else {
        await supabaseWatchBuyService.createWatchBuyVideo(formData)
      }
      await load()
      handleCloseForm()
    } catch (err) {
      console.error('Error saving Watch & Buy video:', err)
      alert('Failed to save. Please check the console for details.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (video: WatchBuyVideo) => {
    try {
      await supabaseWatchBuyService.toggleActive(video.id, video.isActive)
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, isActive: !v.isActive } : v))
      )
    } catch (err) {
      console.error('Failed to toggle active status:', err)
    }
  }

  const handleDelete = async (video: WatchBuyVideo) => {
    if (!window.confirm(`Delete "${video.title}"? This will not delete any products.`)) return
    try {
      await supabaseWatchBuyService.deleteWatchBuyVideo(video.id)
      setVideos((prev) => prev.filter((v) => v.id !== video.id))
    } catch (err) {
      console.error('Failed to delete Watch & Buy video:', err)
      alert('Delete failed. Please check the console.')
    }
  }

  const handleReorder = async (videoId: string, direction: 'up' | 'down') => {
    const idx = videos.findIndex((v) => v.id === videoId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= videos.length) return

    const reordered: WatchBuyVideo[] = [...videos]
    const tmp = reordered[idx] as WatchBuyVideo
    reordered[idx] = reordered[swapIdx] as WatchBuyVideo
    reordered[swapIdx] = tmp

    // Update display_order in the new positions
    const videoA: WatchBuyVideo = { ...(reordered[idx] as WatchBuyVideo), displayOrder: idx }
    const videoB: WatchBuyVideo = { ...(reordered[swapIdx] as WatchBuyVideo), displayOrder: swapIdx }
    reordered[idx] = videoA
    reordered[swapIdx] = videoB

    setVideos(reordered)

    // Persist reorder to Supabase for each swapped item
    try {
      await Promise.all([
        supabaseWatchBuyService.updateWatchBuyVideo(videoA.id, {
          title: videoA.title,
          description: videoA.description,
          videoUrl: videoA.videoUrl,
          posterUrl: videoA.posterUrl,
          isActive: videoA.isActive,
          displayOrder: videoA.displayOrder,
          productIds: (videoA.products || []).map((p) => p.id),
        }),
        supabaseWatchBuyService.updateWatchBuyVideo(videoB.id, {
          title: videoB.title,
          description: videoB.description,
          videoUrl: videoB.videoUrl,
          posterUrl: videoB.posterUrl,
          isActive: videoB.isActive,
          displayOrder: videoB.displayOrder,
          productIds: (videoB.products || []).map((p) => p.id),
        }),
      ])
    } catch (err) {
      console.error('Reorder save failed:', err)
    }
  }


  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-medium text-[#111111]">Watch &amp; Buy</h2>
            <p className="font-sans text-xs text-gray-500 mt-1">
              Manage fashion reels and their linked products shown on the homepage.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-[#B08D57] text-white font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Video
          </button>
        </div>

        {/* Video List */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#B08D57] mx-auto" />
            <p className="font-sans text-xs text-gray-400 mt-3">Loading videos…</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-black/10 rounded-2xl text-center">
            <Video className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="font-heading text-lg text-gray-400">No Watch &amp; Buy videos yet.</p>
            <p className="font-sans text-xs text-gray-400 mt-1 mb-6">
              Add your first fashion reel to let customers discover and shop directly from videos.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B08D57] text-white font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer hover:bg-[#9a7a48]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Video
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video, idx) => (
              <div
                key={video.id}
                className="bg-white rounded-2xl border border-black/8 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex gap-4 p-4 items-start">
                  {/* Poster / Video Preview */}
                  <div className="flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-gray-100 border border-black/10 relative">
                    {video.posterUrl ? (
                      <img src={video.posterUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#111] to-[#333] flex items-center justify-center">
                        <Video className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                    {/* Active Badge */}
                    <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${video.isActive ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-heading text-base font-medium text-[#111111] truncate">{video.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider ${
                        video.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {video.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {video.description && (
                      <p className="font-sans text-xs text-gray-500 line-clamp-1 mb-2">{video.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-[#B08D57]" />
                        {(video.products || []).length} product{(video.products || []).length !== 1 ? 's' : ''} linked
                      </span>
                      <span>Order: #{video.displayOrder}</span>
                    </div>

                    {/* Linked product preview chips */}
                    {(video.products || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(video.products || []).slice(0, 5).map((p) => (
                          <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 font-sans text-[10px] text-gray-600 font-medium truncate max-w-[120px]">
                            {p.name}
                          </span>
                        ))}
                        {(video.products || []).length > 5 && (
                          <span className="px-2 py-0.5 rounded bg-[#B08D57]/10 text-[#B08D57] font-sans text-[10px] font-semibold">
                            +{(video.products || []).length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    {/* Reorder */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorder(video.id, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#111111] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="Move video up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(video.id, 'down')}
                        disabled={idx === videos.length - 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#111111] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="Move video down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-px h-3 bg-black/10" />

                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(video)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        video.isActive
                          ? 'hover:bg-amber-50 text-amber-600'
                          : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'
                      }`}
                      aria-label={video.isActive ? 'Deactivate video' : 'Activate video'}
                      title={video.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {video.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(video)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                      aria-label="Edit video"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(video)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Delete video"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Form Modal */}
      {showForm && (
        <VideoForm
          initial={editingVideo}
          onSave={handleSave}
          onCancel={handleCloseForm}
          saving={saving}
        />
      )}
    </>
  )
}
