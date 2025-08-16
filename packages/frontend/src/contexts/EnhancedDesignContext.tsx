/**
 * Enhanced Design Context using the new shared model
 * Provides real-time synchronization and bidirectional data flow
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { 
  CTRLProject, 
  UIComponent, 
  LogicNode, 
  LogicConnection, 
  Screen, 
  SyncEvent,
  ModelSyncEngine,
  ComponentType,
  Position,
  Size
} from 'shared'
import SyncManager, { SyncManagerConfig } from '../services/syncManager'

interface EnhancedDesignContextType {
  // Project state
  project: CTRLProject | null
  isConnected: boolean
  activeUsers: Array<{ id: string; mode: string; lastActivity: string }>
  
  // Current selections
  activeScreen: string | null
  selectedComponent: UIComponent | null
  selectedLogicNode: LogicNode | null
  
  // Canvas state
  zoom: number
  pan: Position
  
  // Project operations
  loadProject: (projectId: string) => Promise<void>
  saveProject: () => Promise<void>
  exportProject: (format: 'json' | 'zip' | 'code') => Promise<void>
  
  // Screen operations
  createScreen: (name: string, type: 'page' | 'modal' | 'popup') => Screen
  updateScreen: (screenId: string, updates: Partial<Screen>) => void
  deleteScreen: (screenId: string) => void
  setActiveScreen: (screenId: string) => void
  
  // Component operations
  createComponent: (type: ComponentType, position: Position, screenId?: string) => UIComponent
  updateComponent: (componentId: string, updates: Partial<UIComponent>) => void
  deleteComponent: (componentId: string) => void
  selectComponent: (componentId: string | null) => void
  duplicateComponent: (componentId: string) => UIComponent | null
  
  // Logic operations
  createLogicNode: (type: string, position: Position) => LogicNode
  updateLogicNode: (nodeId: string, updates: Partial<LogicNode>) => void
  deleteLogicNode: (nodeId: string) => void
  createConnection: (fromId: string, toId: string) => LogicConnection
  deleteConnection: (connectionId: string) => void
  
  // Canvas operations
  setZoom: (zoom: number) => void
  setPan: (pan: Position) => void
  resetView: () => void
  
  // Real-time operations
  switchMode: (mode: 'design' | 'logic' | 'code') => void
  broadcastCursor: (position: Position, elementId?: string) => void
  
  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  
  // AI integration
  generateComponent: (prompt: string) => Promise<UIComponent | null>
  generateLayout: (prompt: string, screenId: string) => Promise<UIComponent[]>
  optimizeDesign: (componentId: string) => Promise<Partial<UIComponent>>
}

const EnhancedDesignContext = createContext<EnhancedDesignContextType | undefined>(undefined)

interface Props {
  children: ReactNode
  projectId?: string
  userId?: string
}

export function EnhancedDesignProvider({ children, projectId, userId }: Props) {
  // Core state
  const [project, setProject] = useState<CTRLProject | null>(null)
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // UI state
  const [activeScreen, setActiveScreen] = useState<string | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<UIComponent | null>(null)
  const [selectedLogicNode, setSelectedLogicNode] = useState<LogicNode | null>(null)
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; mode: string; lastActivity: string }>>([])
  
  // Canvas state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Position>({ x: 0, y: 0, unit: 'px' })
  
  // History for undo/redo
  const [undoStack, setUndoStack] = useState<CTRLProject[]>([])
  const [redoStack, setRedoStack] = useState<CTRLProject[]>([])
  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  // Initialize sync manager
  useEffect(() => {
    if (!projectId || !userId) return

    const config: SyncManagerConfig = {
      serverUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001',
      projectId,
      userId,
      onProjectUpdate: (updatedProject) => {
        setProject(updatedProject)
        // Set initial active screen
        if (updatedProject.screens.length > 0 && !activeScreen) {
          setActiveScreen(updatedProject.screens[0].id)
        }
      },
      onError: (error) => {
        console.error('Sync error:', error)
      },
      onConnectionChange: (connected) => {
        setIsConnected(connected)
      },
      onUserJoin: (user) => {
        console.log('User joined:', user)
      },
      onUserLeave: (user) => {
        console.log('User left:', user)
      },
      onActiveUsersUpdate: (users) => {
        setActiveUsers(users)
      },
      onCursorUpdate: (data) => {
        console.log('Remote cursor update:', data)
      }
    }

    const manager = new SyncManager(config)
    setSyncManager(manager)

    return () => {
      manager.disconnect()
    }
  }, [projectId, userId])

  // Removed old socket-based methods - now handled by SyncManager

  const pushToHistory = useCallback(() => {
    if (!project) return
    
    setUndoStack(prev => {
      const newStack = [...prev, JSON.parse(JSON.stringify(project))]
      return newStack.length > 50 ? newStack.slice(-50) : newStack
    })
    setRedoStack([])
  }, [project])

  // Project operations
  const loadProject = async (id: string): Promise<void> => {
    try {
      // Project will be loaded via WebSocket when joining
      console.log(`Loading project ${id}`)
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }

  const saveProject = async (): Promise<void> => {
    if (!syncManager) return
    
    try {
      await syncManager.saveProject()
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const exportProject = async (format: 'json' | 'zip' | 'code'): Promise<void> => {
    if (!syncManager) return
    
    try {
      await syncManager.exportProject(format)
    } catch (error) {
      console.error('Error exporting project:', error)
    }
  }

  // Screen operations
  const createScreen = (name: string, type: 'page' | 'modal' | 'popup'): Screen => {
    if (!syncManager) throw new Error('Sync manager not initialized')
    
    pushToHistory()
    
    const screen: Screen = {
      id: generateId(),
      name,
      type,
      size: { width: 1920, height: 1080, unit: 'px' },
      componentIds: [],
      screenLogic: {
        variables: []
      },
      transitions: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
    
    const syncEngine = syncManager.getSyncEngine()
    if (syncEngine) {
      const updatedProject = { ...syncEngine.getProject() }
      updatedProject.screens.push(screen)
      updatedProject.modified = new Date().toISOString()
      
      syncEngine.updateProject(updatedProject)
      syncManager.syncDesignChange('create', { type: 'screen', data: screen })
    }
    
    return screen
  }

  const updateScreen = (screenId: string, updates: Partial<Screen>): void => {
    if (!syncManager) return
    
    pushToHistory()
    
    const syncEngine = syncManager.getSyncEngine()
    if (syncEngine) {
      const updatedProject = { ...syncEngine.getProject() }
      const screenIndex = updatedProject.screens.findIndex(s => s.id === screenId)
      
      if (screenIndex !== -1) {
        updatedProject.screens[screenIndex] = {
          ...updatedProject.screens[screenIndex],
          ...updates,
          modified: new Date().toISOString()
        }
        
        syncEngine.updateProject(updatedProject)
        syncManager.syncDesignChange('update', { type: 'screen', id: screenId, updates })
      }
    }
  }

  const deleteScreen = (screenId: string): void => {
    if (!syncEngine) return
    
    pushToHistory()
    
    const updatedProject = { ...syncEngine.getProject() }
    updatedProject.screens = updatedProject.screens.filter(s => s.id !== screenId)
    
    // Also remove components that belong to this screen
    updatedProject.components = updatedProject.components.filter(c => c.screenId !== screenId)
    
    syncEngine.updateProject(updatedProject)
    syncEngine.syncFromDesign('delete', { type: 'screen', id: screenId })
    
    if (activeScreen === screenId) {
      setActiveScreen(updatedProject.screens[0]?.id || null)
    }
  }

  const setActiveScreenInternal = (screenId: string): void => {
    setActiveScreen(screenId)
  }

  // Component operations
  const createComponent = (type: ComponentType, position: Position, screenId?: string): UIComponent => {
    if (!syncEngine) throw new Error('Sync engine not initialized')
    
    pushToHistory()
    
    const component: UIComponent = {
      id: generateId(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      screenId: screenId || activeScreen || undefined,
      position,
      size: getDefaultSize(type),
      transform: {
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0
      },
      styling: getDefaultStyling(type),
      props: getDefaultProps(type),
      state: {},
      events: [],
      logicBindings: [],
      children: [],
      locked: false,
      visible: true,
      zIndex: 1,
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
    }
    
    const updatedProject = { ...syncEngine.getProject() }
    updatedProject.components.push(component)
    
    // Add to screen if specified
    if (component.screenId) {
      const screen = updatedProject.screens.find(s => s.id === component.screenId)
      if (screen) {
        screen.componentIds.push(component.id)
      }
    }
    
    syncEngine.updateProject(updatedProject)
    syncEngine.syncFromDesign('create', { type: 'component', data: component })
    
    return component
  }

  const updateComponent = (componentId: string, updates: Partial<UIComponent>): void => {
    if (!syncEngine) return
    
    pushToHistory()
    
    const updatedProject = { ...syncEngine.getProject() }
    const componentIndex = updatedProject.components.findIndex(c => c.id === componentId)
    
    if (componentIndex !== -1) {
      updatedProject.components[componentIndex] = {
        ...updatedProject.components[componentIndex],
        ...updates,
        modified: new Date().toISOString()
      }
      
      syncEngine.updateProject(updatedProject)
      syncEngine.syncFromDesign('update', { type: 'component', id: componentId, updates })
      
      // Update selected component if it's the one being updated
      if (selectedComponent?.id === componentId) {
        setSelectedComponent(updatedProject.components[componentIndex])
      }
    }
  }

  const deleteComponent = (componentId: string): void => {
    if (!syncEngine) return
    
    pushToHistory()
    
    const updatedProject = { ...syncEngine.getProject() }
    updatedProject.components = updatedProject.components.filter(c => c.id !== componentId)
    
    // Remove from all screens
    updatedProject.screens.forEach(screen => {
      screen.componentIds = screen.componentIds.filter(id => id !== componentId)
    })
    
    syncEngine.updateProject(updatedProject)
    syncEngine.syncFromDesign('delete', { type: 'component', id: componentId })
    
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null)
    }
  }

  const selectComponent = (componentId: string | null): void => {
    if (!componentId) {
      setSelectedComponent(null)
      return
    }
    
    const component = project?.components.find(c => c.id === componentId)
    setSelectedComponent(component || null)
  }

  const duplicateComponent = (componentId: string): UIComponent | null => {
    if (!syncEngine) return null
    
    const component = project?.components.find(c => c.id === componentId)
    if (!component) return null
    
    const duplicatedComponent = createComponent(
      component.type,
      { 
        x: component.position.x + 20, 
        y: component.position.y + 20, 
        unit: component.position.unit 
      },
      component.screenId
    )
    
    // Copy properties
    updateComponent(duplicatedComponent.id, {
      name: `${component.name} Copy`,
      size: component.size,
      styling: component.styling,
      props: component.props
    })
    
    return duplicatedComponent
  }

  // Logic operations
  const createLogicNode = (type: string, position: Position): LogicNode => {
    if (!syncEngine) throw new Error('Sync engine not initialized')
    
    const node: LogicNode = {
      id: generateId(),
      type: type as any,
      name: `${type} Node`,
      position,
      size: { width: 200, height: 100, unit: 'px' },
      data: {},
      inputs: [],
      outputs: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
    
    const updatedProject = { ...syncEngine.getProject() }
    updatedProject.logicGraph.nodes.push(node)
    
    syncEngine.updateProject(updatedProject)
    syncEngine.syncFromLogic('create', 'node', node)
    
    return node
  }

  const updateLogicNode = (nodeId: string, updates: Partial<LogicNode>): void => {
    if (!syncEngine) return
    
    const updatedProject = { ...syncEngine.getProject() }
    const nodeIndex = updatedProject.logicGraph.nodes.findIndex(n => n.id === nodeId)
    
    if (nodeIndex !== -1) {
      updatedProject.logicGraph.nodes[nodeIndex] = {
        ...updatedProject.logicGraph.nodes[nodeIndex],
        ...updates,
        modified: new Date().toISOString()
      }
      
      syncEngine.updateProject(updatedProject)
      syncEngine.syncFromLogic('update', 'node', { id: nodeId, updates })
    }
  }

  const deleteLogicNode = (nodeId: string): void => {
    if (!syncEngine) return
    
    const updatedProject = { ...syncEngine.getProject() }
    updatedProject.logicGraph.nodes = updatedProject.logicGraph.nodes.filter(n => n.id !== nodeId)
    updatedProject.logicGraph.connections = updatedProject.logicGraph.connections.filter(
      c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
    )
    
    syncEngine.updateProject(updatedProject)
    syncEngine.syncFromLogic('delete', 'node', { id: nodeId })
  }

  const createConnection = (fromId: string, toId: string): LogicConnection => {
    if (!syncEngine) throw new Error('Sync engine not initialized')
    
    const connection: LogicConnection = {
      id: generateId(),
      fromNodeId: fromId,
      fromPortId: 'output',
      toNodeId: toId,
      toPortId: 'input',
      type: 'data',
      created: new Date().toISOString()
    }
    
    const updatedProject = { ...syncEngine.getProject() }
    updatedProject.logicGraph.connections.push(connection)
    
    syncEngine.updateProject(updatedProject)
    syncEngine.syncFromLogic('create', 'connection', connection)
    
    return connection
  }

  const deleteConnection = (connectionId: string): void => {
    if (!syncEngine) return
    
    const updatedProject = { ...syncEngine.getProject() }
    updatedProject.logicGraph.connections = updatedProject.logicGraph.connections.filter(c => c.id !== connectionId)
    
    syncEngine.updateProject(updatedProject)
    syncEngine.syncFromLogic('delete', 'connection', { id: connectionId })
  }

  // Canvas operations
  const resetView = (): void => {
    setZoom(1)
    setPan({ x: 0, y: 0, unit: 'px' })
  }

  // Real-time operations
  const switchMode = (mode: 'design' | 'logic' | 'code'): void => {
    if (!syncManager) return
    syncManager.switchMode(mode)
  }

  const broadcastCursor = (position: Position, elementId?: string): void => {
    if (!syncManager) return
    syncManager.broadcastCursor(position, elementId)
  }

  // Undo/Redo operations
  const undo = (): void => {
    if (!canUndo || !syncManager) return
    
    const syncEngine = syncManager.getSyncEngine()
    if (!syncEngine) return
    
    const currentProject = syncEngine.getProject()
    const previousProject = undoStack[undoStack.length - 1]
    
    setRedoStack(prev => [...prev, currentProject])
    setUndoStack(prev => prev.slice(0, -1))
    
    syncEngine.updateProject(previousProject)
    setProject(previousProject)
  }

  const redo = (): void => {
    if (!canRedo || !syncManager) return
    
    const syncEngine = syncManager.getSyncEngine()
    if (!syncEngine) return
    
    const currentProject = syncEngine.getProject()
    const nextProject = redoStack[redoStack.length - 1]
    
    setUndoStack(prev => [...prev, currentProject])
    setRedoStack(prev => prev.slice(0, -1))
    
    syncEngine.updateProject(nextProject)
    setProject(nextProject)
  }

  // AI operations
  const generateComponent = async (prompt: string): Promise<UIComponent | null> => {
    if (!syncManager) return null
    
    try {
      const response = await syncManager.sendAIRequest('generate-component', prompt, { activeScreen, project })
      if (response.type === 'component' && response.suggestion) {
        const component = createComponent(
          response.suggestion.type || 'container',
          { x: 100, y: 100, unit: 'px' }
        )
        return component
      }
      return null
    } catch (error) {
      console.error('AI component generation failed:', error)
      return null
    }
  }

  const generateLayout = async (prompt: string, screenId: string): Promise<UIComponent[]> => {
    if (!syncManager) return []
    
    try {
      const response = await syncManager.sendAIRequest('generate-layout', prompt, { screenId, project })
      // Process AI layout response
      return []
    } catch (error) {
      console.error('AI layout generation failed:', error)
      return []
    }
  }

  const optimizeDesign = async (componentId: string): Promise<Partial<UIComponent>> => {
    if (!syncManager) return {}
    
    try {
      const response = await syncManager.sendAIRequest('optimize-design', `Optimize component ${componentId}`, { componentId, project })
      return response.suggestion || {}
    } catch (error) {
      console.error('AI design optimization failed:', error)
      return {}
    }
  }

  // Helper functions
  const generateId = (): string => {
    return `ctrl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const getDefaultSize = (type: ComponentType): Size => {
    const defaults: Record<ComponentType, Size> = {
      container: { width: 200, height: 150, unit: 'px' },
      text: { width: 100, height: 30, unit: 'px' },
      button: { width: 120, height: 40, unit: 'px' },
      input: { width: 200, height: 40, unit: 'px' },
      image: { width: 150, height: 150, unit: 'px' },
      video: { width: 300, height: 200, unit: 'px' },
      list: { width: 250, height: 300, unit: 'px' },
      grid: { width: 300, height: 200, unit: 'px' },
      card: { width: 250, height: 150, unit: 'px' },
      modal: { width: 400, height: 300, unit: 'px' },
      dropdown: { width: 150, height: 40, unit: 'px' },
      tabs: { width: 300, height: 200, unit: 'px' },
      form: { width: 300, height: 400, unit: 'px' },
      table: { width: 400, height: 300, unit: 'px' },
      chart: { width: 350, height: 250, unit: 'px' },
      custom: { width: 150, height: 150, unit: 'px' }
    }
    return defaults[type] || defaults.custom
  }

  const getDefaultStyling = (type: ComponentType) => {
    return {
      backgroundColor: type === 'button' ? '#3b82f6' : '#ffffff',
      borderRadius: 4,
      border: '1px solid #d1d5db',
      padding: { top: 8, right: 12, bottom: 8, left: 12, unit: 'px' },
      margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' },
      opacity: 1,
      display: 'block' as const
    }
  }

  const getDefaultProps = (type: ComponentType) => {
    const defaults: Record<ComponentType, Record<string, any>> = {
      text: { content: 'Text content', fontSize: 14 },
      button: { text: 'Button', variant: 'primary' },
      input: { placeholder: 'Enter text...', type: 'text' },
      image: { src: '', alt: 'Image' },
      video: { src: '', controls: true },
      container: {},
      list: { items: [] },
      grid: { columns: 3 },
      card: { title: 'Card Title' },
      modal: { title: 'Modal', visible: false },
      dropdown: { options: [], placeholder: 'Select...' },
      tabs: { tabs: [{ label: 'Tab 1', content: '' }] },
      form: { fields: [] },
      table: { columns: [], data: [] },
      chart: { type: 'bar', data: [] },
      custom: {}
    }
    return defaults[type] || {}
  }

  const contextValue: EnhancedDesignContextType = {
    // Project state
    project,
    isConnected,
    activeUsers,
    
    // Current selections
    activeScreen,
    selectedComponent,
    selectedLogicNode,
    
    // Canvas state
    zoom,
    pan,
    
    // Project operations
    loadProject,
    saveProject,
    exportProject,
    
    // Screen operations
    createScreen,
    updateScreen,
    deleteScreen,
    setActiveScreen: setActiveScreenInternal,
    
    // Component operations
    createComponent,
    updateComponent,
    deleteComponent,
    selectComponent,
    duplicateComponent,
    
    // Logic operations
    createLogicNode,
    updateLogicNode,
    deleteLogicNode,
    createConnection,
    deleteConnection,
    
    // Canvas operations
    setZoom,
    setPan,
    resetView,
    
    // Real-time operations
    switchMode,
    broadcastCursor,
    
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    
    // AI integration
    generateComponent,
    generateLayout,
    optimizeDesign
  }

  return (
    <EnhancedDesignContext.Provider value={contextValue}>
      {children}
    </EnhancedDesignContext.Provider>
  )
}

export function useEnhancedDesign() {
  const context = useContext(EnhancedDesignContext)
  if (context === undefined) {
    throw new Error('useEnhancedDesign must be used within an EnhancedDesignProvider')
  }
  return context
}

export default EnhancedDesignContext
