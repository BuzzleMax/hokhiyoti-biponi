import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getCurrentSession, onAuthStateChange, signOut, checkIsAdmin } from '../lib/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  isAdminLoading: boolean
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const currentSession = await getCurrentSession()
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        // Check admin status if user exists
        if (currentSession?.user) {
          const adminStatus = await checkIsAdmin(currentSession.user.id)
          setIsAdmin(adminStatus)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
        setIsAdminLoading(false)
      }
    }

    initializeAuth()

    // Handle email verification from URL hash
    const handleEmailVerification = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        console.log('Email verification detected in URL')
      }
    }
    
    handleEmailVerification()

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      setSession(session)
      setUser(session?.user ?? null)
      
      // Check admin status when session changes
      if (session?.user) {
        const adminStatus = await checkIsAdmin(session.user.id)
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }
      
      setLoading(false)
      setIsAdminLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Error signing out:', error)
      return { error }
    }
    setUser(null)
    setSession(null)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isAdminLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}