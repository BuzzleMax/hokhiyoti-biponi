import { useState, useEffect } from 'react'
import { supabaseReviewService } from '../../../services/supabase/review.service'
import type { ProductReview } from '../../../types/review.types'
import { Star, Trash2 } from 'lucide-react'

export default function ReviewsPanel() {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])

  const ADMIN_PAGE_SIZE = 50

  useEffect(() => {
    loadReviews(true)
  }, [])

  const loadReviews = async (isInitial = true) => {
    if (loading && !isInitial) return
    setLoading(true)
    setError(null)
    const activeCursor = isInitial ? null : cursors[cursors.length - 1]
    try {
      const data = await supabaseReviewService.getAllReviewsForAdmin(ADMIN_PAGE_SIZE, activeCursor)

      if (isInitial) {
        setReviews(data)
        const last = data.at(-1)
        setCursors([null, last ? { createdAt: last.createdAt, id: last.id } : null])
      } else {
        setReviews((prev) => {
          const prevIds = new Set(prev.map((r) => r.id))
          return [...prev, ...data.filter((r) => !prevIds.has(r.id))]
        })
        const last = data.at(-1)
        if (last) {
          setCursors((prev) => [...prev, { createdAt: last.createdAt, id: last.id }])
        }
      }
      setHasMore(data.length >= ADMIN_PAGE_SIZE)
    } catch (err) {
      console.error(err)
      setError('Failed to load reviews.')
      if (isInitial) setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleApprove = async (id: string, currentApproved: boolean) => {
    try {
      await supabaseReviewService.updateReviewStatus(id, !currentApproved)
      loadReviews()
    } catch (err) {
      alert('Failed to update review status.')
    }
  }

  const handleToggleVerified = async (id: string, currentVerified: boolean) => {
    try {
      await supabaseReviewService.toggleVerifiedPurchase(id, !currentVerified)
      loadReviews()
    } catch (err) {
      alert('Failed to update verified status.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    try {
      await supabaseReviewService.deleteReview(id)
      loadReviews()
    } catch (err) {
      alert('Failed to delete review.')
    }
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6 font-sans py-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-md w-48" />
        {[1, 2].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (error && reviews.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-red-600 font-sans">{error}</p>
        <button
          onClick={() => loadReviews(true)}
          className="px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase bg-[#111111] hover:bg-[#B08D57] rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans text-xs">
      <h2 className="text-[#111111] font-semibold text-lg">Product Reviews Moderation Queue</h2>

      {reviews.length === 0 ? (
        <p className="text-xs text-gray-500 py-8 text-center">No submitted reviews found.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl bg-white border border-black/5 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#111111]">{r.customerName}</span>
                    {r.city && <span className="text-gray-400">• {r.city}</span>}
                    <div className="flex gap-1 text-[#B08D57]">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#B08D57]" />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Submitted on {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleApprove(r.id, r.isApproved)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      r.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.isApproved ? 'Approved (Visible)' : 'Pending Approval'}
                  </button>

                  <button
                    onClick={() => handleToggleVerified(r.id, r.isVerifiedPurchase)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      r.isVerifiedPurchase ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.isVerifiedPurchase ? 'Verified Purchase' : 'Mark Verified'}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {r.title && <h4 className="font-semibold text-xs text-[#111111]">{r.title}</h4>}
              <p className="text-gray-600 leading-relaxed font-light">{r.comment}</p>

              {r.photoUrls && r.photoUrls.length > 0 && (
                <div className="flex gap-2 pt-2">
                  {r.photoUrls.map((url, i) => (
                    <img key={i} src={url} alt="Review attachment" className="w-16 h-16 object-cover rounded-lg border" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && reviews.length > 0 && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => loadReviews(false)}
            className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-[#B08D57] text-white text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  )
}
