import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  Code, 
  Palette, 
  GitBranch,
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  FileText,
  Zap,
  Star,
  ArrowUpRight
} from 'lucide-react'

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Dart', 'React', 'Vue', 'Angular']
const DEVICES = ['Phone', 'Tablet', 'Desktop', 'Web']

export function UserDashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editLanguage, setEditLanguage] = useState(LANGUAGES[0])
  const [editDevice, setEditDevice] = useState(DEVICES[0])
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' or 'projects'
  const navigate = useNavigate()

  // Calculate analytics from real project data
  const calculateAnalytics = () => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter projects by creation date
    const thisWeekProjects = projects.filter(project => 
      project.created_at && new Date(project.created_at) >= oneWeekAgo
    )
    const thisMonthProjects = projects.filter(project => 
      project.created_at && new Date(project.created_at) >= oneMonthAgo
    )

    // Calculate recent activity from projects
    const recentActivity = projects
      .slice(0, 4)
      .map(project => ({
        type: 'project_created' as const,
        name: project.name,
        time: project.created_at ? getTimeAgo(new Date(project.created_at)) : 'Recently'
      }))

    // Calculate top projects (most recent)
    const topProjects = projects
      .slice(0, 3)
      .map(project => ({
        name: project.name,
        components: Math.floor(Math.random() * 50) + 10, // Mock component count
        screens: Math.floor(Math.random() * 15) + 3, // Mock screen count
        lastActive: project.created_at ? getTimeAgo(new Date(project.created_at)) : 'Recently'
      }))

    return {
      totalProjects: projects.length,
      activeProjects: projects.length, // All projects are considered active
      totalComponents: projects.length * 25, // Mock calculation
      totalScreens: projects.length * 8, // Mock calculation
      thisWeek: {
        projectsCreated: thisWeekProjects.length,
        componentsAdded: thisWeekProjects.length * 8, // Mock calculation
        screensDesigned: thisWeekProjects.length * 3, // Mock calculation
        codeGenerated: thisWeekProjects.length * 5 // Mock calculation
      },
      thisMonth: {
        projectsCreated: thisMonthProjects.length,
        componentsAdded: thisMonthProjects.length * 20, // Mock calculation
        screensDesigned: thisMonthProjects.length * 8, // Mock calculation
        codeGenerated: thisMonthProjects.length * 12 // Mock calculation
      },
      recentActivity,
      topProjects
    }
  }

  // Helper function to get time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`
  }

  const analytics = calculateAnalytics()

  // Fetch projects for the current user
  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('newproject')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching projects:', error)
          setError(error.message)
        } else {
          setProjects(data || [])
        }
        setLoading(false)
      })
  }, [user])

  // Create project
  const handleCreateProject = async (projectData: { name: string; language: string; device: string }) => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error: insertError } = await supabase.from('newproject').insert([
        { 
          name: projectData.name, 
          language: projectData.language, 
          device: projectData.device
        }
      ]).select()
      
      if (insertError) {
        console.error('Error creating project:', insertError)
        setError(insertError.message)
        throw new Error(insertError.message)
      }
      
      if (data && data.length > 0) {
        setProjects([data[0], ...projects])
        setShowCreateModal(false)
        navigate(`/design/${data[0].id}`)
      } else {
        throw new Error('No data returned from project creation')
      }
    } catch (err) {
      console.error('Project creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete project
  const handleDelete = async (id) => {
    setLoading(true)
    const { error: deleteError } = await supabase.from('newproject').delete().eq('id', id)
    setLoading(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setProjects(projects.filter(p => p.id !== id))
  }

  // Start editing
  const startEdit = (project) => {
    setEditId(project.id)
    setEditName(project.name)
    setEditLanguage(project.language)
    setEditDevice(project.device)
  }

  // Save edit
  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editName) {
      setError('Project name is required')
      return
    }
    setLoading(true)
    const { data, error: updateError } = await supabase.from('newproject').update({
      name: editName,
      language: editLanguage,
      device: editDevice
    }).eq('id', editId).select()
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setProjects(projects.map(p => p.id === editId ? data[0] : p))
    setEditId(null)
    setError('')
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0]}!</h2>
        <p className="text-primary-100">Here's what's happening with your CTRL projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalProjects}</p>
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
              <p className="text-2xl font-bold text-gray-900">{analytics.activeProjects}</p>
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
              <p className="text-2xl font-bold text-gray-900">{analytics.totalComponents}</p>
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
              <p className="text-2xl font-bold text-gray-900">{analytics.totalScreens}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Projects Created</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{analytics.thisWeek.projectsCreated}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Palette className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">Components Added</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{analytics.thisWeek.componentsAdded}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600">Screens Designed</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{analytics.thisWeek.screensDesigned}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Code className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Code Generated</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{analytics.thisWeek.codeGenerated}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'project_created' ? 'bg-blue-100' :
                  activity.type === 'component_added' ? 'bg-purple-100' :
                  activity.type === 'code_generated' ? 'bg-green-100' :
                  'bg-orange-100'
                }`}>
                  {activity.type === 'project_created' ? <Plus className="h-4 w-4 text-blue-600" /> :
                   activity.type === 'component_added' ? <Palette className="h-4 w-4 text-purple-600" /> :
                   activity.type === 'code_generated' ? <Code className="h-4 w-4 text-green-600" /> :
                   <Eye className="h-4 w-4 text-orange-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                  {activity.project && <p className="text-xs text-gray-500">in {activity.project}</p>}
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Projects */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Projects</h3>
        <div className="space-y-4">
          {analytics.topProjects.map((project, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Star className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-500">{project.components} components • {project.screens} screens</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last active</p>
                <p className="text-sm font-medium text-gray-900">{project.lastActive}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Project</span>
        </button>
      </div>

      <div className="space-y-4">
        {loading && <div className="text-gray-500">Loading...</div>}
        {projects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">Create your first project to get started with CTRL</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        )}
        {projects.map(project => (
          <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {editId === project.id ? (
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select 
                      value={editLanguage} 
                      onChange={e => setEditLanguage(e.target.value)} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                    <select 
                      value={editDevice} 
                      onChange={e => setEditDevice(e.target.value)} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {DEVICES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    type="submit" 
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditId(null)} 
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Code className="h-4 w-4" />
                      <span>{project.language}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{project.device}</span>
                    </span>
                    {project.created_at && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/design/${project.id}`)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Open Project"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => startEdit(project)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Project"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter'] font-semibold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 font-['Inter']">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-2 font-['Inter']">
            Manage your projects and track your progress
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors font-['Inter'] ${
              activeTab === 'dashboard'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors font-['Inter'] ${
              activeTab === 'projects'
                ? 'bg-primary-600 text-white'
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
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        loading={loading}
        error={error}
      />
    </div>
  )
}