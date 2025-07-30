import { useState } from 'react'
import { Save, Bell, Shield, Palette, Database } from 'lucide-react'

export function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    aiEnabled: true,
    dataRetention: '30'
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // Save settings to backend
    console.log('Saving settings:', settings)
  }

  const settingSections = [
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          key: 'notifications',
          label: 'Enable Notifications',
          type: 'toggle',
          description: 'Receive notifications for important events'
        }
      ]
    },
    {
      title: 'Appearance',
      icon: Palette,
      settings: [
        {
          key: 'darkMode',
          label: 'Dark Mode',
          type: 'toggle',
          description: 'Switch between light and dark themes'
        }
      ]
    },
    {
      title: 'AI Settings',
      icon: Shield,
      settings: [
        {
          key: 'aiEnabled',
          label: 'Enable AI Assistant',
          type: 'toggle',
          description: 'Allow AI to process and respond to queries'
        }
      ]
    },
    {
      title: 'Data & Storage',
      icon: Database,
      settings: [
        {
          key: 'autoSave',
          label: 'Auto Save',
          type: 'toggle',
          description: 'Automatically save changes'
        },
        {
          key: 'dataRetention',
          label: 'Data Retention (days)',
          type: 'select',
          options: ['7', '30', '90', '365'],
          description: 'How long to keep user data'
        }
      ]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your platform preferences and system settings.
        </p>
      </div>

      <div className="space-y-6">
        {settingSections.map((section) => (
          <div key={section.title} className="card">
            <div className="flex items-center mb-4">
              <section.icon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            </div>
            
            <div className="space-y-4">
              {section.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  
                  <div className="ml-4">
                    {setting.type === 'toggle' && (
                      <button
                        onClick={() => handleSettingChange(setting.key, !settings[setting.key as keyof typeof settings])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[setting.key as keyof typeof settings] ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[setting.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                    
                    {setting.type === 'select' && (
                      <select
                        value={String(settings[setting.key as keyof typeof settings])}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="input-field w-32"
                      >
                        {setting.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn-primary inline-flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </button>
      </div>

      {/* Advanced Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Configuration
            </label>
            <textarea
              className="input-field h-24"
              placeholder="Enter your API configuration..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom CSS
            </label>
            <textarea
              className="input-field h-24"
              placeholder="Enter custom CSS styles..."
            />
          </div>
        </div>
      </div>
    </div>
  )
} 