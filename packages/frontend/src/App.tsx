import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { AIPage } from '@/pages/AIPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DesignMode } from '@/pages/DesignMode'
import { LogicMode } from '@/pages/LogicMode'
import { CodeMode } from '@/pages/CodeMode'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { DesignProvider } from '@/contexts/DesignContext'
import { UserDashboardPage } from '@/pages/UserDashboardPage'
import { ProfilePage } from '@/pages/ProfilePage'

function DesignModeWithProject() {
  const { projectId } = useParams()
  return <DesignMode projectId={projectId} />
}

function AppContent() {
  return (
    <Routes>
      {/* CTRL Mode Routes */}
      <Route path="/design" element={<DesignMode />} />
      <Route path="/logic" element={<LogicMode />} />
      <Route path="/code" element={<CodeMode />} />
      <Route path="/design/:projectId" element={<DesignModeWithProject />} />
      {/* Main App Routes with Layout */}
      <Route path="/" element={
        <Layout>
          <HomePage />
        </Layout>
      } />
      <Route path="/ai" element={
        <Layout>
          <AIPage />
        </Layout>
      } />
      <Route path="/dashboard" element={
        <Layout>
          <DashboardPage />
        </Layout>
      } />
      <Route path="/user-dashboard" element={
        <Layout>
          <UserDashboardPage />
        </Layout>
      } />
      <Route path="/profile" element={
        <Layout>
          <ProfilePage />
        </Layout>
      } />
      <Route path="/settings" element={
        <Layout>
          <SettingsPage />
        </Layout>
      } />
      {/* Fallback route */}
      <Route path="*" element={
        <Layout>
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">CTRL MVP</h1>
            <p className="text-lg text-gray-600 mb-8">AI-Powered UI-to-Code Generator</p>
            <div className="space-y-4">
              <a href="/" className="block text-blue-600 hover:text-blue-800">Go to Home</a>
              <a href="/design" className="block text-blue-600 hover:text-blue-800">Open Design Mode</a>
              <a href="/logic" className="block text-blue-600 hover:text-blue-800">Open Logic Mode</a>
              <a href="/code" className="block text-blue-600 hover:text-blue-800">Open Code Mode</a>
            </div>
          </div>
        </Layout>
      } />
    </Routes>
  )
}

function App() {
  return (
    <NavigationProvider>
      <DesignProvider>
        <AppContent />
      </DesignProvider>
    </NavigationProvider>
  )
}

export default App 