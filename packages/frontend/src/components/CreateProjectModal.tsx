import { useState } from 'react'
import { X } from 'lucide-react'

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Dart', 'React', 'Vue', 'Angular']
const DEVICES = ['Phone', 'Tablet', 'Desktop', 'Web']

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectData: { name: string; language: string; device: string }) => Promise<void>
  loading?: boolean
  error?: string
}

export function CreateProjectModal({ isOpen, onClose, onSubmit, loading = false, error = '' }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [device, setDevice] = useState(DEVICES[0])
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    if (!name.trim()) {
      setFormError('Project name is required')
      return
    }

    try {
      await onSubmit({ name: name.trim(), language, device })
      // Reset form on success
      setName('')
      setLanguage(LANGUAGES[0])
      setDevice(DEVICES[0])
      setFormError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  const handleClose = () => {
    setName('')
    setLanguage(LANGUAGES[0])
    setDevice(DEVICES[0])
    setFormError('')
    onClose()
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
            Create New Project
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
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-['Inter']"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 font-['Inter']">
              Programming Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-['Inter']"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 font-['Inter']">
              Target Device
            </label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-['Inter']"
            >
              {DEVICES.map(dev => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold font-['Inter']"
          >
            {loading ? 'Creating Project...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  )
} 