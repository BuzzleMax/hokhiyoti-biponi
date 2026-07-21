import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { subscribeToBrevo } from '../../services/brevo'

type ToastState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null

/**
 * Newsletter signup with Brevo integration.
 *
 * Features:
 *  - Email validation (HTML5 + regex)
 *  - Loading state + disabled button while submitting
 *  - Success toast with auto-dismiss
 *  - Failure toast (network error, unknown error)
 *  - "Already subscribed" toast for duplicates
 *  - Spam honeypot field (hidden from real users, filled by bots)
 *  - Clear form after success
 *  - aria-live region for screen-reader announcements
 */
export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  // Honeypot — never shown to humans; bots fill it in
  const honeypotRef = useRef<HTMLInputElement>(null)

  const showToast = (next: ToastState) => {
    setToast(next)
    // Auto-dismiss after 5 seconds
    setTimeout(() => setToast(null), 5000)
  }

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Honeypot check — silently reject if bot filled the hidden field
    if (honeypotRef.current?.value) return

    const trimmed = email.trim()

    if (!validateEmail(trimmed)) {
      showToast({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }

    setSubmitting(true)
    setToast(null)

    const result = await subscribeToBrevo(trimmed)

    setSubmitting(false)

    if (result.success) {
      setEmail('')
      showToast({ type: 'success', message: "You're on the list! Welcome to Hokhiyoti Biponi." })
      return
    }

    switch (result.reason) {
      case 'duplicate':
        showToast({ type: 'error', message: 'This email is already subscribed. Thank you!' })
        break
      case 'invalid':
        showToast({ type: 'error', message: 'That email address looks invalid. Please check and try again.' })
        break
      case 'network':
        showToast({ type: 'error', message: 'Connection error. Please check your internet and try again.' })
        break
      default:
        showToast({ type: 'error', message: 'Something went wrong. Please try again in a moment.' })
    }
  }

  return (
    <section
      id="newsletter"
      className="bg-[#FAF9F6] py-24 px-6 md:px-12 max-w-[1400px] mx-auto border-t border-[rgba(0,0,0,0.06)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-[800px] mx-auto text-center space-y-8"
      >
        <div className="space-y-3">
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
            STAY IN TOUCH
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-medium text-[#111111] leading-tight">
            The Newsletter
          </h2>
          <p className="font-sans text-sm md:text-base text-[#666666] leading-relaxed max-w-[50ch] mx-auto font-light">
            Sign up to receive private editorial drops, early collection access, and brand
            announcements. Delivered with absolute restraint.
          </p>
        </div>

        <form
          className="flex flex-col sm:flex-row gap-4 max-w-[500px] mx-auto pt-4"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Newsletter signup form"
        >
          {/* Spam honeypot — visually hidden, never submitted by real users */}
          <input
            ref={honeypotRef}
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />

          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            aria-label="Email address"
            aria-describedby="newsletter-status"
            disabled={submitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-12 px-6 rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#B08D57] disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your email address"
          />

          <Button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Subscribing…</span>
              </span>
            ) : (
              'SUBSCRIBE'
            )}
          </Button>
        </form>

        {/* Accessible live region for toast announcements */}
        <div
          id="newsletter-status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {toast?.message ?? ''}
        </div>

        {/* Visual toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.message}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              role="status"
              className={`flex items-center justify-center gap-2 text-sm font-sans font-medium ${
                toast.type === 'success' ? 'text-[#2D6A4F]' : 'text-[#C0392B]'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
