import { Router } from 'express'

const router = Router()

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalUsers: 1234,
      activeUsers: 567,
      totalSessions: 8901,
      aiInteractions: 45678,
      systemUptime: 99.9,
      responseTime: 45,
      lastUpdated: new Date().toISOString()
    }
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    })
  }
})

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const activity = [
      {
        id: 1,
        type: 'user_login',
        user: 'john.doe',
        timestamp: new Date().toISOString(),
        details: 'User logged in successfully'
      },
      {
        id: 2,
        type: 'ai_query',
        user: 'jane.smith',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        details: 'AI query processed'
      },
      {
        id: 3,
        type: 'data_export',
        user: 'admin',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        details: 'Data export completed'
      }
    ]
    
    res.json({
      success: true,
      data: activity
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    })
  }
})

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const performance = {
      cpu: 45.2,
      memory: 67.8,
      disk: 23.1,
      network: 12.5,
      timestamp: new Date().toISOString()
    }
    
    res.json({
      success: true,
      data: performance
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics'
    })
  }
})

// Get AI usage analytics
router.get('/ai-analytics', async (req, res) => {
  try {
    const analytics = {
      totalQueries: 45678,
      successfulQueries: 44567,
      failedQueries: 1111,
      averageResponseTime: 1.2,
      popularModels: ['gpt-3.5-turbo', 'gpt-4'],
      dailyUsage: [
        { date: '2024-01-01', queries: 1234 },
        { date: '2024-01-02', queries: 1456 },
        { date: '2024-01-03', queries: 1678 }
      ]
    }
    
    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI analytics'
    })
  }
})

export default router 