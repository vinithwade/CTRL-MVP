/**
 * Sync Manager - Centralized real-time synchronization handler
 * Manages bidirectional data flow between Design, Logic, and Code modes
 */

import { io, Socket } from 'socket.io-client'
import { ModelSyncEngine, CTRLProject, SyncEvent, UIComponent, LogicNode, CodeFile } from 'shared'

export interface SyncManagerConfig {
  serverUrl: string
  projectId: string
  userId: string
  onProjectUpdate: (project: CTRLProject) => void
  onError: (error: string) => void
  onConnectionChange: (connected: boolean) => void
  onUserJoin: (user: { id: string; mode: string }) => void
  onUserLeave: (user: { id: string }) => void
  onActiveUsersUpdate: (users: Array<{ id: string; mode: string; lastActivity: string }>) => void
  onCursorUpdate: (data: { userId: string; position: { x: number; y: number }; mode: string; elementId?: string }) => void
}

export class SyncManager {
  private socket: Socket | null = null
  private syncEngine: ModelSyncEngine | null = null
  private config: SyncManagerConfig
  private isConnected = false
  private currentMode: 'design' | 'logic' | 'code' = 'design'
  private pendingChanges: SyncEvent[] = []
  private conflictQueue: Array<{ event: SyncEvent; resolution: 'accept' | 'reject' | 'merge' }> = []

  constructor(config: SyncManagerConfig) {
    this.config = config
    this.connect()
  }

  private connect(): void {
    this.socket = io(this.config.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('SyncManager: Connected to server')
      this.isConnected = true
      this.config.onConnectionChange(true)
      this.joinProject()
    })

    this.socket.on('disconnect', (reason) => {
      console.log('SyncManager: Disconnected from server:', reason)
      this.isConnected = false
      this.config.onConnectionChange(false)
    })

    this.socket.on('connect_error', (error) => {
      console.error('SyncManager: Connection error:', error)
      this.config.onError(`Connection failed: ${error.message}`)
    })

    // Project events
    this.socket.on('project-state', (project: CTRLProject) => {
      console.log('SyncManager: Received project state')
      this.initializeSyncEngine(project)
      this.config.onProjectUpdate(project)
      this.processPendingChanges()
    })

    this.socket.on('sync-event', (event: SyncEvent) => {
      this.handleRemoteSyncEvent(event)
    })

    // User collaboration events
    this.socket.on('user-joined', (data: { userId: string; mode: string }) => {
      console.log('SyncManager: User joined:', data)
      this.config.onUserJoin(data)
    })

    this.socket.on('user-left', (data: { userId: string }) => {
      console.log('SyncManager: User left:', data)
      this.config.onUserLeave(data)
    })

    this.socket.on('user-mode-changed', (data: { userId: string; mode: string }) => {
      console.log('SyncManager: User changed mode:', data)
    })

    this.socket.on('active-users', (users: Array<{ id: string; mode: string; lastActivity: string }>) => {
      this.config.onActiveUsersUpdate(users)
    })

    this.socket.on('user-cursor', (data: { userId: string; position: { x: number; y: number }; mode: string; elementId?: string }) => {
      this.config.onCursorUpdate(data)
    })

    // AI events
    this.socket.on('ai-response', (response: any) => {
      this.handleAIResponse(response)
    })

    this.socket.on('ai-error', (error: { message: string }) => {
      this.config.onError(`AI Error: ${error.message}`)
    })

    // Project management events
    this.socket.on('project-saved', (data: { timestamp: string }) => {
      console.log('SyncManager: Project saved at', data.timestamp)
    })

    this.socket.on('project-exported', (data: any) => {
      console.log('SyncManager: Project exported:', data.type)
      this.handleProjectExport(data)
    })

    this.socket.on('save-error', (error: { message: string }) => {
      this.config.onError(`Save failed: ${error.message}`)
    })

    this.socket.on('export-error', (error: { message: string }) => {
      this.config.onError(`Export failed: ${error.message}`)
    })

