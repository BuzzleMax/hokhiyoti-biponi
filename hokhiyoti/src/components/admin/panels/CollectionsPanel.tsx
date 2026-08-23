import { useState, useEffect } from 'react'
import { Image, Upload, Star, Loader2 } from 'lucide-react'
import { supabaseCollectionService } from '../../../services/supabase/collection.service'
import type { Collection } from '../../../types/collection.types'

export default function CollectionsPanel() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [featured, setFeatured] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const cols = await supabaseCollectionService.listCollections(true)
      setCollections(cols)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setFeatured(false)
    setImageUrl('')
    setEditingCollection(null)
  }

  const handleEdit = (col: Collection) => {
    setEditingCollection(col)
    setName(col.name)
    setSlug(col.slug)
    setDescription(col.description || '')
    setFeatured(Boolean(col.featured))
    setImageUrl(col.imageUrl || '')
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const url = await supabaseCollectionService.uploadCollectionCoverImage(file)
      setImageUrl(url)
    } catch (err) {
      console.error('Failed to upload cover image:', err)
      alert('Failed to upload cover image. Please try again.')
    } finally {
      setUploadingCover(false)
      // reset file input
      e.target.value = ''
    }
  }

  const handleRemoveCover = () => {
    setImageUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        slug: (slug.trim() || name.trim()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: description.trim(),
        featured: featured,
        imageUrl: imageUrl.trim() || undefined,
      }

      if (editingCollection) {
        await supabaseCollectionService.updateCollection(editingCollection.id, payload)
      } else {
        await supabaseCollectionService.createCollection(payload)
      }
      resetForm()
      await load()
    } catch (err) {
      console.error(err)
      alert('Failed to save collection.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection? Products linked to it will remain accessible.')) return
    try {
      await supabaseCollectionService.deleteCollection(id)
      await load()
    } catch (err) {
      console.error(err)
      alert('Failed to delete collection.')
    }
  }

  if (loading && collections.length === 0) {
    return (
      <div className="space-y-6 font-sans py-8 animate-pulse text-xs">
        <div className="h-6 bg-gray-200 rounded-md w-48" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 h-64 bg-gray-200 rounded-2xl" />
          <div className="md:col-span-7 h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs font-sans">
      {/* Form section */}
      <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-black/5 space-y-4 shadow-xs self-start">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[#111111]">
            {editingCollection ? 'Edit Collection' : 'Add New Collection'}
          </h3>
          {editingCollection && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[10px] text-gray-500 hover:text-black underline font-medium"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1 text-[#111111]">Collection Name *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium Silk"
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B08D57]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#111111]">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. premium-silk"
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B08D57]"
            />
            <p className="text-[10px] text-gray-400 mt-1">Used in URL route `/collection/your-slug`</p>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#111111]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Collection story or details..."
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B08D57]"
              rows={3}
            />
          </div>

          {/* Featured Collection Toggle */}
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${featured ? 'text-[#B08D57] fill-[#B08D57]' : 'text-gray-400'}`} />
              <div>
                <label htmlFor="featured-toggle" className="font-semibold text-xs text-[#111111] cursor-pointer">
                  Featured Collection
                </label>
                <p className="text-[10px] text-gray-500">Show this collection in Homepage Featured Section</p>
              </div>
            </div>
            <input
              id="featured-toggle"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#B08D57] rounded cursor-pointer"
            />
          </div>

          {/* Collection Cover Image */}
          <div>
            <label className="block font-semibold mb-1 text-[#111111]">Collection Cover Image</label>
            {imageUrl ? (
              <div className="relative group aspect-[16/9] w-full rounded-xl overflow-hidden border border-black/10 bg-[#FAF9F6]">
                <img src={imageUrl} alt="Collection Cover Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-white text-black text-[11px] font-semibold rounded-md cursor-pointer hover:bg-[#FAF9F6]">
                    Replace
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="px-3 py-1.5 bg-red-600 text-white text-[11px] font-semibold rounded-md hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#B08D57] bg-[#FAF9F6]/50 transition-colors">
                {uploadingCover ? (
                  <div className="flex items-center gap-2 text-gray-500 py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#B08D57]" />
                    <span className="text-xs">Uploading cover...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-500 py-2">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-xs font-medium text-[#111111]">Upload Cover Image</span>
                    <span className="text-[10px] text-gray-400">PNG, JPG, WebP up to 10MB</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} className="hidden" />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || uploadingCover}
            className="w-full py-2.5 bg-[#111111] hover:bg-[#B08D57] disabled:opacity-50 text-white rounded-full font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingCollection ? 'Update Collection' : 'Save Collection'}
          </button>
        </form>
      </div>

      {/* List section */}
      <div className="md:col-span-7 space-y-4">
        <h3 className="font-semibold text-sm text-[#111111]">Existing Collections ({collections.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col) => (
            <div key={col.id} className="p-4 rounded-xl bg-white border border-black/5 space-y-3 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#FAF9F6] border border-black/5">
                  {col.imageUrl ? (
                    <img src={col.imageUrl} alt={col.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                      <Image className="w-6 h-6 opacity-40" />
                      <span className="text-[10px]">No Cover Image</span>
                    </div>
                  )}
                  {col.featured && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#B08D57] text-white text-[9px] font-semibold rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-white" /> Featured
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#111111]">{col.name}</h4>
                  <p className="text-gray-400 text-[10px]">Slug: {col.slug}</p>
                  {col.description && (
                    <p className="text-gray-600 text-[11px] line-clamp-2 mt-1 font-light">{col.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => handleEdit(col)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(col.id)}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
