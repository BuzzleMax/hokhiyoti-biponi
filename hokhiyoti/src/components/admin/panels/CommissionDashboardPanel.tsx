import { useState, useEffect } from 'react'
import { supabaseOrderService } from '../../../services/supabase/order.service'
import type { CommissionPayment, OwnerCommissionSummary } from '../../../types/order.types'
import { formatPriceINR } from '../../../lib/utils'
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  CreditCard,
  PieChart,
} from 'lucide-react'

export default function CommissionDashboardPanel() {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [summary, setSummary] = useState<OwnerCommissionSummary | null>(null)
  const [payments, setPayments] = useState<CommissionPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [sumData, payData] = await Promise.all([
        supabaseOrderService.getCommissionDashboard(selectedYear, selectedMonth),
        supabaseOrderService.getCommissionPayments(),
      ])
      setSummary(sumData)
      setPayments(payData)
    } catch (err) {
      console.error('Failed to load commission dashboard data:', err)
      setToast({ message: 'Error loading dashboard data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(paymentAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setToast({ message: 'Please enter a valid payment amount', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await supabaseOrderService.addCommissionPayment(amountNum, paymentNotes.trim() || undefined)
      setToast({ message: 'Commission payment recorded successfully', type: 'success' })
      setPaymentAmount('')
      setPaymentNotes('')
      setShowAddPaymentModal(false)
      await loadDashboardData()
    } catch (err) {
      console.error('Failed to record payment:', err)
      setToast({ message: 'Failed to record payment', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return
    try {
      await supabaseOrderService.deleteCommissionPayment(id)
      setToast({ message: 'Payment record deleted', type: 'success' })
      await loadDashboardData()
    } catch (err) {
      console.error('Failed to delete payment:', err)
      setToast({ message: 'Failed to delete payment', type: 'error' })
    }
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  const years = [2025, 2026, 2027]

  return (
    <div className="space-y-8 font-sans">
      {/* Toast */}
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

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#B08D57]" />
            <h2 className="font-heading text-2xl font-medium text-[#111111]">
              Owner Commission Dashboard
            </h2>
          </div>
          <p className="font-sans text-xs text-gray-500 font-light mt-1">
            Private Owner Financial Metrics & Monthly Commission Ledger
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FAF9F6] border border-black/10 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#B08D57]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-medium text-[#111111] focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-medium text-[#111111] focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddPaymentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white hover:bg-[#B08D57] font-sans text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#B08D57] animate-spin" />
          <span className="text-xs text-gray-500 font-medium">Calculating owner commission metrics...</span>
        </div>
      ) : summary ? (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Confirmed Sales */}
            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="font-sans text-[11px] uppercase tracking-wider font-semibold">
                  Confirmed Sales
                </span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-heading text-2xl font-bold text-[#111111]">
                {formatPriceINR(summary.confirmedSales)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-light">
                Orders: Confirmed, Paid & Completed
              </p>
            </div>

            {/* Completed Sales */}
            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="font-sans text-[11px] uppercase tracking-wider font-semibold">
                  Completed Sales
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="font-heading text-2xl font-bold text-[#111111]">
                {formatPriceINR(summary.completedSales)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-light">
                Completed orders only
              </p>
            </div>

            {/* Your Commission */}
            <div className="bg-white p-5 rounded-2xl border border-[#B08D57]/30 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-[#B08D57]/5">
              <div className="flex items-center justify-between text-[#B08D57] mb-2">
                <span className="font-sans text-[11px] uppercase tracking-wider font-bold">
                  Your Commission
                </span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="font-heading text-2xl font-bold text-[#B08D57]">
                {formatPriceINR(summary.yourCommission)}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 font-light">
                Calculated from Completed sales
              </p>
            </div>

            {/* Paid to You */}
            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="font-sans text-[11px] uppercase tracking-wider font-semibold">
                  Paid to You
                </span>
                <CreditCard className="w-4 h-4 text-blue-500" />
              </div>
              <div className="font-heading text-2xl font-bold text-blue-700">
                {formatPriceINR(summary.paidToYou)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-light">
                Manually marked as paid
              </p>
            </div>

            {/* Remaining */}
            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="font-sans text-[11px] uppercase tracking-wider font-semibold">
                  Remaining
                </span>
                <PieChart className="w-4 h-4 text-purple-500" />
              </div>
              <div className={`font-heading text-2xl font-bold ${summary.remaining > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {formatPriceINR(summary.remaining)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-light">
                Your Commission − Paid to You
              </p>
            </div>
          </div>

          {/* Definitions Box */}
          <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-black/5 space-y-2 text-xs text-gray-600">
            <h3 className="font-semibold text-[#111111] font-heading text-sm mb-1">
              Commission Definitions:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <li>
                <strong className="text-[#111111]">Confirmed sales:</strong> Total value of orders with status Confirmed, Paid, or Completed.
              </li>
              <li>
                <strong className="text-[#111111]">Completed sales:</strong> Total value of Completed orders.
              </li>
              <li>
                <strong className="text-[#111111]">Your commission:</strong> Commission generated from Completed orders.
              </li>
              <li>
                <strong className="text-[#111111]">Paid to you:</strong> Amount of commission manually marked as already paid to the owner.
              </li>
              <li className="md:col-span-2">
                <strong className="text-[#111111]">Remaining:</strong> Your commission minus Paid to you. (Cancelled orders produce ₹0 commission).
              </li>
            </ul>
          </div>

          {/* Commission Payment Records */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-black/5 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-medium text-[#111111]">
                  Recorded Commission Payments
                </h3>
                <p className="text-xs text-gray-500">History of payouts transferred to owner</p>
              </div>
              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#B08D57]/10 text-[#B08D57] hover:bg-[#B08D57] hover:text-white transition-colors cursor-pointer"
              >
                + Record New Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs font-light">
                No commission payments recorded yet. Click "+ Record Payment" above to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-gray-500 uppercase tracking-wider text-[10px] border-b border-black/5">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Amount Paid</th>
                      <th className="px-6 py-3 font-semibold">Notes</th>
                      <th className="px-6 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#111111]">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-700">
                          {formatPriceINR(p.amount)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {p.notes || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Payment Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Record Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-black/10 space-y-4">
            <h3 className="font-heading text-xl font-medium text-[#111111]">
              Record Commission Payment
            </h3>
            <p className="text-xs text-gray-500 font-light">
              Record an amount that has already been paid out to the owner.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. GPay transfer for Aug commission"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#B08D57]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#111111] text-white hover:bg-[#B08D57] font-sans text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Payment Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
