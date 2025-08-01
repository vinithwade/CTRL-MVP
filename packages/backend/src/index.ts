import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import routes
import aiRoutes from './routes/ai.js'
import userRoutes from './routes/users.js'
import dashboardRoutes from './routes/dashboard.js'
import settingsRoutes from './routes/settings.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['NODE_ENV']
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`)
  console.warn('Server will start with default values')
}

// Set default environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Logging middleware
app.use(morgan('combined'))

// Body parsing middleware with limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: any, buf: Buffer) => {
    try {
      JSON.parse(buf.toString())
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' })
      throw new Error('Invalid JSON')
    }
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Simple rate limiting
const rateLimit = new Map()
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100 // max 100 requests per window

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
  } else {
    const userData = rateLimit.get(ip)
    if (now > userData.resetTime) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    } else {
      userData.count++
      if (userData.count > maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later'
        })
        return
      }
    }
  }
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API Routes
app.use('/api/ai', aiRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/settings', settingsRoutes)

// WebSocket connection for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-room', (room) => {
    try {
      if (typeof room !== 'string' || room.trim().length === 0) {
        socket.emit('error', { message: 'Invalid room name' })
        return
      }
      socket.join(room)
      console.log(`Client ${socket.id} joined room: ${room}`)
      socket.emit('room-joined', { room })
    } catch (error) {
      console.error('Error joining room:', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  socket.on('ai-query', async (data) => {
    try {
      // Validate data
      if (!data || typeof data !== 'object') {
        socket.emit('ai-error', { error: 'Invalid data format' })
        return
      }

      // Handle AI queries in real-time
      const response = await processAIQuery(data)
      socket.emit('ai-response', response)
    } catch (error) {
      console.error('AI query error:', error)
      socket.emit('ai-error', { 
        error: 'Failed to process AI query',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason)
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5001

const serverInstance = server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  serverInstance.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  serverInstance.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  serverInstance.close(() => {
    console.log('Server closed due to uncaught exception')
    process.exit(1)
  })
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  serverInstance.close(() => {
    console.log('Server closed due to unhandled rejection')
    process.exit(1)
  })
})

// AI query processing function
async function processAIQuery(data: any) {
  // This would integrate with your AI service (OpenAI, etc.)
  return {
    id: Date.now().toString(),
    response: `AI processed: ${data.query}`,
    timestamp: new Date().toISOString()
  }
}

export default app 