    // Error handling
    this.socket.on('error', (error: { message: string }) => {
      this.config.onError(error.message)
    })
  }

  private joinProject(): void {
    if (!this.socket) return

    this.socket.emit('join-project', {
      projectId: this.config.projectId,
      userId: this.config.userId,
      mode: this.currentMode
    })
  }

  private initializeSyncEngine(project: CTRLProject): void {
    this.syncEngine = new ModelSyncEngine(project)
    this.setupSyncEngineListeners()
  }

  private setupSyncEngineListeners(): void {
    if (!this.syncEngine) return

    // Listen to all sync events from the sync engine
    const eventTypes = [
      'component.create', 'component.update', 'component.delete',
      'logic.node.create', 'logic.node.update', 'logic.node.delete',
      'logic.connection.create', 'logic.connection.delete',
      'code.file.update', 'code.file.create', 'code.file.delete',
      'screen.create', 'screen.update', 'screen.delete',
      'project.settings.update'
    ]

    eventTypes.forEach(eventType => {
      this.syncEngine!.on(eventType as any, (event: SyncEvent) => {
        this.broadcastSyncEvent(event)
        // Update local project state
        this.config.onProjectUpdate(this.syncEngine!.getProject())
      })
    })
  }

  private handleRemoteSyncEvent(event: SyncEvent): void {
    if (!this.syncEngine) {
      // Queue the event if sync engine is not ready
      this.pendingChanges.push(event)
      return
    }

    // Check for conflicts
    if (this.hasConflict(event)) {
      this.conflictQueue.push({ event, resolution: 'accept' }) // Auto-resolve for now
      this.resolveConflicts()
      return
    }

    // Apply the remote change
    this.applyRemoteEvent(event)
    
    // Update local project state
    this.config.onProjectUpdate(this.syncEngine.getProject())
  }

  private hasConflict(event: SyncEvent): boolean {
    // Implement conflict detection logic
    // For now, we'll assume no conflicts and auto-merge
    return false
  }

  private resolveConflicts(): void {
    // Process conflict resolution queue
    while (this.conflictQueue.length > 0) {
      const conflict = this.conflictQueue.shift()!
      
      switch (conflict.resolution) {
        case 'accept':
          this.applyRemoteEvent(conflict.event)
          break
        case 'reject':
          // Ignore the remote event
          break
        case 'merge':
          this.mergeEvents(conflict.event)
          break
      }
    }
  }

  private applyRemoteEvent(event: SyncEvent): void {
    if (!this.syncEngine) return

    try {
      switch (event.type) {
        case 'component.create':
          this.handleRemoteComponentCreate(event.data)
          break
        case 'component.update':
          this.handleRemoteComponentUpdate(event.data)
          break
        case 'component.delete':
          this.handleRemoteComponentDelete(event.data)
          break
        case 'logic.node.create':
          this.handleRemoteLogicNodeCreate(event.data)
          break
        case 'logic.node.update':
          this.handleRemoteLogicNodeUpdate(event.data)
          break
        case 'logic.node.delete':
          this.handleRemoteLogicNodeDelete(event.data)
          break
        case 'logic.connection.create':
          this.handleRemoteConnectionCreate(event.data)
          break
        case 'logic.connection.delete':
          this.handleRemoteConnectionDelete(event.data)
          break
        case 'code.file.update':
          this.handleRemoteCodeFileUpdate(event.data)
          break
        case 'code.file.create':
          this.handleRemoteCodeFileCreate(event.data)
          break
        case 'code.file.delete':
          this.handleRemoteCodeFileDelete(event.data)
          break
        default:
          console.warn('SyncManager: Unknown event type:', event.type)
      }
    } catch (error) {
      console.error('SyncManager: Error applying remote event:', error)
      this.config.onError(`Failed to apply remote change: ${error}`)
    }
  }

  private handleRemoteComponentCreate(data: { type: string; data: UIComponent }): void {
    const project = this.syncEngine!.getProject()
    project.components.push(data.data)
    this.syncEngine!.updateProject(project)
  }

  private handleRemoteComponentUpdate(data: { type: string; id: string; updates: Partial<UIComponent> }): void {
    const project = this.syncEngine!.getProject()
    const componentIndex = project.components.findIndex(c => c.id === data.id)
    if (componentIndex !== -1) {
      project.components[componentIndex] = {
        ...project.components[componentIndex],
        ...data.updates,
        modified: new Date().toISOString()
      }
      this.syncEngine!.updateProject(project)
    }
  }

  private handleRemoteComponentDelete(data: { type: string; id: string }): void {
    const project = this.syncEngine!.getProject()
    project.components = project.components.filter(c => c.id !== data.id)
    
    // Also remove from screens
    project.screens.forEach(screen => {
      screen.componentIds = screen.componentIds.filter(id => id !== data.id)
    })
    
    this.syncEngine!.updateProject(project)
  }

  private handleRemoteLogicNodeCreate(data: LogicNode): void {
    const project = this.syncEngine!.getProject()
    project.logicGraph.nodes.push(data)
    this.syncEngine!.updateProject(project)
  }

  private handleRemoteLogicNodeUpdate(data: { id: string; updates: Partial<LogicNode> }): void {
    const project = this.syncEngine!.getProject()
    const nodeIndex = project.logicGraph.nodes.findIndex(n => n.id === data.id)
    if (nodeIndex !== -1) {
      project.logicGraph.nodes[nodeIndex] = {
        ...project.logicGraph.nodes[nodeIndex],
        ...data.updates,
        modified: new Date().toISOString()
      }
      this.syncEngine!.updateProject(project)
    }
  }

  private handleRemoteLogicNodeDelete(data: { id: string }): void {
    const project = this.syncEngine!.getProject()
    project.logicGraph.nodes = project.logicGraph.nodes.filter(n => n.id !== data.id)
    project.logicGraph.connections = project.logicGraph.connections.filter(
      c => c.fromNodeId !== data.id && c.toNodeId !== data.id
    )
    this.syncEngine!.updateProject(project)
  }

  private handleRemoteConnectionCreate(data: any): void {
    const project = this.syncEngine!.getProject()
    project.logicGraph.connections.push(data)
    this.syncEngine!.updateProject(project)
  }

  private handleRemoteConnectionDelete(data: { id: string }): void {
    const project = this.syncEngine!.getProject()
    project.logicGraph.connections = project.logicGraph.connections.filter(c => c.id !== data.id)
    this.syncEngine!.updateProject(project)
  }

  private handleRemoteCodeFileUpdate(data: { path: string; content: string }): void {
    const project = this.syncEngine!.getProject()
    const file = project.codeModel.files.find(f => f.path === data.path)
    if (file) {
      file.content = data.content
      file.lastModified = new Date().toISOString()
      file.size = data.content.length
      file.lineCount = data.content.split('\n').length
      this.syncEngine!.updateProject(project)
    }
  }

  private handleRemoteCodeFileCreate(data: CodeFile): void {
    const project = this.syncEngine!.getProject()
    project.codeModel.files.push(data)
    this.syncEngine!.updateProject(project)
  }

  private handleRemoteCodeFileDelete(data: { path: string }): void {
    const project = this.syncEngine!.getProject()
    project.codeModel.files = project.codeModel.files.filter(f => f.path !== data.path)
    this.syncEngine!.updateProject(project)
  }

  private mergeEvents(event: SyncEvent): void {
    // Implement event merging logic for complex conflicts
    console.log('SyncManager: Merging event:', event)
    this.applyRemoteEvent(event)
  }

  private processPendingChanges(): void {
    while (this.pendingChanges.length > 0) {
      const event = this.pendingChanges.shift()!
      this.handleRemoteSyncEvent(event)
    }
  }

  private broadcastSyncEvent(event: SyncEvent): void {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('sync-event', event)
  }

  private handleAIResponse(response: any): void {
    console.log('SyncManager: AI response received:', response)
    // Handle AI responses based on type
    switch (response.type) {
      case 'component':
        if (response.suggestion && this.syncEngine) {
          // Create component from AI suggestion
          const project = this.syncEngine.getProject()
          const newComponent: UIComponent = {
            ...response.suggestion,
            id: this.generateId(),
            created: new Date().toISOString(),
            modified: new Date().toISOString()
          }
          project.components.push(newComponent)
          this.syncEngine.updateProject(project)
          this.config.onProjectUpdate(project)
        }
        break
      case 'logic':
        // Handle AI-generated logic
        break
      case 'code':
        // Handle AI-generated code
        break
    }
  }

  private handleProjectExport(data: any): void {
    // Handle project export completion
    switch (data.type) {
      case 'json':
        this.downloadFile(data.data, data.filename, 'application/json')
        break
      case 'zip':
        this.downloadFile(data.data, data.filename, 'application/zip')
        break
      case 'code':
        this.downloadCodeFiles(data.files)
        break
    }
  }

  private downloadFile(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private downloadCodeFiles(files: CodeFile[]): void {
    // Create a ZIP file with all code files
    // This would use a library like JSZip in a real implementation
    console.log('SyncManager: Downloading code files:', files.length)
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API methods

  public switchMode(mode: 'design' | 'logic' | 'code'): void {
    this.currentMode = mode
    if (this.socket && this.isConnected) {
      this.socket.emit('change-mode', { mode })
    }
  }

  public broadcastCursor(position: { x: number; y: number }, elementId?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('cursor-update', {
        position,
        mode: this.currentMode,
        elementId
      })
    }
  }

  public saveProject(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('save-project')
      
      const timeout = setTimeout(() => {
        reject(new Error('Save timeout'))
      }, 10000)

      this.socket.once('project-saved', () => {
        clearTimeout(timeout)
        resolve()
      })

      this.socket.once('save-error', (error) => {
        clearTimeout(timeout)
        reject(new Error(error.message))
      })
    })
  }

  public exportProject(format: 'json' | 'zip' | 'code'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('export-project', format)
      
      const timeout = setTimeout(() => {
        reject(new Error('Export timeout'))
      }, 30000)

      this.socket.once('project-exported', () => {
        clearTimeout(timeout)
        resolve()
      })

      this.socket.once('export-error', (error) => {
        clearTimeout(timeout)
        reject(new Error(error.message))
      })
    })
  }

  public sendAIRequest(type: string, prompt: string, context?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('ai-request', { type, prompt, context })
      
      const timeout = setTimeout(() => {
        reject(new Error('AI request timeout'))
      }, 30000)

      this.socket.once('ai-response', (response) => {
        clearTimeout(timeout)
        resolve(response)
      })

      this.socket.once('ai-error', (error) => {
        clearTimeout(timeout)
        reject(new Error(error.message))
      })
    })
  }

  public getSyncEngine(): ModelSyncEngine | null {
    return this.syncEngine
  }

  public isConnectedToServer(): boolean {
    return this.isConnected
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.syncEngine = null
  }

  // Sync from local changes
  public syncDesignChange(changeType: 'create' | 'update' | 'delete', data: any): void {
    if (this.syncEngine) {
      this.syncEngine.syncFromDesign(changeType, data)
    }
  }

  public syncLogicChange(changeType: 'create' | 'update' | 'delete', nodeType: 'node' | 'connection', data: any): void {
    if (this.syncEngine) {
      this.syncEngine.syncFromLogic(changeType, nodeType, data)
    }
  }

  public syncCodeChange(changeType: 'create' | 'update' | 'delete', data: any): void {
    if (this.syncEngine) {
      this.syncEngine.syncFromCode(changeType, data)
    }
  }
}

export default SyncManager
