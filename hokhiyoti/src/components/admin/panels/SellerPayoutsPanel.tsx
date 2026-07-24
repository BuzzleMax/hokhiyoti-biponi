import { useState, useEffect } from 'react'
import { supabaseOrderService } from '../../../services/supabase/order.service'
import type { Order, PayoutSummary, PaymentStatus } from '../../../types/order.types'
import { Download, Search, XCircle } from 'lucide-react'

export default function SellerPayoutsPanel() {
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
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all')
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])
  const ADMIN_PAGE_SIZE = 50

  useEffect(() => {
    loadData(true)
  }, [filterStatus])

  const loadData = async (isInitial = true) => {
    if (loading && !isInitial) return
    setLoading(true)
    setError(null)
    const activeCursor = isInitial ? null : cursors[cursors.length - 1]
    try {
      const [list, sum] = await Promise.all([
        supabaseOrderService.getPayouts(
          ADMIN_PAGE_SIZE,
          activeCursor,
          filterStatus !== 'all' ? filterStatus : undefined
        ),
        isInitial ? supabaseOrderService.getPayoutSummary() : Promise.resolve(summary),
      ])

      if (isInitial) {
        setOrders(list)
        setSummary(sum)
        const last = list.at(-1)
        setCursors([null, last ? { createdAt: last.createdAt, id: last.id } : null])
      } else {
        setOrders((prev) => {
          const prevIds = new Set(prev.map((o) => o.id))
          return [...prev, ...list.filter((o) => !prevIds.has(o.id))]
        })
        const last = list.at(-1)
        if (last) {
          setCursors((prev) => [...prev, { createdAt: last.createdAt, id: last.id }])
        }
      }
      setHasMore(list.length >= ADMIN_PAGE_SIZE)
    } catch (err) {
      console.error(err)
      setError('Failed to load payout data.')
      if (isInitial) setOrders([])
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

  const handleExportCSV = async () => {
    const allOrders = await supabaseOrderService.getAllPayoutsForExport()
    const csv = supabaseOrderService.exportPayoutsCSV(
      allOrders.filter((order) => {
        const matchesFilter = filterStatus === 'all' || order.paymentStatus === filterStatus
        const query = search.toLowerCase()
        const matchesSearch =
          !query ||
          order.productName.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query) ||
          (order.referenceNumber && order.referenceNumber.toLowerCase().includes(query))
        return matchesFilter && matchesSearch
      })
    )
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

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6 font-sans py-8 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-red-600 font-sans">{error}</p>
        <button
          onClick={() => loadData(true)}
          className="px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase bg-[#111111] hover:bg-[#B08D57] rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

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
          onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'all')}
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
      {filteredOrders.length === 0 ? (
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

      {hasMore && filteredOrders.length > 0 && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => loadData(false)}
            className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-[#B08D57] text-white text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Load More Payouts
          </button>
        </div>
      )}
    </div>
  )
}
