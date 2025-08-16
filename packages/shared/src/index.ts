// CTRL Shared Model exports
export * from './types/SharedModel'
export { ModelSyncEngine } from './core/ModelSync'

// Common types
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt?: string
}

export interface AIResponse {
  id: string
  content: string
  confidence: number
  metadata: Record<string, any>
  timestamp: string
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  aiInteractions: number
  systemUptime: number
  responseTime: number
  lastUpdated: string
}

export interface Settings {
  notifications: {
    enabled: boolean
    email: boolean
    push: boolean
  }
  appearance: {
    theme: 'light' | 'dark'
    language: string
    timezone: string
  }
  ai: {
    enabled: boolean
    model: string
    maxTokens: number
  }
  data: {
    retention: number
    autoBackup: boolean
    encryption: boolean
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Validation schemas
export const userSchema = {
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  password: (password: string) => {
    return password.length >= 6
  },
  name: (name: string) => {
    return name.length >= 2
  }
}

// Utility functions
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString()
}

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString()
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Constants
export const API_ENDPOINTS = {
  AI: '/api/ai',
  USERS: '/api/users',
  DASHBOARD: '/api/dashboard',
  SETTINGS: '/api/settings'
} as const

export const AI_MODELS = {
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  GPT_4: 'gpt-4',
  SIMULATED: 'simulated'
} as const

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
} as const 