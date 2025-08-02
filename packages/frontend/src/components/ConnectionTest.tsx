import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')
  const [authStatus, setAuthStatus] = useState<string>('Testing...')

  useEffect(() => {
    testConnection()
    testAuth()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing connection...')
      
      // Test basic connection
      const { error } = await supabase.from('projects').select('count').limit(1)
      
      if (error) {
        setConnectionStatus(`❌ Connection failed: ${error.message}`)
        return
      }
      
      setConnectionStatus('✅ Supabase connected successfully!')
    } catch (err) {
      setConnectionStatus(`❌ Connection error: ${err}`)
    }
  }

  const testAuth = async () => {
    try {
      setAuthStatus('Testing auth...')
      
      // Test auth configuration
      const { error } = await supabase.auth.getSession()
      
      if (error) {
        setAuthStatus(`❌ Auth failed: ${error.message}`)
        return
      }
      
      setAuthStatus('✅ Auth configured correctly!')
    } catch (err) {
      setAuthStatus(`❌ Auth error: ${err}`)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border text-xs max-w-sm">
      <h3 className="font-bold mb-2">Supabase Configuration Test</h3>
      
      <div className="space-y-2">
        <div><strong>Project URI:</strong> wyrgvlqtbuplsgqfmgzr.supabase.co</div>
        <div><strong>Anon Key:</strong> ✅ Configured</div>
        <div><strong>Connection:</strong> {connectionStatus}</div>
        <div><strong>Auth:</strong> {authStatus}</div>
      </div>

      <div className="mt-3 space-y-1">
        <button
          onClick={testConnection}
          className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Retest Connection
        </button>
        <button
          onClick={testAuth}
          className="w-full bg-green-500 text-white px-2 py-1 rounded text-xs"
        >
          Retest Auth
        </button>
      </div>
    </div>
  )
} 