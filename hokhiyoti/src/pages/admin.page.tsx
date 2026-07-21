import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabaseProductService } from '../services/supabase/product.service'
import type { Product } from '../types/product.types'

export default function AdminPage() {
  const [, setLocation] = useLocation()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    fabric: '',
    stock: '',
    featured: false,
    newArrival: false,
    bestSeller: false,
    imageFile: null as File | null,
  })

  useEffect(() => {
    if (localStorage.getItem('hokhiyoti_admin') !== 'true') {
      setLocation('/admin-login')
      return
    }
    loadProducts()
  }, [setLocation])

  const loadProducts = async () => {
    try {
      const data = await supabaseProductService.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('hokhiyoti_admin')
    setLocation('/')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, imageFile: e.target.files![0] || null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productId = editingProduct?.id || crypto.randomUUID()
      let imageUrl = editingProduct?.images[0]?.url || ''

      // Upload image if provided
      if (formData.imageFile) {
        imageUrl = await supabaseProductService.uploadProductImage(formData.imageFile, productId)
      }

      const productData: Partial<Product> = {
        id: productId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        images: imageUrl ? [{ url: imageUrl, alt: formData.name }] : [],
        category: formData.category ? { id: '', slug: formData.category.toLowerCase(), name: formData.category } : undefined,
        fabric: formData.fabric || undefined,
        stock: parseInt(formData.stock) || 0,
        featured: formData.featured,
        newArrival: formData.newArrival,
        bestSeller: formData.bestSeller,
        sizes: [],
        colors: [],
        rating: 0,
        availability: 'in_stock',
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
      }

      if (editingProduct) {
        await supabaseProductService.updateProduct(editingProduct.id, productData)
      } else {
        await supabaseProductService.createProduct(productData)
      }

      // Reset form and reload products
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        category: '',
        fabric: '',
        stock: '',
        featured: false,
        newArrival: false,
        bestSeller: false,
        imageFile: null,
      })
      setShowForm(false)
      setEditingProduct(null)
      loadProducts()
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product. Please try again.')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      category: product.category?.name || '',
      fabric: product.fabric || '',
      stock: product.stock.toString(),
      featured: product.featured,
      newArrival: product.newArrival,
      bestSeller: product.bestSeller,
      imageFile: null,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await supabaseProductService.deleteProduct(id)
      loadProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      category: '',
      fabric: '',
      stock: '',
      featured: false,
      newArrival: false,
      bestSeller: false,
      imageFile: null,
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-[#111111]">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-[#111111] text-white hover:bg-[#B08D57] transition-colors"
          >
            Logout
          </button>
        </div>

        {!showForm ? (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="mb-8 px-6 py-3 bg-[#B08D57] text-white hover:bg-[#111111] transition-colors"
            >
              + Add New Product
            </button>

            {loading ? (
              <p className="text-[#111111]">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-[#111111]">No products yet. Add your first product!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-200 p-4 rounded-lg">
                    {product.images[0] && (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-48 object-cover mb-4"
                      />
                    )}
                    <h3 className="font-medium text-lg mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">${product.price}</p>
                    <p className="text-xs text-gray-500 mb-4">Stock: {product.stock}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-medium mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fabric</label>
                <input
                  type="text"
                  name="fabric"
                  value={formData.fabric}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                  />
                  <span className="text-sm">Featured</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="newArrival"
                    checked={formData.newArrival}
                    onChange={handleInputChange}
                  />
                  <span className="text-sm">New Arrival</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="bestSeller"
                    checked={formData.bestSeller}
                    onChange={handleInputChange}
                  />
                  <span className="text-sm">Best Seller</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#B08D57] text-white hover:bg-[#111111] transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
