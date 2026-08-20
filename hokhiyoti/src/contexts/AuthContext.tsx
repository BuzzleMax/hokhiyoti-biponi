import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getCurrentUser, getCurrentSession, onAuthStateChange, signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const currentSession = await getCurrentSession()
        const currentUser = await getCurrentUser()
        setSession(currentSession)
        setUser(currentUser)
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Handle email verification from URL hash
    const handleEmailVerification = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Supabase will automatically handle the hash and session
        // We just need to wait for the auth state change
        console.log('Email verification detected in URL')
      }
    }
    
    handleEmailVerification()

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      
      // When user returns from email verification, refresh session to get updated status
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const { data } = await supabase.auth.refreshSession()
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      
      setLoading(false)
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
    <AuthContext.Provider value={{ user, session, loading, signOut: handleSignOut }}>
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