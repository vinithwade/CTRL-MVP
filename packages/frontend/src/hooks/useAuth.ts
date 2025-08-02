import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        } else {
          setUser(session?.user || null)
        }
      } catch (err) {
        console.error('Error in getInitialSession:', err)
        setError('Failed to get session')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setUser(session?.user || null)
        setError('') // Clear any previous errors on auth state change
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      })
      
      if (error) {
        console.error('Login error:', error)
        setError(error.message)
        return false
      }
      
      if (data.user) {
        console.log('Login successful:', data.user.email)
        setUser(data.user)
        setError('')
        return true
      }
      
      return false
    } catch (err) {
      console.error('Login exception:', err)
      setError('An unexpected error occurred during login')
      return false
    } finally {
      setLoading(false)
    }
  }

  const signup = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password 
      })
      
      if (error) {
        console.error('Signup error:', error)
        setError(error.message)
        return false
      }
      
      if (data.user) {
        console.log('Signup successful:', data.user.email)
        setUser(data.user)
        setError('')
        return true
      }
      
      return false
    } catch (err) {
      console.error('Signup exception:', err)
      setError('An unexpected error occurred during signup')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (navigate?: () => void) => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        setError(error.message)
      } else {
        console.log('Logout successful')
        setUser(null)
        setError('')
        // Navigate to homepage if navigate function is provided
        if (navigate) {
          navigate()
        }
      }
    } catch (err) {
      console.error('Logout exception:', err)
      setError('An unexpected error occurred during logout')
    } finally {
      setLoading(false)
    }
  }

  // Test function to verify Supabase connection
  const testConnection = async () => {
    try {
      const { error } = await supabase.from('projects').select('count').limit(1)
      if (error) {
        console.error('Supabase connection test failed:', error)
        return false
      }
      console.log('Supabase connection test successful')
      return true
    } catch (err) {
      console.error('Supabase connection test exception:', err)
      return false
    }
  }

  return { 
    user, 
    isLoggedIn: !!user, 
    login, 
    signup, 
    logout, 
    loading, 
    error,
    testConnection
  }
}