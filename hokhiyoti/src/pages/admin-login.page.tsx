import { useState } from 'react'
import { useLocation } from 'wouter'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [, setLocation] = useLocation()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    
    if (!adminPassword) {
      setError('Admin password not configured. Set VITE_ADMIN_PASSWORD environment variable.')
      return
    }
    
    if (password === adminPassword) {
      localStorage.setItem('hokhiyoti_admin', 'true')
      setLocation('/admin')
    } else {
      setError('Incorrect password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-medium text-[#111111] mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Password"
              className="w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] text-[#111111] focus:outline-none focus:border-[#B08D57]"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-[#111111] text-white hover:bg-[#B08D57] transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
