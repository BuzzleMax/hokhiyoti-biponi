import { useState, useEffect } from 'react'
import { supabaseOrderService } from '../../../services/supabase/order.service'
import type { Order, OrderStatus, CommissionStatus, OrderTimeline } from '../../../types/order.types'
import { getWhatsAppProductUrl } from '../../../lib/utils'
import {
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  CheckCheck,
  Ban,
  Package,
  Truck,
  Clock,
  Check,
  Archive,
  RotateCcw,
  Trash2
} from 'lucide-react'

const ORDER_STATUSES: Array<{ value: OrderStatus; label: string; color: string; bg: string }> = [
  { value: 'lead_created',       label: 'Lead Created',       color: 'text-gray-600',   bg: 'bg-gray-100' },
  { value: 'customer_contacted', label: 'Customer Contacted', color: 'text-blue-700',   bg: 'bg-blue-50' },
  { value: 'confirmed',          label: 'Confirmed',          color: 'text-amber-800',  bg: 'bg-amber-50' },
  { value: 'packed',             label: 'Packed',             color: 'text-orange-700', bg: 'bg-orange-50' },
  { value: 'shipped',            label: 'Shipped',            color: 'text-indigo-700', bg: 'bg-indigo-50' },
  { value: 'delivered',          label: 'Delivered',          color: 'text-emerald-700',bg: 'bg-emerald-50' },
  { value: 'cancelled',          label: 'Cancelled',          color: 'text-red-700',    bg: 'bg-red-50' },
  { value: 'rejected',           label: 'Rejected',           color: 'text-rose-700',   bg: 'bg-rose-50' },
  { value: 'archived',           label: 'Archived',           color: 'text-purple-700', bg: 'bg-purple-50' },
]

function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Completed
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-red-100 text-red-800 border border-red-200 shadow-xs">
        <XCircle className="w-3.5 h-3.5 text-red-600" /> Cancelled
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200 shadow-xs">
        <Ban className="w-3.5 h-3.5 text-rose-600" /> Rejected
      </span>
    )
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200 shadow-xs">
        <Archive className="w-3.5 h-3.5 text-purple-600" /> Archived
      </span>
    )
  }

  const s = ORDER_STATUSES.find((x) => x.value === status)
  if (!s) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{status}</span>
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  )
}

function getWorkflowStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'lead_created':
    case 'customer_contacted':
    case 'pending':
      return 1
    case 'confirmed':
    case 'processing':
      return 2
    case 'packed':
      return 3
    case 'shipped':
      return 4
    case 'delivered':
      return 5
    default:
      return 0
  }
}

function getElapsedTimeLabel(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 24) return `${diffHours} Hours`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return '24 Hours'
  return `${diffDays} Days`
}

