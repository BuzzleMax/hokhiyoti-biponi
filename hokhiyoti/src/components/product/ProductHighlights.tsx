import { Sparkles } from 'lucide-react'

interface ProductHighlightsProps {
  highlights?: string[]
}

export default function ProductHighlights({ highlights }: ProductHighlightsProps) {
  if (!highlights || highlights.length === 0) return null

  return (
    <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#B08D57]/20 space-y-3">
      <div className="flex items-center gap-2 font-sans text-xs font-semibold tracking-widest text-[#B08D57] uppercase">
        <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
        <span>Product Highlights</span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {highlights.map((highlight, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-[#333333] font-light leading-relaxed">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B08D57] mt-1.5 flex-shrink-0" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
