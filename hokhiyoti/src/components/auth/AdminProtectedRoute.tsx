import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '../../contexts/AuthContext'
import { Shield, AlertCircle } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function AdminProtectedRoute({ children, redirectTo = '/admin-login' }: AdminProtectedRouteProps) {
  const { user, loading, isAdmin, isAdminLoading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !isAdminLoading) {
      // If not logged in, redirect to login
      if (!user) {
        setLocation(redirectTo)
        return
      }
      
      // If logged in but not admin, redirect away from admin panel
      if (user && !isAdmin) {
        setLocation('/')
        return
      }
    }
  }, [user, loading, isAdmin, isAdminLoading, redirectTo, setLocation])

  if (loading || isAdminLoading) {
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

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF9F6] p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-[#111111] font-sans mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-[#666666] font-sans mb-6">
            You don't have permission to access the admin panel. This area is restricted to authorized administrators only.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 font-sans text-left">
                <strong>Restricted Access:</strong> The admin panel requires special authorization. If you believe this is an error, please contact the system administrator.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocation('/')}
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
