import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!email || !password) {
      setFormError('Please enter email and password')
      return
    }
    await login({ email, password })
    // If login is successful, isLoggedIn will be true
    if (!error && !formError) {
      navigate('/user-dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Login</h2>
        {(formError || error) && <div className="text-red-500 text-sm text-center">{formError || error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="text-center text-sm text-gray-500">
          Don't have an account? <Link to="/signup" className="text-primary-600 hover:underline">Sign up</Link>
        </div>
      </form>
    </div>
  )
}