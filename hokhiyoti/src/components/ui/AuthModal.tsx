import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Loader2, CheckCircle2, AlertCircle, Phone, User, Lock, RefreshCw } from 'lucide-react'
import { signUp, signInWithEmail, updateProfile, checkPhoneExists, resendVerificationEmail } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type AuthStep = 'phone-email' | 'success' | 'verification'
type AuthMode = 'login' | 'register'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<AuthStep>('phone-email')
  const [mode, setMode] = useState<AuthMode>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendError, setResendError] = useState('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone-email')
      setMode('login')
      setFullName('')
      setPhone('')
      setEmail('')
      setPassword('')
      setError('')
      setVerificationEmail('')
      setResendCooldown(0)
      setResendError('')
      // Lock body scroll when modal opens
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Clear error when step changes
  useEffect(() => {
    setError('')
  }, [step])

  // Auto-close if user becomes authenticated
  useEffect(() => {
    if (user && step === 'success') {
      const timer = setTimeout(() => {
        onClose()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user, step, onClose])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Check verification status when user is authenticated
  useEffect(() => {
    const checkVerification = async () => {
      if (user && step === 'verification') {
        // Refresh session to get latest verification status
        const { data } = await supabase.auth.refreshSession()
        if (data.session?.user?.email_confirmed_at) {
          setStep('success')
        }
      }
    }
    checkVerification()
  }, [user, step])

  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    // Check if it's a valid Indian phone number (10 digits)
    return cleaned.length === 10
  }

  const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    // Add +91 prefix for Indian numbers
    return `+91${cleaned}`
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Email and password are required for login
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await signInWithEmail(email, password)

    setLoading(false)

    if (error) {
      setError(error.message || 'Failed to sign in. Please check your credentials.')
      return
    }

    // Check if email is verified
    if (data.user && !data.user.email_confirmed_at) {
      setVerificationEmail(email)
      setStep('verification')
      setResendCooldown(60)
      return
    }

    // Update profile with phone if provided
    if (data.user && phone) {
      const normalizedPhone = normalizePhone(phone)
      await updateProfile(data.user.id, { phone: normalizedPhone })
    }

    setStep('success')
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // All fields are required for registration
    if (!fullName || !phone || !email || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    const normalizedPhone = normalizePhone(phone)

    // Check if phone already exists
    const { exists: phoneExists } = await checkPhoneExists(normalizedPhone)
    if (phoneExists) {
      setLoading(false)
      setError('This phone number is already registered')
      return
    }

    // Sign up user
    const { data, error } = await signUp(email, password, {
      full_name: fullName,
      phone: normalizedPhone,
    })

    setLoading(false)

    if (error) {
      setError(error.message || 'Failed to create account. Please try again.')
      return
    }

    if (data.user) {
      // Create/update profile
      await updateProfile(data.user.id, {
        full_name: fullName,
        phone: normalizedPhone,
        email,
      })

      // Check if email verification is required
      if (!data.user.email_confirmed_at) {
        setVerificationEmail(email)
        setStep('verification')
        setResendCooldown(60) // 60 seconds cooldown
        return
      }
    }

    setStep('success')
  }

  const handlePhoneEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'login') {
      await handleLoginSubmit(e)
    } else {
      await handleRegisterSubmit(e)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setPhone('')
    setEmail('')
    setPassword('')
    setFullName('')
  }

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !verificationEmail) return

    setResendLoading(true)
    setResendError('')

    const { error } = await resendVerificationEmail(verificationEmail)

    setResendLoading(false)

    if (error) {
      setResendError(error.message || 'Failed to resend verification email')
      return
    }

    setResendCooldown(60) // Reset cooldown to 60 seconds
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#B08D57] to-[#8B6F47] px-6 py-4 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-sans font-medium text-white">
                      {step === 'phone-email' ? (mode === 'login' ? 'Sign In' : 'Create Account') : 
                       step === 'verification' ? 'Verify Your Email' : 'Success'}
                    </h2>
                    <p className="text-sm text-white/80 font-sans">
                      {step === 'phone-email' ? (mode === 'login' ? 'Enter your credentials to sign in' : 'Fill in your details to create an account') : 
                       step === 'verification' ? 'Check your email for a verification link' : 
                       'You are now signed in'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-8 overflow-y-auto flex-1">
                {step === 'phone-email' && (
                  <form onSubmit={handlePhoneEmailSubmit} className="space-y-6">
                    {mode === 'register' && (
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-sans font-medium text-[#111111] mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B08D57]" />
                          <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B08D57] focus:border-transparent font-sans text-sm"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="block text-sm font-sans font-medium text-[#111111] mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B08D57]" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B08D57] focus:border-transparent font-sans text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-sans font-medium text-[#111111] mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B08D57]" />
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B08D57] focus:border-transparent font-sans text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-sans font-medium text-[#111111] mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B08D57]" />
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B08D57] focus:border-transparent font-sans text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm font-sans">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#B08D57] hover:bg-[#8B6F47] text-white font-sans font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                        </>
                      ) : (
                        mode === 'login' ? 'Sign In' : 'Create Account'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-sm text-[#B08D57] hover:text-[#8B6F47] font-sans"
                      >
                        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                      </button>
                    </div>
                  </form>
                )}

                {step === 'success' && (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-[#111111] font-sans">
                      {mode === 'login' ? 'Successfully Signed In' : 'Account Created Successfully'}
                    </h3>
                    <p className="text-sm text-[#666666] font-sans">
                      {mode === 'login' ? 'Welcome back to Hokhiyoti Biponi' : 'Welcome to Hokhiyoti Biponi'}
                    </p>
                  </div>
                )}

                {step === 'verification' && (
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-[#B08D57]/10 rounded-full flex items-center justify-center">
                        <Mail className="h-8 w-8 text-[#B08D57]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-[#111111] font-sans">
                        Check Your Email
                      </h3>
                      <p className="text-sm text-[#666666] font-sans">
                        We've sent a verification link to
                      </p>
                      <p className="text-sm font-medium text-[#B08D57] font-sans">
                        {verificationEmail}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs text-blue-800 font-sans">
                        <strong>Important:</strong> Please click the verification link in the email to activate your account. You may need to check your spam folder.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0 || resendLoading}
                        className="w-full bg-[#B08D57] hover:bg-[#8B6F47] text-white font-sans font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {resendLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : resendCooldown > 0 ? (
                          `Resend in ${resendCooldown}s`
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Resend Verification Email
                          </>
                        )}
                      </button>
                      {resendError && (
                        <div className="flex items-center justify-center gap-2 text-red-600 text-sm font-sans">
                          <AlertCircle className="h-4 w-4" />
                          {resendError}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setStep('phone-email')
                          setVerificationEmail('')
                          setResendCooldown(0)
                          setResendError('')
                        }}
                        className="text-sm text-[#B08D57] hover:text-[#8B6F47] font-sans"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}