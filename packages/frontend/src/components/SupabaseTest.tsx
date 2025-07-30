import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export function SupabaseTest() {
  const { user, isLoggedIn, login, signup, logout, loading, error } = useAuth()
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('testpassword123')
  const [testResult, setTestResult] = useState<string>('')

  const testSupabaseConnection = async () => {
    try {
      setTestResult('Testing Supabase connection...')
      
      // Test 1: Check if we can connect to Supabase
      const { data, error } = await supabase.from('projects').select('count').limit(1)
      
      if (error) {
        setTestResult(`❌ Connection failed: ${error.message}`)
        return
      }
      
      setTestResult('✅ Supabase connection successful!')
    } catch (err) {
      setTestResult(`❌ Connection error: ${err}`)
    }
  }

  const testSignup = async () => {
    try {
      setTestResult('Testing signup...')
      const success = await signup({ email: testEmail, password: testPassword })
      
      if (success) {
        setTestResult('✅ Signup successful!')
      } else {
        setTestResult(`❌ Signup failed: ${error}`)
      }
    } catch (err) {
      setTestResult(`❌ Signup error: ${err}`)
    }
  }

  const testLogin = async () => {
    try {
      setTestResult('Testing login...')
      const success = await login({ email: testEmail, password: testPassword })
      
      if (success) {
        setTestResult('✅ Login successful!')
      } else {
        setTestResult(`❌ Login failed: ${error}`)
      }
    } catch (err) {
      setTestResult(`❌ Login error: ${err}`)
    }
  }

  const testLogout = async () => {
    try {
      setTestResult('Testing logout...')
      await logout()
      setTestResult('✅ Logout successful!')
    } catch (err) {
      setTestResult(`❌ Logout error: ${err}`)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border text-xs max-w-sm">
      <h3 className="font-bold mb-2">Supabase Test Panel</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>Auth Status:</strong> {isLoggedIn ? '✅ Logged In' : '❌ Not Logged In'}</div>
        <div><strong>User Email:</strong> {user?.email || 'None'}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Error:</strong> {error || 'None'}</div>
      </div>

      <div className="space-y-2">
        <button
          onClick={testSupabaseConnection}
          className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Test Connection
        </button>
        
        <div className="flex space-x-1">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email"
            className="flex-1 px-2 py-1 border rounded text-xs"
          />
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="Password"
            className="flex-1 px-2 py-1 border rounded text-xs"
          />
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={testSignup}
            className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Signup
          </button>
          <button
            onClick={testLogin}
            className="flex-1 bg-yellow-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Login
          </button>
          <button
            onClick={testLogout}
            className="flex-1 bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Logout
          </button>
        </div>
      </div>

      {testResult && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <strong>Test Result:</strong> {testResult}
        </div>
      )}
    </div>
  )
} 