/**
 * Enhanced Router - Main routing system for the CTRL platform
 * Integrates Design, Logic, and Code modes with real-time synchronization
 */

import React from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { DesignProvider } from '../contexts/DesignContext'
import { NavigationProvider } from '../contexts/NavigationContext'
import { useAuth } from '../hooks/useAuth'

// Enhanced Mode Components
import { DesignMode } from '../pages/DesignMode'
import { LogicMode } from '../pages/LogicMode'
import { CodeMode } from '../pages/CodeMode'

// Other Components
import HomePage from '../pages/HomePage'
import DashboardPage from '../pages/DashboardPage'
import UserDashboardPage from '../pages/UserDashboardPageSimple'
import ProfilePage from '../pages/ProfilePage'
import SettingsPage from '../pages/SettingsPage'
import AIPage from '../pages/AIPage'

// Layout Components
import Layout from '../components/Layout'
import { AuthModal } from '../components/AuthModal'

// Design Mode Wrapper to pass projectId from URL
function DesignModeWrapper() {
  const { projectId } = useParams<{ projectId: string }>()
  return <DesignMode projectId={projectId} />
}

// Logic Mode Wrapper to pass projectId from URL
function LogicModeWrapper() {
  const { projectId } = useParams<{ projectId: string }>()
  return <LogicMode projectId={projectId} />
}

// Code Mode Wrapper to pass projectId from URL
function CodeModeWrapper() {
  const { projectId } = useParams<{ projectId: string }>()
  return <CodeMode projectId={projectId} />
}

interface ProjectWrapperProps {
  children: React.ReactNode
  mode: 'design' | 'logic' | 'code'
}

function ProjectWrapper({ children, mode }: ProjectWrapperProps) {
  const { projectId } = useParams<{ projectId: string }>()
  const { user, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // For development, allow access without authentication using a mock user
  const currentUser = user || { id: 'dev-user-123', email: 'dev@ctrl.com' }

  return (
    <NavigationProvider>
      <DesignProvider>
        {children}
      </DesignProvider>
    </NavigationProvider>
  )
}

function EnhancedRouter() {
  return (
    <Routes>
      {/* Test Route */}
      <Route path="/test" element={
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-4xl font-bold text-center">🎉 CTRL Platform is Working!</h1>
          <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Available Routes:</h2>
            <ul className="space-y-2">
              <li><a href="/" className="text-blue-600 hover:underline">→ Home Page</a></li>
              <li><a href="/design/test-project" className="text-blue-600 hover:underline">→ Enhanced Design Mode</a></li>
              <li><a href="/logic/test-project" className="text-blue-600 hover:underline">→ Enhanced Logic Mode</a></li>
              <li><a href="/code/test-project" className="text-blue-600 hover:underline">→ Enhanced Code Mode</a></li>
              <li><a href="/user-dashboard" className="text-blue-600 hover:underline">→ User Dashboard</a></li>
            </ul>
          </div>
        </div>
      } />
      
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      
      {/* Full-Screen Modes (no header/footer) */}
      <Route 
        path="/design/:projectId" 
        element={
          <ProjectWrapper mode="design">
            <DesignModeWrapper />
          </ProjectWrapper>
        } 
      />
      <Route 
        path="/logic/:projectId" 
        element={
          <ProjectWrapper mode="logic">
            <LogicModeWrapper />
          </ProjectWrapper>
        } 
      />
      <Route 
        path="/code/:projectId" 
        element={
          <ProjectWrapper mode="code">
            <CodeModeWrapper />
          </ProjectWrapper>
        } 
      />
      
      {/* Protected Routes with Layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/user-dashboard" element={<UserDashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/ai" element={<AIPage />} />
        
        {/* Fallback routes for modes without project */}
        <Route path="/design" element={<Navigate to="/user-dashboard" replace />} />
        <Route path="/logic" element={<Navigate to="/user-dashboard" replace />} />
        <Route path="/code" element={<Navigate to="/user-dashboard" replace />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default EnhancedRouter