function OrderWorkflowStepper({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'rejected' || status === 'archived') return null

  const currentStep = getWorkflowStepIndex(status)
  const steps = [
    { num: 1, label: 'Lead Created' },
    { num: 2, label: 'Confirmed' },
    { num: 3, label: 'Packed' },
    { num: 4, label: 'Shipped' },
    { num: 5, label: 'Delivered' },
  ]

  return (
    <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-gray-500 bg-[#FAF9F6] px-3 py-1.5 rounded-xl border border-black/5">
      {steps.map((step, idx) => {
        const isDone = currentStep > step.num
        const isCurrent = currentStep === step.num
        return (
          <div key={step.num} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
                isCurrent
                  ? 'bg-[#B08D57] text-white font-bold shadow-xs'
                  : isDone
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'bg-gray-200/60 text-gray-400 font-normal'
              }`}
            >
              {isDone ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <span className="text-[9px] font-bold">{step.num}</span>
              )}
              <span>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <span className={`w-2.5 h-0.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingTarget, setSavingTarget] = useState<{ id: string; targetStatus: OrderStatus } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [timelines, setTimelines] = useState<Record<string, OrderTimeline[]>>({})
  const [timelineLoading, setTimelineLoading] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'followup'>('active')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])

  const ADMIN_PAGE_SIZE = 50

  useEffect(() => {
    loadOrders(true)
  }, [activeTab])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab) loadOrders(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadOrders = async (isInitial = true) => {
    if (loading && !isInitial) return
    setLoading(true)
    setError(null)
    if (isInitial) setSelectedIds([])
    const activeCursor = isInitial ? null : cursors[cursors.length - 1]
    try {
      const data = await supabaseOrderService.getOrders({
        tab: activeTab,
        limit: ADMIN_PAGE_SIZE,
        cursor: activeCursor,
        status: activeTab === 'active' && statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      })

      if (isInitial) {
        setOrders(data)
        const last = data.at(-1)
        setCursors([null, last ? { createdAt: last.createdAt, id: last.id } : null])
      } else {
        setOrders((prev) => {
          const prevIds = new Set(prev.map((o) => o.id))
          return [...prev, ...data.filter((o) => !prevIds.has(o.id))]
        })
        const last = data.at(-1)
        if (last) {
          setCursors((prev) => [...prev, { createdAt: last.createdAt, id: last.id }])
        }
      }
      setHasMore(data.length >= ADMIN_PAGE_SIZE)
    } catch (err) {
      console.error(err)
      setError('Failed to load orders.')
      if (isInitial) setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, targetStatus: OrderStatus) => {
    setSavingTarget({ id, targetStatus })
    try {
      await supabaseOrderService.updateOrderStatus(id, targetStatus)

      let commissionStatus: CommissionStatus = 'none'
      if (['confirmed', 'packed', 'shipped'].includes(targetStatus)) commissionStatus = 'pending'
      else if (targetStatus === 'delivered') commissionStatus = 'earned'
      else if (targetStatus === 'cancelled') commissionStatus = 'cancelled'
      else if (targetStatus === 'rejected') commissionStatus = 'rejected'

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status: targetStatus,
                commissionStatus,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      )

      if (expandedId === id) {
        loadTimeline(id)
      }

      const orderObj = orders.find((o) => o.id === id)
      const orderNum = orderObj?.orderNumber || id.slice(0, 8)
      const statusLabel = ORDER_STATUSES.find((s) => s.value === targetStatus)?.label || targetStatus

      setToast({
        message: `Order #${orderNum} status updated to ${statusLabel}`,
        type: 'success',
      })
      const isArchivedStatus = (targetStatus as string) === 'archived'
      if (isArchivedStatus || activeTab === 'followup' || (activeTab === 'active' && isArchivedStatus)) {
        setOrders((prev) => prev.filter((o) => o.id !== id))
      }
    } catch (err) {
      console.error(err)
      setToast({
        message: 'Failed to update order status. Please try again.',
        type: 'error',
      })
      loadOrders()
    } finally {
      setSavingTarget(null)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await supabaseOrderService.archiveOrder(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setToast({ message: 'Order archived successfully', type: 'success' })
    } catch (err) {
      alert('Failed to archive order.')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await supabaseOrderService.restoreOrder(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setToast({ message: 'Order restored successfully', type: 'success' })
    } catch (err) {
      alert('Failed to restore order.')
    }
  }

  const handleDeletePermanent = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this order? This cannot be undone.')) return
    try {
      await supabaseOrderService.deleteOrderPermanent(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setToast({ message: 'Order permanently deleted', type: 'success' })
    } catch (err) {
      alert('Failed to delete order.')
    }
  }

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return
    try {
      await supabaseOrderService.bulkArchiveOrders(selectedIds)
      setOrders((prev) => prev.filter((o) => !selectedIds.includes(o.id)))
      setSelectedIds([])
      setToast({ message: 'Selected orders archived', type: 'success' })
    } catch (err) {
      alert('Failed to archive orders.')
    }
  }

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return
    try {
      await supabaseOrderService.bulkRestoreOrders(selectedIds)
      setOrders((prev) => prev.filter((o) => !selectedIds.includes(o.id)))
      setSelectedIds([])
      setToast({ message: 'Selected orders restored', type: 'success' })
    } catch (err) {
      alert('Failed to restore orders.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} orders? This action is irreversible.`)) return
    try {
      await supabaseOrderService.bulkDeleteOrdersPermanent(selectedIds)
      setOrders((prev) => prev.filter((o) => !selectedIds.includes(o.id)))
      setSelectedIds([])
      setToast({ message: 'Selected orders permanently deleted', type: 'success' })
    } catch (err) {
      alert('Failed to delete orders.')
    }
  }

  const toggleSelectOrder = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id))
    }
  }

  const loadTimeline = async (orderId: string) => {
    setTimelineLoading((prev) => ({ ...prev, [orderId]: true }))
    try {
      const entries = await supabaseOrderService.getOrderTimeline(orderId)
      setTimelines((prev) => ({ ...prev, [orderId]: entries }))
    } catch {
      // silently fail
    } finally {
      setTimelineLoading((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      if (!timelines[id]) {
        loadTimeline(id)
      }
    }
  }

  const commissionStatusBadge = (order: Order) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      none:      { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'No Commission' },
      pending:   { bg: 'bg-amber-50',    text: 'text-amber-700',   label: 'Commission Pending' },
      earned:    { bg: 'bg-emerald-50',  text: 'text-emerald-700', label: 'Commission Earned' },
      paid:      { bg: 'bg-blue-50',     text: 'text-blue-700',    label: 'Commission Paid' },
      cancelled: { bg: 'bg-red-50',      text: 'text-red-700',     label: 'Comm. Cancelled' },
      rejected:  { bg: 'bg-rose-50',     text: 'text-rose-700',    label: 'Comm. Rejected' },
    }
    const s = map[order.commissionStatus] ?? map['none']!
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    )
  }

  const renderWorkflowActions = (o: Order) => {
    const isSavingThisOrder = savingTarget?.id === o.id

    if (o.status === 'archived') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRestore(o.id)}
            className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore
          </button>
          <button
            onClick={() => handleDeletePermanent(o.id)}
            className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )
    }

    switch (o.status) {
      case 'lead_created':
      case 'customer_contacted':
      case 'pending':
        return (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleStatusChange(o.id, 'confirmed')}
              disabled={isSavingThisOrder}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingThisOrder && savingTarget?.targetStatus === 'confirmed' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span>Confirm Order</span>
            </button>
            <button
              onClick={() => handleStatusChange(o.id, 'cancelled')}
              disabled={isSavingThisOrder}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingThisOrder && savingTarget?.targetStatus === 'cancelled' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span>Cancel Order</span>
            </button>
            <button
              onClick={() => handleStatusChange(o.id, 'rejected')}
              disabled={isSavingThisOrder}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingThisOrder && savingTarget?.targetStatus === 'rejected' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              <span>Reject Order</span>
            </button>
            <button
              onClick={() => handleArchive(o.id)}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        )

      case 'confirmed':
      case 'processing':
        return (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleStatusChange(o.id, 'packed')}
              disabled={isSavingThisOrder}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingThisOrder && savingTarget?.targetStatus === 'packed' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Package className="w-3.5 h-3.5" />
              )}
              <span>Mark Packed</span>
            </button>
            <button
              onClick={() => handleStatusChange(o.id, 'cancelled')}
              disabled={isSavingThisOrder}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingThisOrder && savingTarget?.targetStatus === 'cancelled' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span>Cancel Order</span>
            </button>
            <button
              onClick={() => handleArchive(o.id)}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        )

      case 'packed':
        return (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleStatusChange(o.id, 'shipped')}
              disabled={isSavingThisOrder}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingThisOrder && savingTarget?.targetStatus === 'shipped' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              <span>Mark Shipped</span>
            </button>
            <button
              onClick={() => handleArchive(o.id)}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        )

      case 'shipped':
        return (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleStatusChange(o.id, 'delivered')}
              disabled={isSavingThisOrder}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingThisOrder && savingTarget?.targetStatus === 'delivered' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              <span>Mark Delivered</span>
            </button>
            <button
              onClick={() => handleArchive(o.id)}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        )

      default:
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={o.status} />
            <button
              onClick={() => handleArchive(o.id)}
              className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        )
    }
  }

  const filteredOrders = orders

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6 font-sans py-8 animate-pulse text-xs">
        <div className="h-10 bg-gray-200 rounded-lg w-full max-w-md" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans text-xs relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#111111] text-white shadow-2xl border border-white/10 animate-fade-in z-[60]">
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/5 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-2 px-1 font-semibold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'active'
              ? 'border-[#B08D57] text-[#B08D57]'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Active Orders ({activeTab === 'active' ? orders.length : ''})
        </button>
        <button
          onClick={() => setActiveTab('followup')}
          className={`pb-2 px-1 font-semibold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'followup'
              ? 'border-[#B08D57] text-[#B08D57]'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Follow-Up Leads ({activeTab === 'followup' ? orders.length : ''})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-2 px-1 font-semibold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'archived'
              ? 'border-[#B08D57] text-[#B08D57]'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Archived Orders ({activeTab === 'archived' ? orders.length : ''})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[#111111] font-semibold text-lg font-heading">
            {activeTab === 'active' && 'Customer Orders & Workflow'}
            {activeTab === 'followup' && 'WhatsApp Follow-Up System'}
            {activeTab === 'archived' && 'Archived Orders Vault'}
          </h2>
          <p className="text-gray-500 text-[11px] mt-0.5">
            {activeTab === 'active' && 'Manage active order progression step-by-step with automatic commission & timeline sync.'}
            {activeTab === 'followup' && 'Displaying leads stuck in "Lead Created" for more than 24 hours. Message or process them here.'}
            {activeTab === 'archived' && 'Review archived leads and past transactions. Excluded from active sales metrics.'}
          </p>
        </div>
        <span className="text-[11px] text-gray-500 font-medium">
          {filteredOrders.length} matching orders
        </span>
      </div>

      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && activeTab !== 'followup' && (
        <div className="p-3 bg-[#111111] text-white rounded-xl flex items-center justify-between gap-4 animate-fade-in">
          <span className="font-semibold text-xs">{selectedIds.length} orders selected</span>
          <div className="flex items-center gap-2">
            {activeTab === 'active' ? (
              <button
                onClick={handleBulkArchive}
                className="px-3.5 py-1.5 bg-[#FAF9F6] text-[#111111] hover:bg-[#B08D57] hover:text-white rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" /> Archive Selected
              </button>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-3.5 py-1.5 bg-[#FAF9F6] text-[#111111] hover:bg-[#B08D57] hover:text-white rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white transition-colors pl-2 ml-2 border-l border-white/10"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters (only for non-followup tabs) */}
      {activeTab !== 'followup' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by product, customer, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2.5 pl-9 border rounded-lg text-xs bg-white focus:outline-none focus:border-[#B08D57]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
          {activeTab === 'active' && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | 'all')
                setTimeout(() => loadOrders(true), 0)
              }}
              className="p-2.5 border rounded-lg text-xs bg-white min-w-[180px]"
            >
              <option value="all">All Statuses</option>
              {ORDER_STATUSES.filter(s => s.value !== 'archived').map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center text-sm font-sans text-gray-500 bg-white border rounded-2xl">
          {error ? (
            <div className="space-y-3">
              <p className="text-red-600 font-semibold">{error}</p>
              <button onClick={() => loadOrders(true)} className="px-4 py-1.5 bg-[#111111] text-white hover:bg-[#B08D57] rounded-full">Retry</button>
            </div>
          ) : (
            `No ${activeTab === 'active' ? '' : activeTab === 'followup' ? 'follow-up ' : 'archived '}orders found.`
          )}
        </div>
      ) : activeTab === 'followup' ? (
        /* WhatsApp Follow-up Section Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 space-y-4 hover:border-black/10 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-[#111111]">{o.productName}</h4>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Customer: <span className="font-medium text-[#111111]">{o.customerName || 'WhatsApp Customer'}</span>
                    </p>
                    <p className="text-gray-400 text-[10px]">{o.customerPhone || 'No phone number'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 flex-shrink-0">
                    {getElapsedTimeLabel(o.createdAt)} Ago
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-[11px] pt-1">
                  <span>Price: <span className="font-medium text-[#111111]">₹{o.productPrice.toLocaleString('en-IN')}</span></span>
                  <span>•</span>
                  <span>Colour: <span className="font-medium text-[#111111]">{o.selectedColour || 'Default'}</span></span>
                  <span>•</span>
                  <span>Size: <span className="font-medium text-[#111111]">{o.selectedSize || 'Default'}</span></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-black/5 pt-3">
                <a
                  href={getWhatsAppProductUrl({
                    productName: o.productName,
                    price: o.productPrice,
                    selectedColour: o.selectedColour,
                    selectedSize: o.selectedSize,
                    enableSizes: !!o.selectedSize,
                    productUrl: o.productUrl || '',
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1 transition-all"
                >
                  Open WhatsApp Again
                </a>
                <button
                  onClick={() => handleStatusChange(o.id, 'confirmed')}
                  className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Confirm Order
                </button>
                <button
                  onClick={() => handleStatusChange(o.id, 'customer_contacted')}
                  className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Mark Contacted
                </button>
                <button
                  onClick={() => handleStatusChange(o.id, 'cancelled')}
                  className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange(o.id, 'rejected')}
                  className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  Reject Lead
                </button>
                <button
                  onClick={() => handleArchive(o.id)}
                  className="px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Archive Lead
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Regular Orders Listing */
        <div className="space-y-3">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 px-4 py-1 bg-white/40 rounded-lg">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
              onChange={toggleSelectAll}
              className="rounded text-[#B08D57] focus:ring-[#B08D57] cursor-pointer"
            />
            <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Select All Page Orders</span>
          </div>

          {filteredOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden transition-all hover:border-black/10 flex flex-col">
              {/* Order Row */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-[220px] flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(o.id)}
                    onChange={() => toggleSelectOrder(o.id)}
                    className="rounded text-[#B08D57] focus:ring-[#B08D57] cursor-pointer flex-shrink-0"
                  />
                  <button
                    onClick={() => toggleExpand(o.id)}
                    className="text-gray-400 hover:text-[#111111] transition-colors flex-shrink-0"
                  >
                    {expandedId === o.id
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />
                    }
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#111111]">{o.productName}</span>
                      <span className="text-gray-400 font-normal">#{o.orderNumber || o.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-500">
                      <span>{o.customerName || 'WhatsApp Customer'}</span>
                      <span>•</span>
                      <span>₹{o.productPrice.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Stepper + Commission Badge */}
                <div className="flex items-center gap-3">
                  <OrderWorkflowStepper status={o.status} />
                  {commissionStatusBadge(o)}
                </div>

                {/* Workflow Actions */}
                <div className="flex items-center gap-2">
                  {renderWorkflowActions(o)}
                </div>
              </div>

              {/* Expanded Timeline */}
              {expandedId === o.id && (
                <div className="border-t border-black/5 bg-[#FAF9F6] p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[#111111] text-[11px] uppercase tracking-wider mb-3">Order Details</h4>
                      <div className="space-y-1 text-gray-600">
                        {o.selectedColour && <p><span className="font-semibold text-gray-700">Colour:</span> {o.selectedColour}</p>}
                        {o.selectedSize && <p><span className="font-semibold text-gray-700">Size:</span> {o.selectedSize}</p>}
                        <p><span className="font-semibold text-gray-700">Commission:</span> {o.commissionPercentage}% = ₹{o.commissionAmount.toLocaleString('en-IN')}</p>
                        <p><span className="font-semibold text-gray-700">Seller Earnings:</span> ₹{o.sellerEarnings.toLocaleString('en-IN')}</p>
                        <p><span className="font-semibold text-gray-700">Payment:</span> {o.paymentStatus}</p>
                        {o.productUrl && (
                          <p>
                            <a href={o.productUrl} target="_blank" rel="noreferrer" className="text-[#B08D57] hover:underline">
                              View Product Page
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-semibold text-[#111111] text-[11px] uppercase tracking-wider mb-3">
                        <Clock className="w-3 h-3 inline mr-1" />Order Timeline
                      </h4>
                      {timelineLoading[o.id] ? (
                        <p className="text-gray-400 animate-pulse">Loading timeline...</p>
                      ) : !timelines[o.id] || (timelines[o.id]?.length ?? 0) === 0 ? (
                        <p className="text-gray-400">No timeline entries yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {(timelines[o.id] ?? []).map((entry, idx) => (
                            <div key={entry.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-[#B08D57] mt-1 flex-shrink-0" />
                                {idx < (timelines[o.id] ?? []).length - 1 && (
                                  <div className="w-px flex-1 bg-[#B08D57]/20 mt-1" />
                                )}
                              </div>
                              <div className="pb-3">
                                <StatusBadge status={entry.status} />
                               <p className="text-gray-500 mt-1">{formatDate(entry.createdAt)}</p>
                                <p className="text-gray-400">{entry.changedBy}</p>
                                {entry.note && <p className="text-gray-600 italic">{entry.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && filteredOrders.length > 0 && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => loadOrders(false)}
            className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-[#B08D57] text-white text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Load More Orders
          </button>
        </div>
      )}

      {loading && orders.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#B08D57]" />
        </div>
      )}
    </div>
  )
}
