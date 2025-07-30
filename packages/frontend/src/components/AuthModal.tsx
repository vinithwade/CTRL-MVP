import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  
  const { login, signup, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    if (!email || !password) {
      setFormError('Please fill in all fields')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    try {
      let success = false
      
      if (mode === 'login') {
        success = await login({ email, password })
      } else {
        success = await signup({ email, password })
      }
      
      if (success) {
        onClose()
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setFormError('')
        // Navigate to user dashboard after successful authentication
        navigate('/user-dashboard')
      }
      // If not successful, error is already set by the useAuth hook
    } catch (err) {
      setFormError('An error occurred. Please try again.')
    }
  }

  const handleClose = () => {
    onClose()
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFormError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-['Inter']">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 font-['Inter']">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(formError || error) && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded font-['Inter']">
              {formError || error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 font-['Inter']">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-['Inter']"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 font-['Inter']">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-['Inter']"
              placeholder="Enter your password"
              required
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 font-['Inter']">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-['Inter']"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold font-['Inter']"
          >
            {loading 
              ? (mode === 'login' ? 'Logging in...' : 'Signing up...') 
              : (mode === 'login' ? 'Login' : 'Sign Up')
            }
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-600 font-['Inter']">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setFormError('')
                setEmail('')
                setPassword('')
                setConfirmPassword('')
              }}
              className="text-primary-600 hover:text-primary-700 font-semibold font-['Inter']"
            >
              {mode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 