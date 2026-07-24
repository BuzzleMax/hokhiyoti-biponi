import { useState, useEffect } from 'react'
import { supabaseCategoryService } from '../../../services/supabase/category.service'
import type { Category } from '../../../types/category.types'

export default function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const cats = await supabaseCategoryService.getCategories()
      setCategories(cats)
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

  if (loading && categories.length === 0) {
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
