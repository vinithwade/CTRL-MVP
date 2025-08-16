/**
 * Real-time Synchronization Service
 * Handles WebSocket connections and bidirectional synchronization between all modes
 */

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { ModelSyncEngine, CTRLProject, SyncEvent, SyncEventType } from 'shared'
import AIService from './aiService.js'

interface SocketUser {
  id: string
  projectId: string
  currentMode: 'design' | 'logic' | 'code'
  lastActivity: Date
}

export class SyncService {
  private io: SocketIOServer
  private connectedUsers: Map<string, SocketUser> = new Map()
  private projectSyncEngines: Map<string, ModelSyncEngine> = new Map()
  private roomProjects: Map<string, string> = new Map() // room -> projectId
  private aiService: AIService

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    })

    this.aiService = new AIService()
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`)

      // Handle user joining a project
      socket.on('join-project', async (data: { projectId: string; userId: string; mode: 'design' | 'logic' | 'code' }) => {
        try {
          const { projectId, userId, mode } = data
          const roomName = `project-${projectId}`

          // Leave previous room if any
          const previousRooms = Array.from(socket.rooms).filter(room => room.startsWith('project-'))
          previousRooms.forEach(room => socket.leave(room))

          // Join new room
          socket.join(roomName)
          this.roomProjects.set(socket.id, projectId)

          // Track user
          this.connectedUsers.set(socket.id, {
            id: userId,
            projectId,
            currentMode: mode,
            lastActivity: new Date()
          })

          // Initialize or get sync engine for project
          if (!this.projectSyncEngines.has(projectId)) {
            const project = await this.loadProject(projectId)
            if (project) {
              const syncEngine = new ModelSyncEngine(project)
              this.setupSyncEngineListeners(syncEngine, projectId)
              this.projectSyncEngines.set(projectId, syncEngine)
            }
          }

          // Send current project state to user
          const syncEngine = this.projectSyncEngines.get(projectId)
          if (syncEngine) {
            socket.emit('project-state', syncEngine.getProject())
          }

          // Notify other users in the room
          socket.to(roomName).emit('user-joined', {
            userId,
            mode,
            timestamp: new Date().toISOString()
          })

          // Send list of active users
          const activeUsers = this.getActiveUsersInProject(projectId)
          this.io.to(roomName).emit('active-users', activeUsers)

          console.log(`User ${userId} joined project ${projectId} in ${mode} mode`)
        } catch (error) {
          console.error('Error joining project:', error)
          socket.emit('error', { message: 'Failed to join project' })
        }
      })

      // Handle mode changes
      socket.on('change-mode', (data: { mode: 'design' | 'logic' | 'code' }) => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          user.currentMode = data.mode
          user.lastActivity = new Date()

          const roomName = `project-${user.projectId}`
          socket.to(roomName).emit('user-mode-changed', {
            userId: user.id,
            mode: data.mode,
            timestamp: new Date().toISOString()
          })
        }
      })

      // Handle sync events from clients
      socket.on('sync-event', (event: SyncEvent) => {
        this.handleSyncEvent(socket.id, event)
      })

      // Handle design mode changes
      socket.on('design-change', (data: { type: 'create' | 'update' | 'delete', payload: any }) => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          const syncEngine = this.projectSyncEngines.get(user.projectId)
          if (syncEngine) {
            syncEngine.syncFromDesign(data.type, data.payload)
          }
        }
      })

      // Handle logic mode changes
      socket.on('logic-change', (data: { type: 'create' | 'update' | 'delete', nodeType: 'node' | 'connection', payload: any }) => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          const syncEngine = this.projectSyncEngines.get(user.projectId)
          if (syncEngine) {
            syncEngine.syncFromLogic(data.type, data.nodeType, data.payload)
          }
        }
      })

      // Handle code mode changes
      socket.on('code-change', (data: { type: 'create' | 'update' | 'delete', payload: any }) => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          const syncEngine = this.projectSyncEngines.get(user.projectId)
          if (syncEngine) {
            syncEngine.syncFromCode(data.type, data.payload)
          }
        }
      })

      // Handle cursor/selection sharing
      socket.on('cursor-update', (data: { position: { x: number, y: number }, mode: string, elementId?: string }) => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          const roomName = `project-${user.projectId}`
          socket.to(roomName).emit('user-cursor', {
            userId: user.id,
            position: data.position,
            mode: data.mode,
            elementId: data.elementId,
            timestamp: new Date().toISOString()
          })
        }
      })

      // Handle AI assistance requests
      socket.on('ai-request', async (data: { type: string, prompt: string, context: any }) => {
        try {
          const user = this.connectedUsers.get(socket.id)
          if (user) {
            const response = await this.handleAIRequest(data, user.projectId)
            socket.emit('ai-response', response)
          }
        } catch (error) {
          console.error('AI request error:', error)
          socket.emit('ai-error', { message: 'AI request failed' })
        }
      })

      // Handle activity tracking
      socket.on('user-activity', () => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          user.lastActivity = new Date()
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket.id)
      })

      // Handle project save
      socket.on('save-project', async () => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          try {
            const syncEngine = this.projectSyncEngines.get(user.projectId)
            if (syncEngine) {
              await this.saveProject(user.projectId, syncEngine.getProject())
              socket.emit('project-saved', { timestamp: new Date().toISOString() })
            }
          } catch (error) {
            console.error('Save project error:', error)
            socket.emit('save-error', { message: 'Failed to save project' })
          }
        }
      })

      // Handle project export
      socket.on('export-project', async (format: 'json' | 'zip' | 'code') => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          try {
            const syncEngine = this.projectSyncEngines.get(user.projectId)
            if (syncEngine) {
              const exportData = await this.exportProject(syncEngine.getProject(), format)
              socket.emit('project-exported', exportData)
            }
          } catch (error) {
            console.error('Export project error:', error)
            socket.emit('export-error', { message: 'Failed to export project' })
          }
        }
      })
    })
  }

  private setupSyncEngineListeners(syncEngine: ModelSyncEngine, projectId: string): void {
    // Listen to all sync events and broadcast to room
    const eventTypes: SyncEventType[] = [
      'component.create', 'component.update', 'component.delete',
      'logic.node.create', 'logic.node.update', 'logic.node.delete',
      'logic.connection.create', 'logic.connection.delete',
      'code.file.update', 'code.file.create', 'code.file.delete',
      'screen.create', 'screen.update', 'screen.delete',
      'project.settings.update'
    ]

    eventTypes.forEach(eventType => {
      syncEngine.on(eventType, (event: SyncEvent) => {
        const roomName = `project-${projectId}`
        this.io.to(roomName).emit('sync-event', event)
      })
    })
  }

  private handleSyncEvent(socketId: string, event: SyncEvent): void {
    const user = this.connectedUsers.get(socketId)
    if (!user) return

    const syncEngine = this.projectSyncEngines.get(user.projectId)
    if (!syncEngine) return

    // Process the sync event
    // The sync engine will handle the event and emit appropriate updates
    
    // Broadcast to other users in the room (except sender)
    const roomName = `project-${user.projectId}`
    this.io.to(roomName).except(socketId).emit('sync-event', event)
  }

  private handleUserDisconnect(socketId: string): void {
    const user = this.connectedUsers.get(socketId)
    if (user) {
      const roomName = `project-${user.projectId}`
      
      // Notify other users
      this.io.to(roomName).emit('user-left', {
        userId: user.id,
        timestamp: new Date().toISOString()
      })

      // Update active users list
      this.connectedUsers.delete(socketId)
      const activeUsers = this.getActiveUsersInProject(user.projectId)
      this.io.to(roomName).emit('active-users', activeUsers)

      console.log(`User ${user.id} disconnected from project ${user.projectId}`)
    }

    this.roomProjects.delete(socketId)
  }

  private getActiveUsersInProject(projectId: string): Array<{ id: string, mode: string, lastActivity: string }> {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.projectId === projectId)
      .map(user => ({
        id: user.id,
        mode: user.currentMode,
        lastActivity: user.lastActivity.toISOString()
      }))
  }

  private async loadProject(projectId: string): Promise<CTRLProject | null> {
    try {
      // TODO: Implement actual database loading
      // For now, return a mock project
      const mockProject: CTRLProject = {
        id: projectId,
        name: 'New Project',
        description: 'A new CTRL project',
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: 'user',
        screens: [],
        components: [],
        logicGraph: {
          nodes: [],
          connections: [],
          variables: [],
          functions: []
        },
        codeModel: {
          files: [],
          entryPoint: 'src/main.tsx',
          buildConfig: {
            target: 'es2020',
            outputDir: 'dist',
            publicDir: 'public',
            assetsDir: 'assets',
            minify: true,
            sourcemap: true,
            externals: []
          },
          generatedAt: new Date().toISOString()
        },
        settings: {
          framework: 'react',
          language: 'typescript',
          styling: 'tailwind',
          bundler: 'vite',
          targetPlatform: 'web',
          aiAssistance: true,
          realTimeSync: true
        },
        dependencies: []
      }
      
      return mockProject
    } catch (error) {
      console.error('Error loading project:', error)
      return null
    }
  }

  private async saveProject(projectId: string, project: CTRLProject): Promise<void> {
    try {
      // TODO: Implement actual database saving
      console.log(`Saving project ${projectId}:`, project.name)
      
      // Update modified timestamp
      project.modified = new Date().toISOString()
      
      // Here you would save to your database (Supabase, MongoDB, etc.)
      // await database.projects.update(projectId, project)
      
    } catch (error) {
      console.error('Error saving project:', error)
      throw error
    }
  }

  private async exportProject(project: CTRLProject, format: 'json' | 'zip' | 'code'): Promise<any> {
    switch (format) {
      case 'json':
        return {
          type: 'json',
          data: JSON.stringify(project, null, 2),
          filename: `${project.name}.json`
        }
        
      case 'zip':
        // TODO: Implement ZIP export with all project files
        return {
          type: 'zip',
          data: 'base64-encoded-zip-data',
          filename: `${project.name}.zip`
        }
        
      case 'code':
        // Export only the generated code files
        return {
          type: 'code',
          files: project.codeModel.files,
          filename: `${project.name}-code.zip`
        }
        
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private async handleAIRequest(data: { type: string, prompt: string, context: any }, projectId: string): Promise<any> {
    try {
      const syncEngine = this.projectSyncEngines.get(projectId)
      if (!syncEngine) {
        throw new Error('Project not found')
      }

      const project = syncEngine.getProject()
      
      // Enhance context with project data
      const enhancedContext = {
        ...data.context,
        project,
        projectId
      }

      const aiRequest = {
        type: data.type,
        prompt: data.prompt,
        context: enhancedContext,
        userId: 'current-user', // TODO: Get from socket context
        projectId
      }

      const aiResponse = await this.aiService.processRequest(aiRequest)
      
      // Process AI response and update project if needed
      if (aiResponse.type === 'component' && aiResponse.suggestion) {
        // Auto-apply component suggestions if confidence is high
        if (aiResponse.confidence > 0.7) {
          const component = aiResponse.suggestion
          // Add component to project
          project.components.push({
            ...component,
            id: this.generateId(),
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            codeMetadata: {
              generatedComponents: [],
              customCode: {},
              dependencies: [],
              hooks: [],
              imports: [],
              lastSyncedAt: new Date().toISOString(),
              manuallyEdited: false,
              conflicts: []
            }
          })
          
          syncEngine.updateProject(project)
          
          // Broadcast the change
          const roomName = `project-${projectId}`
          this.io.to(roomName).emit('sync-event', {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: 'ai-assistant',
            type: 'component.create',
            data: component,
            affectedModes: ['design', 'logic', 'code']
          })
        }
      }

      return aiResponse
    } catch (error) {
      console.error('AI request processing failed:', error)
      throw error
    }
  }

  // Public methods for external use
  public async broadcastToProject(projectId: string, event: string, data: any): Promise<void> {
    const roomName = `project-${projectId}`
    this.io.to(roomName).emit(event, data)
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  public getProjectUserCount(projectId: string): number {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.projectId === projectId)
      .length
  }

  public async kickUserFromProject(userId: string, projectId: string): Promise<void> {
    const userSockets = Array.from(this.connectedUsers.entries())
      .filter(([_, user]) => user.id === userId && user.projectId === projectId)
      .map(([socketId, _]) => socketId)

    userSockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId)
      if (socket) {
        socket.emit('kicked-from-project', { projectId, reason: 'Removed by admin' })
        socket.disconnect()
      }
    })
  }

  public cleanup(): void {
    // Cleanup method for graceful shutdown
    this.connectedUsers.clear()
    this.projectSyncEngines.clear()
    this.roomProjects.clear()
    this.io.close()
  }
}

export default SyncService
