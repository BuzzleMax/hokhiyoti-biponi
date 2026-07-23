import { useState, useRef } from 'react'
import { Upload, Trash2, ArrowUp, ArrowDown, Star, Film, Image as ImageIcon, CheckSquare, Square, RefreshCw } from 'lucide-react'
import { supabaseProductService } from '../../services/supabase/product.service'

export type ManagedMedia = {
  id?: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  alt?: string
  isCover?: boolean
  sortOrder?: number
}

interface ProductMediaManagerProps {
  media: ManagedMedia[]
  onChange: (updatedMedia: ManagedMedia[]) => void
}

export default function ProductMediaManager({ media, onChange }: ProductMediaManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setUploading(true)
    const newItems: ManagedMedia[] = []

    try {
      for (const file of fileArray) {
        if (file.type.startsWith('image/')) {
          const url = await supabaseProductService.uploadProductImage(file)
          newItems.push({
            type: 'image',
            url,
            alt: file.name,
            isCover: media.length === 0 && newItems.length === 0,
            sortOrder: media.length + newItems.length,
          })
        } else if (file.type.startsWith('video/')) {
          const url = await supabaseProductService.uploadProductVideo(file)
          newItems.push({
            type: 'video',
            url,
            alt: file.name,
            isCover: false,
            sortOrder: media.length + newItems.length,
          })
        }
      }

      onChange([...media, ...newItems])
    } catch (err) {
      console.error('Failed to upload media files:', err)
      alert('Failed to upload media file. Please ensure Supabase storage buckets are configured.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const setCover = (idx: number) => {
    const updated = media.map((item, i) => ({
      ...item,
      isCover: i === idx,
    }))
    onChange(updated)
  }

  const deleteMedia = (idx: number) => {
    const itemToDelete = media[idx]
    const updated = media.filter((_, i) => i !== idx)
    if (itemToDelete?.isCover && updated.length > 0 && updated[0]) {
      updated[0].isCover = true
    }
    setSelectedIndices((prev) => prev.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)))
    onChange(updated)
  }

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= media.length) return

    const updated = [...media]
    const currentItem = updated[idx]
    const targetItem = updated[targetIdx]

    if (currentItem && targetItem) {
      updated[idx] = targetItem
      updated[targetIdx] = currentItem
    }

    updated.forEach((item, i) => {
      item.sortOrder = i
    })
    onChange(updated)
  }

  const toggleSelect = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx))
    } else {
      setSelectedIndices([...selectedIndices, idx])
    }
  }

  const toggleSelectAll = () => {
    if (selectedIndices.length === media.length) {
      setSelectedIndices([])
    } else {
      setSelectedIndices(media.map((_, i) => i))
    }
  }

  const deleteSelected = () => {
    if (selectedIndices.length === 0) return
    if (!confirm(`Delete ${selectedIndices.length} selected media item(s)?`)) return

    const updated = media.filter((_, i) => !selectedIndices.includes(i))
    if (updated.length > 0 && updated[0] && !updated.some((m) => m.isCover)) {
      updated[0].isCover = true
    }
    setSelectedIndices([])
    onChange(updated)
  }

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Header & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[#111111]">Product Media Manager</span>
          <span className="text-[11px] text-gray-500 font-light">
            ({media.length} items: {media.filter((m) => m.type === 'image').length} images, {media.filter((m) => m.type === 'video').length} videos)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {media.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 text-gray-700 hover:bg-gray-50"
            >
              {selectedIndices.length === media.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#B08D57]" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Select All</span>
            </button>
          )}

          {selectedIndices.length > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIndices.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'border-[#B08D57] bg-[#B08D57]/5'
            : 'border-gray-300 hover:border-[#111111] bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center py-2 space-y-2">
            <RefreshCw className="w-6 h-6 text-[#B08D57] animate-spin" />
            <span className="font-semibold text-gray-700">Uploading & Optimizing Media...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-[#B08D57]">
              <ImageIcon className="w-6 h-6" />
              <Film className="w-6 h-6" />
              <Upload className="w-6 h-6 text-[#111111]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#111111]">
                Drag & Drop Images or Videos here, or <span className="text-[#B08D57] underline">Browse</span>
              </p>
              <p className="text-[11px] text-gray-500 font-light mt-0.5">
                Supports JPG, PNG, WEBP, MP4, WEBM. Bulk upload supported.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Media Gallery Items Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
          {media.map((item, idx) => {
            const isSelected = selectedIndices.includes(idx)
            return (
              <div
                key={item.id || idx}
                className={`group relative rounded-xl border overflow-hidden bg-white shadow-xs transition-all ${
                  isSelected
                    ? 'border-[#B08D57] ring-2 ring-[#B08D57]/30'
                    : item.isCover
                    ? 'border-[#111111] ring-1 ring-black/10'
                    : 'border-black/10 hover:border-black/30'
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-[4/5] bg-gray-100 flex items-center justify-center overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.alt || 'Media item'} className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" poster={item.thumbnailUrl} />
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                    {item.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                    <span className="uppercase">{item.type}</span>
                  </div>

                  {/* Cover Image Badge */}
                  {item.isCover && (
                    <div className="absolute bottom-2 left-2 bg-[#B08D57] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-white" /> COVER
                    </div>
                  )}

                  {/* Checkbox Selector */}
                  <button
                    type="button"
                    onClick={() => toggleSelect(idx)}
                    className="absolute top-2 right-2 bg-white/90 p-1 rounded-md text-[#111111] shadow-xs hover:bg-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#B08D57]" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Control Actions Bar */}
                <div className="p-2 bg-white flex items-center justify-between gap-1 border-t border-black/5">
                  {!item.isCover && (
                    <button
                      type="button"
                      onClick={() => setCover(idx)}
                      className="text-[10px] font-semibold text-gray-600 hover:text-[#B08D57] transition-colors"
                      title="Set as Cover Media"
                    >
                      Make Cover
                    </button>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, 'up')}
                      className="p-1 text-gray-500 hover:text-black disabled:opacity-30"
                      title="Move Left/Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === media.length - 1}
                      onClick={() => moveItem(idx, 'down')}
                      className="p-1 text-gray-500 hover:text-black disabled:opacity-30"
                      title="Move Right/Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMedia(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete Media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
