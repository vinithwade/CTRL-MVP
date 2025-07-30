import { useAuth } from '../hooks/useAuth'
import { useEffect, useState } from 'react'

export function AuthStatus() {
  const { user, isLoggedIn, loading, error, testConnection } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection()
      setConnectionStatus(isConnected ? 'Connected' : 'Failed')
    }
    checkConnection()
  }, [testConnection])

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border text-xs">
      <div className="space-y-1">
        <div><strong>Auth Status:</strong> {isLoggedIn ? 'Logged In' : 'Not Logged In'}</div>
        <div><strong>User:</strong> {user?.email || 'None'}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Error:</strong> {error || 'None'}</div>
        <div><strong>Supabase:</strong> {connectionStatus}</div>
      </div>
    </div>
  )
} 