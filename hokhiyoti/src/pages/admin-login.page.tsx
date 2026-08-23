import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { signInWithEmail, checkIsAdmin } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [, setLocation] = useLocation()
  const { user, isAdmin, isAdminLoading } = useAuth()

  // Redirect if already logged in and is admin
  useEffect(() => {
    if (!isAdminLoading && user && isAdmin) {
      setLocation('/admin')
    } else if (!isAdminLoading && user && !isAdmin) {
      setAccessDenied(true)
    }
  }, [user, isAdmin, isAdminLoading, setLocation])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAccessDenied(false)
    setLoading(true)

    const { data, error: signInError } = await signInWithEmail(email, password)

    setLoading(false)

    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check your credentials.')
      return
    }

    if (data.user) {
      // Check if user is admin
      const adminStatus = await checkIsAdmin(data.user.id)
      if (adminStatus) {
        setLocation('/admin')
      } else {
        setAccessDenied(true)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-medium text-[#111111] mb-6 text-center">Admin Login</h1>
        
        {accessDenied && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 text-center">
              <strong>Access Denied:</strong> You don't have admin privileges. This login is for authorized administrators only.
            </p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setAccessDenied(false)
              }}
              placeholder="Email"
              required
              className="w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] text-[#111111] focus:outline-none focus:border-[#B08D57]"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
                setAccessDenied(false)
              }}
              placeholder="Password"
              required
              className="w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] text-[#111111] focus:outline-none focus:border-[#B08D57]"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#111111] text-white hover:bg-[#B08D57] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
