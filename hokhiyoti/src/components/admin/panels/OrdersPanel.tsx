import { useState, useEffect } from 'react'
import { supabaseOrderService } from '../../../services/supabase/order.service'
import type { Order, OrderStatus } from '../../../types/order.types'
import { formatPriceINR } from '../../../lib/utils'
import {
  Search,
  Loader2,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react'

const AUNT_STATUSES: Array<{
  value: 'Confirmed' | 'Paid' | 'Completed' | 'Cancelled'
  label: string
  icon: string
  color: string
  bg: string
}> = [
  { value: 'Confirmed', label: 'Confirmed', icon: '🟢', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
  { value: 'Paid', label: 'Paid', icon: '💰', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200' },
  { value: 'Completed', label: 'Completed', icon: '📦', color: 'text-purple-800', bg: 'bg-purple-50 border-purple-200' },
  { value: 'Cancelled', label: 'Cancelled', icon: '❌', color: 'text-red-800', bg: 'bg-red-50 border-red-200' },
]

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders()
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading orders with filter:', statusFilter, 'search:', search)
      const data = await supabaseOrderService.getOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit: 100,
      })
      console.log('Orders loaded successfully:', data.length)
      setOrders(data)
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, targetStatus: OrderStatus) => {
    setUpdatingId(id)
    try {
      await supabaseOrderService.updateOrderStatus(id, targetStatus)
      const commissionRate = orders.find((o) => o.id === id)?.commissionRate || 10
      const sellingPrice = orders.find((o) => o.id === id)?.sellingPrice || 0
      const isCancelled = targetStatus === 'Cancelled'
      const newCommission = isCancelled ? 0 : Math.round(sellingPrice * (commissionRate / 100))

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status: targetStatus,
                commissionAmount: newCommission,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      )

      setToast({
        message: `Order status updated to ${targetStatus}`,
        type: 'success',
      })
    } catch (err) {
      console.error('Failed to update status:', err)
      setToast({
        message: 'Failed to update order status. Please try again.',
        type: 'error',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#B08D57]" />
            <h2 className="font-heading text-2xl font-medium text-[#111111]">
              Orders Management
            </h2>
          </div>
          <p className="font-sans text-xs text-gray-500 font-light mt-1">
            Track and update WhatsApp customer orders & status
          </p>
        </div>

        {/* Search and Refresh */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 text-xs focus:outline-none focus:border-[#B08D57] bg-[#FAF9F6]"
            />
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="p-2 rounded-xl border border-black/10 hover:border-[#B08D57] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Simple Status Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl font-sans text-xs font-semibold tracking-wider transition-all cursor-pointer border ${
            statusFilter === 'all'
              ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
              : 'bg-white text-gray-600 border-black/10 hover:border-black/30'
          }`}
        >
          All Orders ({orders.length})
        </button>

        {AUNT_STATUSES.map((st) => {
          const isActive = statusFilter === st.value
          const count = orders.filter((o) => o.status === st.value).length
          return (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#B08D57] text-white border-[#B08D57] shadow-xs'
                  : 'bg-white text-gray-700 border-black/10 hover:border-[#B08D57]/40'
              }`}
            >
              <span>{st.icon}</span>
              <span>{st.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#B08D57] animate-spin" />
            <span className="text-xs text-gray-500 font-medium">Loading orders...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-600 text-xs font-semibold mb-2">{error}</p>
            <p className="text-gray-400 text-xs">Check console for details and ensure database policies are correctly configured.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-xs font-light mb-2">No orders found matching the criteria.</p>
            <p className="text-gray-300 text-[10px]">If orders are being created but not showing, run the SQL fix in supabase/fix-orders-policy.sql</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-gray-500 uppercase tracking-wider text-[10px] border-b border-black/5">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Order ID</th>
                  <th className="px-6 py-3.5 font-semibold">Date</th>
                  <th className="px-6 py-3.5 font-semibold">Product</th>
                  <th className="px-6 py-3.5 font-semibold">Amount</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-sans">
                {orders.map((o) => {
                  const isUpdating = updatingId === o.id
                  const isCancelled = o.status === 'Cancelled'

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Order ID */}
                      <td className="px-6 py-4 font-mono font-bold text-[#111111]">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-[#111111] border border-black/5">
                          {o.orderId || o.orderNumber || `HOK-${o.id.slice(0, 4)}`}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Product */}
                      <td className="px-6 py-4 font-medium text-[#111111]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{o.productName}</span>
                          {o.selectedColour && (
                            <span className="text-[10px] text-gray-400">
                              Colour: {o.selectedColour} {o.selectedSize ? `| Size: ${o.selectedSize}` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-bold text-[#111111]">
                        {formatPriceINR(o.sellingPrice || o.productPrice)}
                      </td>

                      {/* Status Selector */}
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                            className={`pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none cursor-pointer transition-colors ${
                              o.status === 'Confirmed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : o.status === 'Paid'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : o.status === 'Completed'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : 'bg-red-50 text-red-800 border-red-300'
                            }`}
                          >
                            <option value="Confirmed">🟢 Confirmed</option>
                            <option value="Paid">💰 Paid</option>
                            <option value="Completed">📦 Completed</option>
                            <option value="Cancelled">❌ Cancelled</option>
                          </select>
                          {isUpdating && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
                          )}
                        </div>
                      </td>

                      {/* Commission */}
                      <td className="px-6 py-4 font-bold">
                        {isCancelled ? (
                          <span className="text-gray-400 line-through">₹0</span>
                        ) : (
                          <span className="text-[#B08D57]">
                            {formatPriceINR(o.commissionAmount)} ({o.commissionRate || 10}%)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
