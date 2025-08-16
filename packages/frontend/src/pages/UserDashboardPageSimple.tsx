import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Code, 
  Palette, 
  Activity,
  FileText,
  Star,
  ArrowUpRight,
  X
} from 'lucide-react'

// Simple project interface without Supabase dependency
interface SimpleProject {
  id: string
  name: string
  language: string
  device: string
  created_at: string
  updated_at: string
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Dart', 'React', 'Vue', 'Angular']
const DEVICES = ['Phone', 'Tablet', 'Desktop', 'Web']

function UserDashboardPageSimple() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<SimpleProject[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectLanguage, setNewProjectLanguage] = useState(LANGUAGES[0])
  const [newProjectDevice, setNewProjectDevice] = useState(DEVICES[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const navigate = useNavigate()

  // Create project (simplified - just adds to local state)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProjectName.trim()) {
      setError('Project name is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newProject: SimpleProject = {
      id: `project-${Date.now()}`,
      name: newProjectName,
      language: newProjectLanguage,
      device: newProjectDevice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setProjects([...projects, newProject])
    setNewProjectName('')
    setNewProjectLanguage(LANGUAGES[0])
    setNewProjectDevice(DEVICES[0])
    setShowCreateModal(false)
    setLoading(false)
    
    // Automatically open Design Mode for the new project
    navigate(`/design/${newProject.id}`)
  }

  // Delete project
  const handleDelete = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
  }

  // Navigate to project modes
  const openDesignMode = (projectId: string) => {
    navigate(`/design/${projectId}`)
  }

  const openLogicMode = (projectId: string) => {
    navigate(`/logic/${projectId}`)
  }

  const openCodeMode = (projectId: string) => {
    navigate(`/code/${projectId}`)
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0] || 'Developer'}!</h2>
        <p className="text-blue-100">Here's what's happening with your CTRL projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Components</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length * 15}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Palette className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Screens</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length * 8}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Code className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-8 w-8 text-blue-600 mb-2" />
            <h4 className="font-semibold text-gray-900">Create New Project</h4>
            <p className="text-sm text-gray-600">Start a new CTRL project</p>
          </button>
          
          <button className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
            <FileText className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-semibold text-gray-900">Import Project</h4>
            <p className="text-sm text-gray-600">Import existing design files</p>
          </button>
          
          <button className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
            <Star className="h-8 w-8 text-purple-600 mb-2" />
            <h4 className="font-semibold text-gray-900">Browse Templates</h4>
            <p className="text-sm text-gray-600">Start from a template</p>
          </button>
        </div>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => openDesignMode(project.id)}
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 hover:text-blue-600">{project.name}</h4>
                    <p className="text-sm text-gray-600">{project.language} • {project.device}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      openDesignMode(project.id)
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Open Design Mode"
                  >
                    <Palette className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      openLogicMode(project.id)
                    }}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    title="Open Logic Mode"
                  >
                    <Activity className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      openCodeMode(project.id)
                    }}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Open Code Mode"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-6">
      {/* Projects Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first CTRL project to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div 
                className="p-6 cursor-pointer"
                onClick={() => openDesignMode(project.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.language}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(project.id)
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{project.device}</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        openDesignMode(project.id)
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Design Mode"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        openLogicMode(project.id)
                      }}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                      title="Logic Mode"
                    >
                      <Activity className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        openCodeMode(project.id)
                      }}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Code Mode"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      openDesignMode(project.id)
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <span>Open</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome back, {user?.email?.split('@')[0] || 'Developer'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your projects and track your progress
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projects
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' ? renderDashboard() : renderProjects()}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Language/Framework
                </label>
                <select
                  id="language"
                  value={newProjectLanguage}
                  onChange={(e) => setNewProjectLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Device
                </label>
                <select
                  id="device"
                  value={newProjectDevice}
                  onChange={(e) => setNewProjectDevice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DEVICES.map((device) => (
                    <option key={device} value={device}>{device}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboardPageSimple
