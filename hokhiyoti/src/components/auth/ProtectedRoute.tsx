import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, AlertCircle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      setLocation(redirectTo)
    }
  }, [user, loading, redirectTo, setLocation])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border border-[#B08D57]/20 border-t-[#B08D57] rounded-full animate-spin" />
          <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#B08D57]/60">Loading</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF9F6] p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#B08D57]/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#B08D57]" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-[#111111] font-sans mb-2">
            Email Verification Required
          </h2>
          <p className="text-sm text-[#666666] font-sans mb-6">
            Please verify your email address to access this feature. Check your inbox for the verification link.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 font-sans text-left">
                <strong>Important:</strong> You need to verify your email before accessing protected areas. If you didn't receive the verification email, please sign in again to request a new one.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocation(redirectTo)}
            className="w-full bg-[#B08D57] hover:bg-[#8B6F47] text-white font-sans font-medium py-3 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
