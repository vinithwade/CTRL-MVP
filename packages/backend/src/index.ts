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

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

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
    socket.join(room)
    console.log(`Client ${socket.id} joined room: ${room}`)
  })

  socket.on('ai-query', async (data) => {
    try {
      // Handle AI queries in real-time
      const response = await processAIQuery(data)
      socket.emit('ai-response', response)
    } catch (error) {
      socket.emit('ai-error', { error: 'Failed to process AI query' })
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5001

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
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