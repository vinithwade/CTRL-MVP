import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function ProfilePage() {
  const { user, logout } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const navigate = useNavigate()

  if (!user) return <div className="p-8 text-center">Not logged in.</div>

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')
    setError('')
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setUpdating(false)
    if (error) setError(error.message)
    else {
      setMessage('Email updated! Please check your inbox to confirm.')
      setEmail(newEmail)
      setNewEmail('')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')
    setError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setUpdating(false)
    if (error) setError(error.message)
    else {
      setMessage('Password updated!')
      setNewPassword('')
    }
  }

  const handleLogout = async () => {
    await logout(() => navigate('/'))
  }

  return (
    <div className="max-w-md mx-auto py-12 font-['Inter'] font-semibold">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6 font-['Inter']">User Profile</h1>
      <div className="bg-white p-6 rounded shadow space-y-6">
        <div>
          <div className="text-sm text-gray-500 mb-1 font-['Inter']">Current Email</div>
          <div className="font-mono text-gray-900 mb-2 font-['Inter']">{email}</div>
        </div>
        <form onSubmit={handleUpdateEmail} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 font-['Inter']">Update Email</label>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 font-['Inter']" placeholder="New email" />
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors font-semibold font-['Inter']" disabled={updating || !newEmail}>
            {updating ? 'Updating...' : 'Update Email'}
          </button>
        </form>
        <form onSubmit={handleUpdatePassword} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 font-['Inter']">Update Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 font-['Inter']" placeholder="New password" />
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors font-semibold font-['Inter']" disabled={updating || !newPassword}>
            {updating ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        {message && <div className="text-green-600 text-sm text-center font-['Inter']">{message}</div>}
        {error && <div className="text-red-500 text-sm text-center font-['Inter']">{error}</div>}
        <button onClick={handleLogout} className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors font-semibold font-['Inter']">Logout</button>
      </div>
    </div>
  )
}

export default ProfilePage