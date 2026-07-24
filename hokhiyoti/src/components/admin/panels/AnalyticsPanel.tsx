import { useState, useEffect } from 'react'
import { supabaseAnalyticsService } from '../../../services/supabase/analytics.service'
import type { AnalyticsOverview } from '../../../types/analytics.types'
import { ShoppingCart, Percent } from 'lucide-react'

export default function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    setError(null)
    supabaseAnalyticsService.getAnalyticsOverview()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to compute analytics.')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 font-sans animate-pulse py-8">
        <div className="h-6 w-48 bg-gray-200 rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl border border-black/5" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-red-600 font-sans">{error || 'Something went wrong.'}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase bg-[#111111] hover:bg-[#B08D57] rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    )
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
