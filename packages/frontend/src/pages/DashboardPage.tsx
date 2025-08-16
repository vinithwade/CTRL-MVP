import { TrendingUp, Users, Activity, Zap } from 'lucide-react'

function DashboardPage() {
  const stats = [
    {
      name: 'Total Users',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users
    },
    {
      name: 'Active Sessions',
      value: '567',
      change: '+8%',
      changeType: 'positive',
      icon: Activity
    },
    {
      name: 'AI Interactions',
      value: '89,123',
      change: '+23%',
      changeType: 'positive',
      icon: Zap
    },
    {
      name: 'System Performance',
      value: '99.9%',
      change: '+0.1%',
      changeType: 'positive',
      icon: TrendingUp
    }
  ]

  const recentActivity = [
    { id: 1, action: 'User login', user: 'john.doe', time: '2 minutes ago' },
    { id: 2, action: 'AI query processed', user: 'jane.smith', time: '5 minutes ago' },
    { id: 3, action: 'Data export completed', user: 'admin', time: '10 minutes ago' },
    { id: 4, action: 'System backup', user: 'system', time: '1 hour ago' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor your platform's performance and user activity in real-time.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart placeholder - Performance metrics</p>
          </div>
        </div>

        {/* User Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart placeholder - User activity trends</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">by {activity.user}</p>
              </div>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary">
            Generate Report
          </button>
          <button className="btn-secondary">
            Export Data
          </button>
          <button className="btn-secondary">
            System Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 