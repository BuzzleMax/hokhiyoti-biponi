import { useState, useEffect } from 'react'
import { supabaseOrderService } from '../../../services/supabase/order.service'
import { Check } from 'lucide-react'

export default function MarketplaceSettingsPanel() {
  const [commissionPct, setCommissionPct] = useState<number>(10)
  const [customPct, setCustomPct] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabaseOrderService.getCommissionPercentage().then((pct) => {
      setCommissionPct(pct)
      setLoading(false)
    })
  }, [])

  const handleSaveCommission = async (val: number) => {
    setSaving(true)
    try {
      await supabaseOrderService.setCommissionPercentage(val)
      setCommissionPct(val)
      setCustomPct('')
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      alert('Failed to update commission percentage.')
    } finally {
      setSaving(false)
    }
  }

  const presets = [5, 8, 10, 12, 15, 20]

  if (loading) {
    return (
      <div className="max-w-2xl bg-white p-6 md:p-8 rounded-2xl border border-black/5 space-y-6 font-sans text-xs animate-pulse">
        <div className="h-6 bg-gray-200 rounded-md w-48" />
        <div className="h-4 bg-gray-200 rounded-md w-full" />
        <div className="grid grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl bg-white p-6 md:p-8 rounded-2xl border border-black/5 space-y-6 font-sans text-xs">
      <div>
        <h2 className="text-[#111111] font-semibold text-lg">Marketplace Commission Settings</h2>
        <p className="text-gray-500 font-light mt-1">
          Configure the default marketplace commission percentage. Updated rates apply to all new orders while preserving historical order rates.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Marketplace commission updated to {commissionPct}%!</span>
        </div>
      )}

      <div className="space-y-4">
        <label className="block font-semibold text-sm text-[#111111]">
          Current Active Commission Rate: <span className="text-[#B08D57] font-bold text-base">{commissionPct}%</span>
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {presets.map((pct) => (
            <button
              key={pct}
              type="button"
              disabled={saving}
              onClick={() => handleSaveCommission(pct)}
              className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                commissionPct === pct
                  ? 'border-[#111111] bg-[#111111] text-white shadow-sm scale-105'
                  : 'border-black/15 bg-[#FAF9F6] text-[#111111] hover:border-[#111111]'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Custom Percentage Input */}
        <div className="pt-4 border-t space-y-2">
          <label className="block font-semibold text-gray-700">Set Custom Percentage Rate</label>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="e.g. 7.5"
              value={customPct}
              onChange={(e) => setCustomPct(e.target.value)}
              className="flex-1 p-2.5 border rounded-lg focus:outline-none focus:border-[#B08D57]"
            />
            <button
              type="button"
              disabled={saving || !customPct}
              onClick={() => handleSaveCommission(Number(customPct))}
              className="px-6 py-2.5 bg-[#B08D57] hover:bg-[#111111] text-white rounded-lg font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Save Custom Rate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
