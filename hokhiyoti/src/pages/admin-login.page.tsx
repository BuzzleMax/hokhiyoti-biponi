import { useState } from 'react'
import { useLocation } from 'wouter'
import { signInWithEmail } from '../lib/auth'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setLocation] = useLocation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await signInWithEmail(email, password)

    setLoading(false)

    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check your credentials.')
      return
    }

    if (data.user) {
      setLocation('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-medium text-[#111111] mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
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
