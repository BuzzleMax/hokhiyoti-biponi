import { useState } from 'react'
import { ChevronDown, FileText, Sparkles, Shield, Truck, RotateCcw, Info, Feather } from 'lucide-react'
import type { Product } from '../../types/product.types'

interface ProductTabsProps {
  product: Product
}

type TabKey = 'description' | 'highlights' | 'fabric' | 'care' | 'shipping' | 'return' | 'additional'

export default function ProductTabs({ product }: ProductTabsProps) {
  // Dynamically compile tab items ONLY if data exists from Admin
  const tabItems: Array<{ key: TabKey; label: string; icon: any; content: React.ReactNode }> = []

  if (product.description && product.description.trim().length > 0) {
    tabItems.push({
      key: 'description',
      label: 'Description',
      icon: FileText,
      content: <p className="font-sans text-sm text-[#555555] leading-relaxed font-light whitespace-pre-line">{product.description}</p>,
    })
  }

  if (product.highlights && product.highlights.length > 0) {
    tabItems.push({
      key: 'highlights',
      label: 'Product Highlights',
      icon: Sparkles,
      content: (
        <ul className="space-y-2">
          {product.highlights.map((h, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-xs text-[#444444] font-light">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      ),
    })
  }

  if (product.fabric && product.fabric.trim().length > 0) {
    tabItems.push({
      key: 'fabric',
      label: 'Fabric Details',
      icon: Feather,
      content: <p className="font-sans text-sm text-[#555555] leading-relaxed font-light">{product.fabric}</p>,
    })
  }

  if (product.careInstructions && product.careInstructions.trim().length > 0) {
    tabItems.push({
      key: 'care',
      label: 'Care Instructions',
      icon: Shield,
      content: <p className="font-sans text-sm text-[#555555] leading-relaxed font-light">{product.careInstructions}</p>,
    })
  }

  if (product.shippingInfo && product.shippingInfo.trim().length > 0) {
    tabItems.push({
      key: 'shipping',
      label: 'Shipping Information',
      icon: Truck,
      content: <p className="font-sans text-sm text-[#555555] leading-relaxed font-light">{product.shippingInfo}</p>,
    })
  }

  if (product.returnPolicy && product.returnPolicy.trim().length > 0) {
    tabItems.push({
      key: 'return',
      label: 'Return & Exchange Policy',
      icon: RotateCcw,
      content: <p className="font-sans text-sm text-[#555555] leading-relaxed font-light">{product.returnPolicy}</p>,
    })
  }

  if (product.additionalInfo && product.additionalInfo.trim().length > 0) {
    tabItems.push({
      key: 'additional',
      label: 'Additional Information',
      icon: Info,
      content: <p className="font-sans text-sm text-[#555555] leading-relaxed font-light">{product.additionalInfo}</p>,
    })
  }

  // If no tab sections exist, hide tab container completely
  if (tabItems.length === 0) return null

  const [activeTab, setActiveTab] = useState<TabKey>(tabItems[0]!.key)
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    tabItems.forEach((t) => { initial[t.key] = true })
    return initial
  })

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="pt-8 border-t border-[rgba(0,0,0,0.06)]">
      {/* Desktop Tabs Header */}
      <div className="hidden md:flex border-b border-[rgba(0,0,0,0.08)] gap-8 overflow-x-auto">
        {tabItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`pb-4 flex items-center gap-2 font-sans text-xs font-semibold tracking-wider transition-all border-b-2 uppercase whitespace-nowrap ${
                isActive
                  ? 'border-[#B08D57] text-[#111111]'
                  : 'border-transparent text-[#777777] hover:text-[#111111]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Desktop Active Tab Content */}
      <div className="hidden md:block py-6">
        {tabItems.find((item) => item.key === activeTab)?.content}
      </div>

      {/* Mobile Accordion Style */}
      <div className="md:hidden divide-y divide-[rgba(0,0,0,0.06)]">
        {tabItems.map((item) => {
          const Icon = item.icon
          const isOpen = Boolean(openAccordion[item.key])
          return (
            <div key={item.key} className="py-4">
              <button
                onClick={() => toggleAccordion(item.key)}
                className="w-full flex items-center justify-between font-sans text-xs font-semibold text-[#111111] uppercase tracking-wider text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#B08D57] stroke-[1.5]" />
                  <span>{item.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <div className="pt-3 pl-6">{item.content}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
