import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export async function signUp(email: string, password: string, options?: {
  full_name?: string
  phone?: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: options?.full_name,
        phone: options?.phone,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function updateProfile(userId: string, data: {
  full_name?: string
  phone?: string
  email?: string
  avatar_url?: string
}) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    })
  return { error }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function checkPhoneExists(phone: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()
  return { exists: !!data, error }
}

export async function resendVerificationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  return { data, error }
}
