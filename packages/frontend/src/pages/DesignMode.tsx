import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useNavigation } from '../contexts/NavigationContext'
import { useDesign, Component } from '../contexts/DesignContext'
import { ProjectService } from '@/services/projectService'
import { 
  Plus,
  Layers, 
  Square, 
  Circle,
  Type,
  Image,
  Container,
  Smartphone,
  Tablet,
  Monitor,
  Hand,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Move,
  RotateCcw,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Star as StarIcon,
  Pentagon,
  MessageSquare,
  StickyNote,
  Ruler,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  X,
  Layout,
  GitBranch,
  Code,
  MousePointer,
  Minus,
  ArrowRight
} from 'lucide-react'

interface DesignModeProps {
  projectId?: string
}

interface CanvasPosition {
  x: number
  y: number
}

interface CanvasState {
  zoom: number
  pan: CanvasPosition
  isDragging: boolean
  dragStart: CanvasPosition
}

const COMPONENT_LIBRARY = [
  { type: 'button', name: 'Button', icon: Square },
  { type: 'text', name: 'Text', icon: Type },
  { type: 'image', name: 'Image', icon: Image },
  { type: 'container', name: 'Container', icon: Container },
  { type: 'input', name: 'Input', icon: Square },
  { type: 'card', name: 'Card', icon: Square },
]

const SCREEN_PRESETS = [
  { name: 'iPhone 14', width: 393, height: 852, type: 'mobile' as const, icon: Smartphone },
  { name: 'iPad', width: 768, height: 1024, type: 'tablet' as const, icon: Tablet },
  { name: 'Desktop', width: 1440, height: 900, type: 'desktop' as const, icon: Monitor },
  { name: 'Custom', width: 400, height: 600, type: 'custom' as const, icon: Square },
]

export function DesignMode({ projectId }: DesignModeProps) {
  const { navigateToMode } = useNavigation()
  const { 
    screens, 
    addScreen, 
    updateScreen, 
    deleteScreen, 
    activeScreen, 
    setActiveScreen,
    addComponent, 
    updateComponent, 
    deleteComponent, 
    getComponentsByScreen,
    screenPositions,
    updateScreenPosition,
    loadDesignState
  } = useDesign()
  
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(['layer-1']))
  const [expandedComponentIds, setExpandedComponentIds] = useState<Set<string>>(new Set())
  const [layerDragPreview, setLayerDragPreview] = useState<{
    screenId: string
    targetId: string | null
    position: 'before' | 'after' | 'inside' | null
  } | null>(null)
  const [showScreenPresets, setShowScreenPresets] = useState(false)
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(false)
  const [rightSidebarVisible, setRightSidebarVisible] = useState(false)
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null)
  const [editingScreenName, setEditingScreenName] = useState<string>('')
  const [highlightedScreenId, setHighlightedScreenId] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const isCreatingDefaultScreen = useRef(false)
  
  // Canvas state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const pasteImageCounterRef = useRef(0)
  
  // Screen dragging state
  const [isDraggingScreen, setIsDraggingScreen] = useState(false)
  const [draggedScreenId, setDraggedScreenId] = useState<string | null>(null)
  const [screenDragStart, setScreenDragStart] = useState({ x: 0, y: 0 })
  const screenDragElementRef = useRef<HTMLElement | null>(null)
  const screenDragBasePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const screenDragLivePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const screenDragRafIdRef = useRef<number | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDraggingComponent, setIsDraggingComponent] = useState(false)
  const [draggedComponentType, setDraggedComponentType] = useState<string | null>(null)

  // Component dragging within a screen
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null)
  const [draggingComponentScreenId, setDraggingComponentScreenId] = useState<string | null>(null)
  const [componentDragOffset, setComponentDragOffset] = useState({ x: 0, y: 0 })
  const draggingElementRef = useRef<HTMLElement | null>(null)
  const draggingLivePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const draggingBasePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const rafIdRef = useRef<number | null>(null)
  // Cached metrics for fast drag computations
  const draggingScreenPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const draggingScreenBoundsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const draggingComponentSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  // Optional parent container metrics for nested dragging
  const draggingContainerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const draggingContainerBoundsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const draggingParentIdRef = useRef<string | null>(null)
  // On-canvas guides and measurement badge during drag
  const [dragGuides, setDragGuides] = useState<{
    screenId: string | null,
    offsetX: number,
    offsetY: number,
    v: number[],
    h: number[],
    badge: { x: number; y: number; text: string } | null
  }>({ screenId: null, offsetX: 0, offsetY: 0, v: [], h: [], badge: null })

  // Drawing throttling (for smoother/faster rectangle draw)
  const drawingRafIdRef = useRef<number | null>(null)
  const drawingPendingRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  // Tools (Figma-like): move/select, hand (pan), scale (zoom), shapes, media, frame and annotations
  type Tool =
    | 'select'
    | 'move'
    | 'hand'
    | 'scale'
    | 'rectangle'
    | 'ellipse'
    | 'line'
    | 'arrow'
    | 'polygon'
    | 'star'
    | 'text'
    | 'image'
    | 'frame'
    | 'comment'
    | 'annotation'
    | 'measurement'
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const previousToolRef = useRef<Tool | null>(null)
  const isSpacePressedRef = useRef(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingComponentId, setDrawingComponentId] = useState<string | null>(null)
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [drawingScreenId, setDrawingScreenId] = useState<string | null>(null)

  // Grid/snapping controls
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true)
  const [gridSize, setGridSize] = useState<number>(20)

  // Toolbar grouping dropdowns
  const [showCursorMenu, setShowCursorMenu] = useState(false)
  const [showShapesMenu, setShowShapesMenu] = useState(false)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const [showCommentsMenu, setShowCommentsMenu] = useState(false)
  const [showFrameMenu, setShowFrameMenu] = useState(false)
  const [componentSearchQuery, setComponentSearchQuery] = useState('')
  const [isSearchingComponents, setIsSearchingComponents] = useState(false)
  const [remoteComponentResults, setRemoteComponentResults] = useState<{ name: string; description?: string; link?: string }[]>([])
  const [remoteComponentPreviews, setRemoteComponentPreviews] = useState<Record<string, string>>({})
  const searchDebounceRef = useRef<number | null>(null)

  // Full screen canvas toggle
  const [isFullScreen, setIsFullScreen] = useState(false)
  const prevLeftSidebarRef = useRef<boolean>(true)
  const prevRightSidebarRef = useRef<boolean>(false)

  // Ensure only one dropdown is open at a time
  const closeAllMenus = useCallback(() => {
    setShowCursorMenu(false)
    setShowShapesMenu(false)
    setShowMediaMenu(false)
    setShowCommentsMenu(false)
    setShowFrameMenu(false)
  }, [])

  // Shortcut: V = Move/Select tool
  useEffect(() => {
    const onKeySelect = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = (target?.tagName || '').toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || target?.isContentEditable
      if (isTyping) return
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase()
        if (k === 'v') {
          setActiveTool('select')
          closeAllMenus()
        } else if (k === 'f') {
          setActiveTool('frame')
          // open only frame menu; close others
          closeAllMenus()
          setShowFrameMenu(true)
        }
      }
    }
    document.addEventListener('keydown', onKeySelect)
    return () => document.removeEventListener('keydown', onKeySelect)
  }, [closeAllMenus])

  // Remote component search (npm registry) - only when local library has no matches
  useEffect(() => {
    const q = componentSearchQuery.trim()
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)

    // Reset state if too short
    if (q.length < 2) {
      setRemoteComponentResults([])
      setIsSearchingComponents(false)
      return
    }

    // Check local library first
    const localMatches = COMPONENT_LIBRARY.filter(c =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.type.toLowerCase().includes(q.toLowerCase())
    )

    if (localMatches.length > 0) {
      // We have local results; don't hit the network
      setRemoteComponentResults([])
      setIsSearchingComponents(false)
      return
    }

    // No local results; fetch from npm registry
    setIsSearchingComponents(true)
    searchDebounceRef.current = window.setTimeout(async () => {
      try {
        const resp = await fetch(`https://registry.npmjs.org/-/v1/search?text=react%20component%20${encodeURIComponent(q)}&size=8`)
        const data = await resp.json().catch(() => ({ objects: [] }))
        const results = Array.isArray(data?.objects)
          ? data.objects.map((o: any) => ({
              name: o?.package?.name || 'Unknown',
              description: o?.package?.description || '',
              link: o?.package?.links?.npm || ''
            }))
          : []
        setRemoteComponentResults(results)
        // fetch basic preview images if available from unpkg README badges or repo social preview (best-effort)
        const previews: Record<string, string> = {}
        await Promise.all(results.slice(0, 4).map(async (r: { name: string }) => {
          try {
            const pkgReadme = await fetch(`https://unpkg.com/${r.name}/README.md`).then((res) => res.text()).catch(() => '')
            const m = pkgReadme.match(/!\[[^\]]*\]\((https?:[^)]+)\)/)
            if (m && m[1]) previews[r.name] = m[1]
          } catch {}
        }))
        setRemoteComponentPreviews(previews)
      } catch {
        setRemoteComponentResults([])
      } finally {
        setIsSearchingComponents(false)
      }
    }, 350)

    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [componentSearchQuery])

  const addExternalComponentToActiveScreen = useCallback((displayName: string, source?: { package?: string; link?: string }) => {
    if (!activeScreen) return
    const targetScreen = screens.find(s => s.id === activeScreen)
    if (!targetScreen) return
    const activeLayer = targetScreen.layers.find(l => l.id === targetScreen.activeLayer)
    const nextZ = activeLayer ? Math.max(0, ...activeLayer.components.map(c => c.zIndex || 0)) + 1 : 1
    const newComponent: Component = {
      id: `component-${Date.now()}`,
      type: 'external',
      name: displayName,
      props: { source: 'npm', package: source?.package, link: source?.link },
      position: { x: 24, y: 24 },
      size: { width: 160, height: 48 },
      backgroundColor: '#ffffff',
      zIndex: nextZ
    }
    // Add to active layer of screen
    const updatedLayers = targetScreen.layers.map(layer =>
      layer.id === targetScreen.activeLayer
        ? { ...layer, components: [...layer.components, newComponent] }
        : layer
    )
    updateScreen(targetScreen.id, { layers: updatedLayers })
    addComponent(newComponent)
    setSelectedComponentId(newComponent.id)
    setRightSidebarVisible(true)
  }, [activeScreen, screens, updateScreen, addComponent])

  // Resize state for components
  const [resizingComponentId, setResizingComponentId] = useState<string | null>(null)
  const [resizingScreenId, setResizingScreenId] = useState<string | null>(null)
  const resizeBaseRef = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })
  const resizeLiveRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const resizeRafIdRef = useRef<number | null>(null)

  // Helpers for cross-screen/component ordering (z-index across entire screen)
  const getCombinedComponents = useCallback((screen: typeof screens[number]) => {
    return screen.layers.flatMap(l => l.components)
  }, [])

  // Utility: deep update a component by id within screen layers (supports nested children)
  const deepUpdateComponentInScreen = useCallback((screenId: string, componentId: string, updates: Partial<Component>) => {
    const screen = screens.find(s => s.id === screenId)
    if (!screen) return

    const updateComponentsDeep = (components: Component[]): Component[] => {
      return components.map(existing => {
        const updatedSelf = existing.id === componentId ? { ...existing, ...updates } : existing
        if (existing.children && existing.children.length > 0) {
          const updatedChildren = updateComponentsDeep(existing.children)
          if (updatedChildren !== existing.children) {
            return { ...updatedSelf, children: updatedChildren }
          }
        }
        return updatedSelf
      })
    }

    const updatedLayers = screen.layers.map(layer => ({
      ...layer,
      components: updateComponentsDeep(layer.components)
    }))
    updateScreen(screenId, { layers: updatedLayers })
  }, [screens, updateScreen])

  // Utility: add child to a parent component by id (nested)
  const addChildComponentInScreen = useCallback((screenId: string, parentId: string, child: Component) => {
    const screen = screens.find(s => s.id === screenId)
    if (!screen) return
    const addChildDeep = (components: Component[]): Component[] => {
      return components.map(existing => {
        if (existing.id === parentId) {
          const nextChildren = [...(existing.children || []), child]
          return { ...existing, children: nextChildren }
        }
        if (existing.children && existing.children.length > 0) {
          return { ...existing, children: addChildDeep(existing.children) }
        }
        return existing
      })
    }
    const updatedLayers = screen.layers.map(layer => ({
      ...layer,
      components: addChildDeep(layer.components)
    }))
    updateScreen(screenId, { layers: updatedLayers })
  }, [screens, updateScreen])

  // Utility: find parent (top-level) of a component by id (one nesting level)
  const findParentInScreen = useCallback((screen: typeof screens[number], childId: string): Component | null => {
    for (const layer of screen.layers) {
      for (const comp of layer.components) {
        if (comp.children && comp.children.some(c => c.id === childId)) return comp
      }
    }
    return null
  }, [])

  const removeComponentFromScreen = useCallback((screen: typeof screens[number], componentId: string) => {
    return screen.layers.map(l => ({ ...l, components: l.components.filter(c => c.id !== componentId) }))
  }, [])

  const addComponentToLayer = useCallback((screen: typeof screens[number], component: Component, layerId?: string) => {
    const targetLayerId = layerId || screen.activeLayer
    return screen.layers.map(l => (
      l.id === targetLayerId ? { ...l, components: [...l.components, component] } : l
    ))
  }, [])

  const applyZOrder = useCallback((screen: typeof screens[number], orderedIds: string[]) => {
    const idToZ: Record<string, number> = {}
    const total = orderedIds.length
    orderedIds.forEach((id, idx) => { idToZ[id] = total - idx })
    return screen.layers.map(l => ({
      ...l,
      components: l.components.map(c => (c.id in idToZ ? { ...c, zIndex: idToZ[c.id] } : c))
    }))
  }, [])

  const updateComponentInScreen = useCallback((screenId: string, componentId: string, updates: Partial<Component>) => {
    const screen = screens.find(s => s.id === screenId)
    if (!screen) return
    const updatedLayers = screen.layers.map(layer => {
      const hasComponent = layer.components.some(c => c.id === componentId)
      if (!hasComponent) return layer
      return {
        ...layer,
        components: layer.components.map(c => (c.id === componentId ? { ...c, ...updates } : c))
      }
    })
    updateScreen(screenId, { layers: updatedLayers })
  }, [screens, updateScreen])

  // Find selected component live from screens to keep properties in sync
  const findComponentById = useCallback((componentId: string | null): { component: Component | null, screenId: string | null } => {
    if (!componentId) return { component: null, screenId: null }
    for (const scr of screens) {
      for (const layer of scr.layers) {
        const comp = layer.components.find(c => c.id === componentId)
        if (comp) return { component: comp, screenId: scr.id }
      }
    }
    return { component: null, screenId: null }
  }, [screens])

  const { component: selectedComponent, screenId: selectedComponentScreenId } = findComponentById(selectedComponentId)

  // Load design data for the project
  useEffect(() => {
    if (projectId) {
      console.log('Project changed, resetting initialization for:', projectId)
      setHasInitialized(false) // Reset initialization for new project
      isCreatingDefaultScreen.current = false // Reset creation flag
      loadDesignData()
    }
  }, [projectId])

  // Auto-create a default screen if none exist - DISABLED
  // Users will start with a clean canvas and add screens manually
  /*
  useEffect(() => {
    if (!isLoadingData && screens.length === 0 && !hasInitialized && projectId && !isCreatingDefaultScreen.current) {
      console.log('Auto-creating default screen for project:', projectId)
      isCreatingDefaultScreen.current = true
      // Add a default mobile screen to get users started
      handleAddDefaultScreen() // Create Main Page
      setLeftSidebarVisible(true) // Show sidebar when screens exist
      setHasInitialized(true) // Prevent creating multiple screens
    }
  }, [isLoadingData, screens.length, hasInitialized, projectId])
  */

  const loadDesignData = async () => {
    if (!projectId || isLoadingData) return
    
    setIsLoadingData(true)
    try {
      const designData = await ProjectService.getProjectData(projectId, 'design')
      if (designData?.data) {
        const data = designData.data
        // Hydrate screens/activeScreen
        if (data.screens && Array.isArray(data.screens)) {
          loadDesignState({ screens: data.screens, activeScreen: data.activeScreen || null })
        }
        // Restore selected component, zoom/pan, and positions
        if (data.selectedComponent) setSelectedComponentId(data.selectedComponent)
        if (typeof data.zoom === 'number') setZoom(data.zoom)
        if (data.pan && typeof data.pan.x === 'number' && typeof data.pan.y === 'number') setPan(data.pan)
        if (data.screenPositions && typeof data.screenPositions === 'object') {
          // Apply saved positions via updater
          Object.entries(data.screenPositions as Record<string, {x:number;y:number}>).forEach(([sid, pos]) => {
            updateScreenPosition(sid, pos)
          })
        }
      } else {
        // No design data found - start with empty canvas
        console.log('No design data found, starting with empty canvas')
      }
    } catch (error) {
      console.error('Error loading design data:', error)
      // If there's an error loading, start with empty canvas
      console.log('Error loading design data, starting with empty canvas')
    } finally {
      setIsLoadingData(false)
    }
  }



  const saveDesignData = async () => {
    if (!projectId || isLoadingData || isSaving) return
    
    setIsSaving(true)
    try {
      const designData = {
        screens,
        activeScreen,
        selectedComponent: selectedComponentId,
        zoom,
        pan,
        screenPositions,
        timestamp: Date.now()
      }
      await ProjectService.saveProjectData(projectId, 'design', designData)
      console.log('Design data saved successfully')
    } catch (error) {
      console.error('Error saving design data:', error)
    } finally {
        setIsSaving(false)
    }
  }

  // Undo/redo state for design
  type DesignSnapshot = {
    screens: typeof screens
    activeScreen: typeof activeScreen
    selectedComponentId: string | null
    zoom: number
    pan: { x: number; y: number }
    screenPositions: typeof screenPositions
  }
  const [undoStack, setUndoStack] = useState<DesignSnapshot[]>([])
  const [redoStack, setRedoStack] = useState<DesignSnapshot[]>([])

  const pushHistory = useCallback(() => {
    const snapshot: DesignSnapshot = {
      screens: JSON.parse(JSON.stringify(screens)),
      activeScreen,
      selectedComponentId,
      zoom,
      pan,
      screenPositions: JSON.parse(JSON.stringify(screenPositions))
    }
    setUndoStack(prev => {
      const next = [...prev, snapshot]
      return next.length > 50 ? next.slice(next.length - 50) : next
    })
    setRedoStack([])
  }, [screens, activeScreen, selectedComponentId, zoom, pan, screenPositions])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      const rest = prev.slice(0, -1)
      const current: DesignSnapshot = {
        screens: JSON.parse(JSON.stringify(screens)),
        activeScreen,
        selectedComponentId,
        zoom,
        pan,
        screenPositions: JSON.parse(JSON.stringify(screenPositions))
      }
      setRedoStack(r => [...r, current])
      loadDesignState({ screens: last.screens, activeScreen: last.activeScreen })
      setSelectedComponentId(last.selectedComponentId)
      setZoom(last.zoom)
      setPan(last.pan)
      // apply positions
      Object.entries(last.screenPositions).forEach(([sid, pos]) => updateScreenPosition(sid, pos as any))
      return rest
    })
  }, [screens, activeScreen, selectedComponentId, zoom, pan, screenPositions, loadDesignState, updateScreenPosition])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      const rest = prev.slice(0, -1)
      const current: DesignSnapshot = {
        screens: JSON.parse(JSON.stringify(screens)),
        activeScreen,
        selectedComponentId,
        zoom,
        pan,
        screenPositions: JSON.parse(JSON.stringify(screenPositions))
      }
      setUndoStack(u => [...u, current])
      loadDesignState({ screens: last.screens, activeScreen: last.activeScreen })
      setSelectedComponentId(last.selectedComponentId)
      setZoom(last.zoom)
      setPan(last.pan)
      Object.entries(last.screenPositions).forEach(([sid, pos]) => updateScreenPosition(sid, pos as any))
      return rest
    })
  }, [screens, activeScreen, selectedComponentId, zoom, pan, screenPositions, loadDesignState, updateScreenPosition])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey
      if (ctrlOrMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
      // Delete selected component with Delete/Backspace when not typing
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        const target = e.target as HTMLElement | null
        const tag = target?.tagName?.toLowerCase()
        const isTyping = tag === 'input' || tag === 'textarea' || target?.isContentEditable
        if (!isTyping) {
          e.preventDefault()
          deleteComponent(selectedComponentId)
          setSelectedComponentId(null)
          setRightSidebarVisible(false)
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [undo, redo, selectedComponentId, deleteComponent])

  // Auto-save design data every 30 seconds
  useEffect(() => {
    if (!projectId) return
    
      const autoSaveInterval = setInterval(() => {
      saveDesignData()
    }, 30000) // 30 seconds

      return () => clearInterval(autoSaveInterval)
  }, [projectId, screens, activeScreen, selectedComponentId, zoom, pan, screenPositions])

  // Save on page hide/unload to persist last changes
  useEffect(() => {
    if (!projectId) return
    const handler = () => saveDesignData()
    window.addEventListener('visibilitychange', handler)
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('visibilitychange', handler)
      window.removeEventListener('beforeunload', handler)
    }
  }, [projectId, saveDesignData])

    // Zoom and pan handlers
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      const node = el as HTMLElement | null
      return !!node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.isContentEditable)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enable temporary hand tool with space key
      if (e.code === 'Space' && !isTypingTarget(e.target) && !isPanning && !isDraggingScreen) {
        e.preventDefault()
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true
          if (activeTool !== 'hand') {
            previousToolRef.current = activeTool
            setActiveTool('hand')
          }
        }
        document.body.style.cursor = 'grab'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false
        document.body.style.cursor = 'default'
        if (previousToolRef.current && activeTool === 'hand') {
          setActiveTool(previousToolRef.current)
        }
        previousToolRef.current = null
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 3))
      } else {
        e.preventDefault()
        setPan(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }))
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Don't start panning if we're dragging a screen
      if (isDraggingScreen) return
      
      if (
        e.button === 1 ||
        (e.button === 0 && (e.altKey || activeTool === 'hand' || e.target === canvasRef.current))
      ) {
      e.preventDefault()
        setIsPanning(true)
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        document.body.style.cursor = 'grabbing'
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        e.preventDefault()
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        })
      }
    }

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false)
        document.body.style.cursor = 'default'
      }
    }

    const element = containerRef.current
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false })
      element.addEventListener('mousedown', handleMouseDown)
      element.addEventListener('mousemove', handleMouseMove)
      element.addEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel)
        element.removeEventListener('mousedown', handleMouseDown)
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseup', handleMouseUp)
      }
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPanning, pan.x, pan.y, panStart.x, panStart.y, isDraggingScreen, activeTool])

  // Component drag handlers
  const handleComponentMouseDown = (
    e: React.MouseEvent,
    component: Component,
    screenId: string
  ) => {
    // If a drawing tool is active, start drawing instead of selecting/moving the component
    if (!['select', 'move', 'hand', 'scale'].includes(activeTool)) {
      beginDrawOnScreen(e, screenId)
      return
    }

    e.stopPropagation()
    setActiveTool('select')
    setSelectedComponentId(component.id)
    setRightSidebarVisible(true)

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    // Mouse position in canvas coordinates
    const mouseX = (e.clientX - rect.left - pan.x) / zoom
    const mouseY = (e.clientY - rect.top - pan.y) / zoom

    const screenPos = screenPositions[screenId] || { x: 0, y: 0 }
    // Detect parent container from data model (no DOM metrics to avoid transform issues)
    draggingParentIdRef.current = null
    draggingContainerPosRef.current = { x: 0, y: 0 }
    draggingContainerBoundsRef.current = { width: 0, height: 0 }
    let containerOffsetX = 0
    let containerOffsetY = 0
    const screenData = screens.find(s => s.id === screenId)
    if (screenData) {
      // Find direct parent component whose children include this component
      let foundParent: Component | null = null
      for (const layer of screenData.layers) {
        for (const comp of layer.components) {
          if (comp.children && comp.children.some(ch => ch.id === component.id)) {
            foundParent = comp
            break
          }
        }
        if (foundParent) break
      }
      if (foundParent) {
        draggingParentIdRef.current = foundParent.id
        containerOffsetX = foundParent.position.x
        containerOffsetY = foundParent.position.y
        draggingContainerPosRef.current = { x: containerOffsetX, y: containerOffsetY }
        draggingContainerBoundsRef.current = { width: foundParent.size.width, height: foundParent.size.height }
      }
    }

    const offsetX = mouseX - (screenPos.x + containerOffsetX + component.position.x)
    const offsetY = mouseY - (screenPos.y + containerOffsetY + component.position.y)

    setDraggingComponentId(component.id)
    setDraggingComponentScreenId(screenId)
    setComponentDragOffset({ x: offsetX, y: offsetY })
    document.body.style.cursor = 'grabbing'

    draggingElementRef.current = e.currentTarget as HTMLElement
    if (draggingElementRef.current) {
      draggingElementRef.current.style.transition = 'none'
      draggingElementRef.current.style.willChange = 'transform'
    }
    // Improve responsiveness during drag
    document.body.style.userSelect = 'none'
    draggingBasePosRef.current = { x: component.position.x, y: component.position.y }
    draggingLivePosRef.current = { x: component.position.x, y: component.position.y }

    // Cache metrics to avoid heavy lookups during drag
    draggingScreenPosRef.current = { x: screenPos.x, y: screenPos.y }
    const currentScreen = screens.find(s => s.id === screenId)
    if (currentScreen) {
      draggingScreenBoundsRef.current = { width: currentScreen.width, height: currentScreen.height }
    } else {
      draggingScreenBoundsRef.current = { width: 0, height: 0 }
    }
    draggingComponentSizeRef.current = { width: component.size.width, height: component.size.height }
  }

  const handleComponentMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingComponentId || !draggingComponentScreenId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenPos = draggingScreenPosRef.current
    const bounds = draggingParentIdRef.current ? draggingContainerBoundsRef.current : draggingScreenBoundsRef.current
    const compSize = draggingComponentSizeRef.current
    const mouseX = (e.clientX - rect.left - pan.x) / zoom
    const mouseY = (e.clientY - rect.top - pan.y) / zoom

    const containerOffsetX = draggingParentIdRef.current ? draggingContainerPosRef.current.x : 0
    const containerOffsetY = draggingParentIdRef.current ? draggingContainerPosRef.current.y : 0

    let newX = mouseX - screenPos.x - containerOffsetX - componentDragOffset.x
    let newY = mouseY - screenPos.y - containerOffsetY - componentDragOffset.y

    if (bounds.width && bounds.height) {
      newX = Math.max(0, Math.min(newX, bounds.width - (compSize.width || 0)))
      newY = Math.max(0, Math.min(newY, bounds.height - (compSize.height || 0)))
    }

    // Compute pixel-snapping alignment guides (Figma-like)
    // Guides: center and edges relative to other components on the same screen
    const screen = screens.find(s => s.id === draggingComponentScreenId)
    const vGuides: number[] = []
    const hGuides: number[] = []
    let snappedX = newX
    let snappedY = newY
    const SNAP = 6 // px tolerance
    if (screen) {
      const withinSameContainer = (comp: Component): boolean => {
        const parentId = draggingParentIdRef.current
        if (!parentId) {
          // only top-level components
          // comp is top-level if it is directly in any layer (which all here are), and dragged component has no parent
          // Since we are iterating top-level comps, keep them
          return true
        }
        // include only direct children of the same parent
        const parent = screen.layers.flatMap(l => l.components).find(c => c.id === parentId)
        return !!parent && !!parent.children && parent.children.some(ch => ch.id === comp.id)
      }
      const topLevel = screen.layers.flatMap(l => l.components)
      const others = draggingParentIdRef.current
        ? (topLevel.find(c => c.id === draggingParentIdRef.current)?.children || [])
        : topLevel
      .filter(c => c.id !== draggingComponentId && withinSameContainer(c as Component)) as Component[]
      const cx = newX + (compSize.width || 0) / 2
      const cy = newY + (compSize.height || 0) / 2
      const edges = {
        left: newX,
        right: newX + (compSize.width || 0),
        top: newY,
        bottom: newY + (compSize.height || 0)
      }
      const showV: number[] = []
      const showH: number[] = []
      for (const other of others) {
        const ocx = other.position.x + other.size.width / 2
        const ocy = other.position.y + other.size.height / 2
        const oLeft = other.position.x
        const oRight = other.position.x + other.size.width
        const oTop = other.position.y
        const oBottom = other.position.y + other.size.height

        // vertical alignment: centers and left/right edges
        if (Math.abs(cx - ocx) <= SNAP) {
          snappedX = ocx - (compSize.width || 0) / 2
          showV.push(ocx)
        }
        if (Math.abs(edges.left - oLeft) <= SNAP) {
          snappedX = oLeft
          showV.push(oLeft)
        }
        if (Math.abs(edges.right - oRight) <= SNAP) {
          snappedX = oRight - (compSize.width || 0)
          showV.push(oRight)
        }

        // horizontal alignment: centers and top/bottom edges
        if (Math.abs(cy - ocy) <= SNAP) {
          snappedY = ocy - (compSize.height || 0) / 2
          showH.push(ocy)
        }
        if (Math.abs(edges.top - oTop) <= SNAP) {
          snappedY = oTop
          showH.push(oTop)
        }
        if (Math.abs(edges.bottom - oBottom) <= SNAP) {
          snappedY = oBottom - (compSize.height || 0)
          showH.push(oBottom)
        }
      }
      vGuides.push(...Array.from(new Set(showV)))
      hGuides.push(...Array.from(new Set(showH)))
    }

    // apply snapping if any
    if (vGuides.length > 0) newX = snappedX
    if (hGuides.length > 0) newY = snappedY
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize
      newY = Math.round(newY / gridSize) * gridSize
    }

    // Update guide overlay and measurement badge
    const badgeText = `${Math.round(newX)}, ${Math.round(newY)} • ${Math.round(compSize.width || 0)} × ${Math.round(compSize.height || 0)}`
    setDragGuides({
      screenId: draggingComponentScreenId,
      offsetX: draggingParentIdRef.current ? draggingContainerPosRef.current.x : 0,
      offsetY: draggingParentIdRef.current ? draggingContainerPosRef.current.y : 0,
      v: vGuides.map(x => x + (draggingParentIdRef.current ? draggingContainerPosRef.current.x : 0)),
      h: hGuides.map(y => y + (draggingParentIdRef.current ? draggingContainerPosRef.current.y : 0)),
      badge: { x: newX + (draggingParentIdRef.current ? draggingContainerPosRef.current.x : 0), y: newY - 16 + (draggingParentIdRef.current ? draggingContainerPosRef.current.y : 0), text: badgeText }
    })

    draggingLivePosRef.current = { x: newX, y: newY }
    if (rafIdRef.current == null) {
      rafIdRef.current = requestAnimationFrame(() => {
        const el = draggingElementRef.current
        if (el) {
          const dx = draggingLivePosRef.current.x - draggingBasePosRef.current.x
          const dy = draggingLivePosRef.current.y - draggingBasePosRef.current.y
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
        }
        rafIdRef.current = null
      })
    }
  }, [draggingComponentId, draggingComponentScreenId, canvasRef, pan.x, pan.y, zoom, componentDragOffset.x, componentDragOffset.y])

  const handleComponentMouseUp = useCallback(() => {
    if (draggingComponentId) {
      // Commit final position to React state
      if (draggingComponentScreenId) {
        updateComponentInScreen(
          draggingComponentScreenId,
          draggingComponentId,
          { position: { x: draggingLivePosRef.current.x, y: draggingLivePosRef.current.y } }
        )
      }

      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (draggingElementRef.current) {
        draggingElementRef.current.style.transition = ''
        draggingElementRef.current.style.willChange = ''
        draggingElementRef.current.style.transform = ''
      }
      draggingElementRef.current = null
      document.body.style.userSelect = 'auto'
      setDraggingComponentId(null)
      setDraggingComponentScreenId(null)
      setComponentDragOffset({ x: 0, y: 0 })
      document.body.style.cursor = 'default'
      setDragGuides({ screenId: null, offsetX: 0, offsetY: 0, v: [], h: [], badge: null })
    }
  }, [draggingComponentId, draggingComponentScreenId, updateComponentInScreen])

  useEffect(() => {
    if (draggingComponentId) {
      document.addEventListener('mousemove', handleComponentMouseMove)
      document.addEventListener('mouseup', handleComponentMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleComponentMouseMove)
        document.removeEventListener('mouseup', handleComponentMouseUp)
      }
    }
  }, [draggingComponentId, handleComponentMouseMove, handleComponentMouseUp])

  // Add default screen function for initial setup  
  const handleAddDefaultScreen = () => {
    console.log('Creating default screen, current screens:', screens.length)
    
    const screenPreset = SCREEN_PRESETS[0] // iPhone 14
    const now = Date.now()
    const bgLayerId = `layer-${now}-bg`
    const mainLayerId = `layer-${now}-main`
    const uiLayerId = `layer-${now}-ui`
    const screenId = `screen-${Date.now()}`
    
    const newScreen = {
      id: screenId,
      name: 'Main Page', // Default name for the main screen
      width: screenPreset.width,
      height: screenPreset.height,
      type: screenPreset.type,
      activeLayer: mainLayerId, // Set main layer as active
      layers: [
        {
          id: bgLayerId,
          name: 'Background',
          visible: true,
          locked: false,
          components: []
        },
        {
          id: mainLayerId,
          name: 'Main Layer',
          visible: true,
          locked: false,
          components: []
        },
        {
          id: uiLayerId,
          name: 'UI Layer',
          visible: true,
          locked: false,
          components: []
        }
      ]
    }
    
    addScreen(newScreen)
    // Position the default screen at a standard location
    updateScreenPosition(screenId, { x: 200, y: 100 })
    setActiveScreen(screenId)
    console.log('Default screen created and positioned')
  }

  // Add screen function
  const handleAddScreen = (preset?: typeof SCREEN_PRESETS[0]) => {
    const screenPreset = preset || SCREEN_PRESETS[0]
    const now = Date.now()
    const bgLayerId = `layer-${now}-bg`
    const mainLayerId = `layer-${now}-main`
    const uiLayerId = `layer-${now}-ui`
    const screenId = `screen-${Date.now()}`
    
    const newScreen = {
      id: screenId,
      name: `${screenPreset.name} ${screens.length + 1}`,
      width: screenPreset.width,
      height: screenPreset.height,
      type: screenPreset.type,
      layers: [
        {
          id: bgLayerId,
          name: 'Background',
        visible: true,
        locked: false,
        components: []
        },
        {
          id: mainLayerId,
          name: 'Main',
          visible: true,
          locked: false,
          components: []
        },
        {
          id: uiLayerId,
          name: 'UI',
          visible: true,
          locked: false,
          components: []
        }
      ],
      activeLayer: mainLayerId
    }
    
    // Calculate position for new screen (arrange them in a grid)
    const spacing = 100
    const screensPerRow = 3
    const row = Math.floor(screens.length / screensPerRow)
    const col = screens.length % screensPerRow
    const x = 200 + col * (screenPreset.width + spacing)
    const y = 100 + row * (screenPreset.height + spacing)
    
    addScreen(newScreen)
    updateScreenPosition(screenId, { x, y })
    setActiveScreen(screenId)
    setShowScreenPresets(false)
    // Open left sidebar once a screen exists
    setLeftSidebarVisible(true)
  }

      // Component drag and drop
  const handleComponentDragStart = (e: React.DragEvent, componentType: string, payload?: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'component',
      componentType: componentType,
      ...(payload || {})
    }))
    e.dataTransfer.effectAllowed = 'copy'
    setIsDraggingComponent(true)
    setDraggedComponentType(componentType)
  }

  const handleComponentDragEnd = () => {
    setIsDraggingComponent(false)
    setDraggedComponentType(null)
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

    const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type !== 'component' || !activeScreen) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      // Calculate the mouse position in canvas coordinates
      const canvasX = (e.clientX - rect.left - pan.x) / zoom
      const canvasY = (e.clientY - rect.top - pan.y) / zoom

      // Find which screen the component was dropped on
      let targetScreen = currentScreen
      let targetScreenPos = screenPositions[activeScreen || ''] || { x: 200, y: 100 }

      // Check if dropped on any other screen
      for (const screen of screens) {
        const screenPos = screenPositions[screen.id] || { x: 200, y: 100 }
        if (canvasX >= screenPos.x && canvasX <= screenPos.x + screen.width &&
            canvasY >= screenPos.y && canvasY <= screenPos.y + screen.height) {
          targetScreen = screen
          targetScreenPos = screenPos
          setActiveScreen(screen.id)
          break
        }
      }

      if (!targetScreen) return

      // Calculate position relative to the target screen
      const x = Math.max(0, Math.min(canvasX - targetScreenPos.x, targetScreen.width - 120))
      const y = Math.max(0, Math.min(canvasY - targetScreenPos.y, targetScreen.height - 40))

      console.log('Drop position:', { canvasX, canvasY, x, y, targetScreen: targetScreen.name })

      const activeLayer = targetScreen.layers.find(layer => layer.id === targetScreen.activeLayer)
      const nextZ = activeLayer ? Math.max(0, ...activeLayer.components.map(c => c.zIndex || 0)) + 1 : 1
      // Determine component type and default properties
      const droppedType = data.componentType || (data.packageName ? 'external' : 'rectangle')
      const newComponent: Component = {
        id: `component-${Date.now()}`,
        type: droppedType,
        name: `${droppedType.charAt(0).toUpperCase() + droppedType.slice(1)} ${Date.now()}`,
        props: droppedType === 'external' ? { source: 'npm', package: data.packageName, link: data.packageLink } : getDefaultProps(droppedType),
        position: { x, y },
        size: { width: 120, height: 40 },
        backgroundColor: droppedType === 'button' ? '#ef4444' : '#ffffff',
        zIndex: nextZ
      }

      // Add component to the target screen's active layer
      if (activeLayer) {
        // Update the screen with the new component in the active layer
        const updatedLayers = targetScreen.layers.map(layer => 
          layer.id === targetScreen.activeLayer 
            ? { ...layer, components: [...layer.components, newComponent] }
            : layer
        )
        updateScreen(targetScreen.id, { layers: updatedLayers })
      }
      
      // Also add to global components for compatibility
      addComponent(newComponent)
      setSelectedComponentId(newComponent.id)
      setRightSidebarVisible(true)
      setActiveTool('select')
    } catch (error) {
      console.error('Error parsing drop data:', error)
    }
    
      setIsDraggingComponent(false)
    setDraggedComponentType(null)
  }

  // Nested drop: drop a new palette component or move an existing component into a container component
  const handleNestedDrop = (e: React.DragEvent, screenId: string, parentId: string) => {
    e.preventDefault()
    try {
      const dataText = e.dataTransfer.getData('application/json')
      if (!dataText) return
      const data = JSON.parse(dataText)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return
      const canvasX = (e.clientX - canvasRect.left - pan.x) / zoom
      const canvasY = (e.clientY - canvasRect.top - pan.y) / zoom

      const screen = screens.find(s => s.id === screenId)
      if (!screen) return
      const screenPos = screenPositions[screenId] || { x: 200, y: 100 }
      // position relative to parent container
      const parentEl = document.getElementById(`comp-${parentId}`)
      if (!parentEl) return
      const parentRect = parentEl.getBoundingClientRect()
      const parentOffsetX = (parentRect.left - canvasRect.left - pan.x) / zoom
      const parentOffsetY = (parentRect.top - canvasRect.top - pan.y) / zoom

      const localX = canvasX - (screenPos.x + parentOffsetX)
      const localY = canvasY - (screenPos.y + parentOffsetY)

      if (data.kind === 'component') {
        // Move existing component into parent
        const { componentId: draggedId, screenId: fromScreenId } = data
        const fromScreen = screens.find(s => s.id === fromScreenId)
        const sourceComp = fromScreen?.layers.flatMap(l => l.components).find(c => c.id === draggedId)
        if (!sourceComp) return
        const child: Component = {
          ...sourceComp,
          position: { x: Math.max(0, localX), y: Math.max(0, localY) }
        }
        // Remove from top-level of source screen
        if (fromScreen) {
          const newSourceLayers = removeComponentFromScreen(fromScreen, draggedId)
          updateScreen(fromScreen.id, { layers: newSourceLayers })
        }
        // Add as child to parent in target screen
        addChildComponentInScreen(screenId, parentId, child)
        setSelectedComponentId(child.id)
        setRightSidebarVisible(true)
      } else if (data.type === 'component') {
        // Palette drop to nested parent
        const componentType = data.componentType
        const id = `component-${Date.now()}`
        const child: Component = {
          id,
          type: componentType,
          name: componentType.charAt(0).toUpperCase() + componentType.slice(1),
          props: getDefaultProps(componentType),
          position: { x: Math.max(0, localX), y: Math.max(0, localY) },
          size: { width: 120, height: 48 },
          backgroundColor: componentType === 'button' ? '#ef4444' : '#ffffff',
          zIndex: 1
        }
        addChildComponentInScreen(screenId, parentId, child)
        setSelectedComponentId(child.id)
        setRightSidebarVisible(true)
      }
    } catch {}
  }

  // Screen dragging functions
  const handleScreenMouseDown = (e: React.MouseEvent, screenId: string) => {
    // Only start dragging if clicking on screen header/title area
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('screen-header')) {
      return
    }
    
    e.stopPropagation()
    setIsDraggingScreen(true)
    setDraggedScreenId(screenId)
    screenDragElementRef.current = e.currentTarget as HTMLElement
    if (screenDragElementRef.current) {
      screenDragElementRef.current.style.willChange = 'transform'
      screenDragElementRef.current.style.transition = 'none'
    }
    document.body.style.userSelect = 'none'
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      const screenPos = screenPositions[screenId] || { x: 0, y: 0 }
      setScreenDragStart({
        x: mouseX - screenPos.x,
        y: mouseY - screenPos.y
      })
      screenDragBasePosRef.current = { x: screenPos.x, y: screenPos.y }
      screenDragLivePosRef.current = { x: screenPos.x, y: screenPos.y }
    }
    setActiveScreen(screenId)
  }

  const handleScreenMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingScreen && draggedScreenId) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
        const mouseX = (e.clientX - rect.left - pan.x) / zoom
        const mouseY = (e.clientY - rect.top - pan.y) / zoom
        const newX = mouseX - screenDragStart.x
        const newY = mouseY - screenDragStart.y
        
      screenDragLivePosRef.current = { x: newX, y: newY }
      if (screenDragRafIdRef.current == null) {
        screenDragRafIdRef.current = requestAnimationFrame(() => {
          const el = screenDragElementRef.current
          if (el) {
            const dx = screenDragLivePosRef.current.x - screenDragBasePosRef.current.x
            const dy = screenDragLivePosRef.current.y - screenDragBasePosRef.current.y
            el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
          }
          screenDragRafIdRef.current = null
        })
      }
    }
  }, [isDraggingScreen, draggedScreenId, pan.x, pan.y, zoom, screenDragStart])

  const handleScreenMouseUp = useCallback(() => {
    if (isDraggingScreen && draggedScreenId) {
      updateScreenPosition(draggedScreenId, {
        x: screenDragLivePosRef.current.x,
        y: screenDragLivePosRef.current.y
      })
    }
    if (screenDragRafIdRef.current != null) {
      cancelAnimationFrame(screenDragRafIdRef.current)
      screenDragRafIdRef.current = null
    }
    if (screenDragElementRef.current) {
      screenDragElementRef.current.style.transform = ''
      screenDragElementRef.current.style.transition = ''
      screenDragElementRef.current.style.willChange = ''
    }
    screenDragElementRef.current = null
    document.body.style.userSelect = 'auto'
    setIsDraggingScreen(false)
    setDraggedScreenId(null)
    setScreenDragStart({ x: 0, y: 0 })
  }, [isDraggingScreen, draggedScreenId, updateScreenPosition])

  // Add screen dragging event listeners
  useEffect(() => {
    if (isDraggingScreen) {
      document.addEventListener('mousemove', handleScreenMouseMove)
      document.addEventListener('mouseup', handleScreenMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleScreenMouseMove)
        document.removeEventListener('mouseup', handleScreenMouseUp)
      }
    }
  }, [isDraggingScreen, handleScreenMouseMove, handleScreenMouseUp])

  // Drawing on screen (rectangle/text)
  const beginDrawOnScreen = (e: React.MouseEvent, screenId: string) => {
    if (activeTool === 'select' || activeTool === 'move' || activeTool === 'hand' || activeTool === 'scale') return
    e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = (e.clientX - rect.left - pan.x) / zoom
    const mouseY = (e.clientY - rect.top - pan.y) / zoom
    const screenPos = screenPositions[screenId] || { x: 0, y: 0 }
    let startX = mouseX - screenPos.x
    let startY = mouseY - screenPos.y
    if (snapToGrid) {
      startX = Math.round(startX / gridSize) * gridSize
      startY = Math.round(startY / gridSize) * gridSize
    }

    const id = `component-${Date.now()}`
    const screen = screens.find(s => s.id === screenId)
    if (!screen) return
    const activeLayer = screen.layers.find(l => l.id === screen.activeLayer)
    const nextZ = activeLayer ? Math.max(0, ...activeLayer.components.map(c => c.zIndex || 0)) + 1 : 1
    const base: Component = {
      id,
      type:
        activeTool === 'text' ? 'text' :
        activeTool === 'ellipse' ? 'ellipse' :
        activeTool === 'line' ? 'line' :
        activeTool === 'arrow' ? 'arrow' :
        activeTool === 'polygon' ? 'polygon' :
        activeTool === 'star' ? 'star' :
        activeTool === 'image' ? 'image' :
        activeTool === 'frame' ? 'frame' :
        activeTool === 'comment' ? 'comment' :
        activeTool === 'annotation' ? 'annotation' :
        activeTool === 'measurement' ? 'measurement' :
        'container',
      name:
        activeTool === 'text' ? 'Text' :
        activeTool === 'ellipse' ? 'Ellipse' :
        activeTool === 'line' ? 'Line' :
        activeTool === 'arrow' ? 'Arrow' :
        activeTool === 'polygon' ? 'Polygon' :
        activeTool === 'star' ? 'Star' :
        activeTool === 'image' ? 'Image' :
        activeTool === 'frame' ? 'Frame' :
        activeTool === 'comment' ? 'Comment' :
        activeTool === 'annotation' ? 'Annotation' :
        activeTool === 'measurement' ? 'Measurement' :
        'Rectangle',
      props: activeTool === 'text'
        ? { text: 'Text', fontSize: 16, fontWeight: '500' }
        : activeTool === 'line' || activeTool === 'arrow' || activeTool === 'measurement'
        ? { lineColor: '#111827', thickness: 2 }
        : activeTool === 'polygon'
        ? { sides: 5, lineColor: '#111827', thickness: 1 }
        : activeTool === 'star'
        ? { points: 5, innerRatio: 0.5, lineColor: '#111827', thickness: 1 }
        : activeTool === 'image'
        ? { src: '', alt: 'Image', objectFit: 'cover' }
        : activeTool === 'frame'
        ? { platform: 'android', preset: 'custom' }
        : activeTool === 'comment'
        ? { text: 'Comment', color: '#111827' }
        : activeTool === 'annotation'
        ? { color: 'rgba(255, 214, 10, 0.25)', borderColor: '#f59e0b', borderWidth: 2 }
        : {},
      position: { x: startX, y: startY },
      size: { width: 1, height: 1 },
      backgroundColor: activeTool === 'text' ? 'transparent' : activeTool === 'frame' ? '#ffffff' : '#ffffff',
      zIndex: nextZ
    }

    // Add to screen's active layer
    const updatedLayers = screen.layers.map(layer =>
      layer.id === screen.activeLayer
        ? { ...layer, components: [...layer.components, base] }
        : layer
    )
    updateScreen(screenId, { layers: updatedLayers })
    setSelectedComponentId(base.id)
    setRightSidebarVisible(true)

    setIsDrawing(true)
    setDrawingComponentId(id)
    setDrawingStart({ x: startX, y: startY })
    setDrawingScreenId(screenId)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDrawing || !drawingComponentId || !drawingScreenId) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      const screenPos = screenPositions[drawingScreenId] || { x: 0, y: 0 }
      const x = mouseX - screenPos.x
      const y = mouseY - screenPos.y
      let newX = Math.min(drawingStart.x, x)
      let newY = Math.min(drawingStart.y, y)
      let newW = Math.abs(x - drawingStart.x)
      let newH = Math.abs(y - drawingStart.y)

      // Clamp to screen bounds
      const screen = screens.find(s => s.id === drawingScreenId)
      if (screen) {
        newX = Math.max(0, Math.min(newX, screen.width))
        newY = Math.max(0, Math.min(newY, screen.height))
        newW = Math.min(newW, screen.width - newX)
        newH = Math.min(newH, screen.height - newY)
      }

      // For line/arrow/measurement, constrain to axis-aligned with fixed thickness
      if (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'measurement') {
        const thickness = 2
        if (newW >= newH) {
          // horizontal
          newH = thickness
        } else {
          // vertical
          newW = thickness
        }
      }

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize
        newY = Math.round(newY / gridSize) * gridSize
        newW = Math.max(1, Math.round(newW / gridSize) * gridSize)
        newH = Math.max(1, Math.round(newH / gridSize) * gridSize)
      }

      // Batch DOM updates using requestAnimationFrame for faster drawing
      drawingPendingRef.current = { x: newX, y: newY, w: Math.max(1, newW), h: Math.max(1, newH) }
      if (drawingRafIdRef.current == null) {
        drawingRafIdRef.current = requestAnimationFrame(() => {
          const vals = drawingPendingRef.current
          drawingRafIdRef.current = null
          if (!vals) return
          const el = document.getElementById(`comp-${drawingComponentId}`) as HTMLElement | null
          if (el) {
            el.style.left = `${vals.x}px`
            el.style.top = `${vals.y}px`
            el.style.width = `${vals.w}px`
            el.style.height = `${vals.h}px`
          }
        })
      }
    }
    const onUp = () => {
      if (!isDrawing || !drawingComponentId || !drawingScreenId) return
      // Commit final size into state from DOM
      const el = document.getElementById(`comp-${drawingComponentId}`) as HTMLElement | null
      if (el) {
        const x = parseFloat(el.style.left || '0')
        const y = parseFloat(el.style.top || '0')
        // Fallback to existing component size instead of 1 if DOM width/height are empty
        const existingScreen = screens.find(s => s.id === drawingScreenId)
        const existingComp = existingScreen?.layers.flatMap(l => l.components).find(c => c.id === drawingComponentId)
        let w = parseFloat(el.style.width || '') || existingComp?.size.width || 1
        let h = parseFloat(el.style.height || '') || existingComp?.size.height || 1
        if (snapToGrid) {
          w = Math.max(1, Math.round(w / gridSize) * gridSize)
          h = Math.max(1, Math.round(h / gridSize) * gridSize)
        }
        updateComponentInScreen(drawingScreenId, drawingComponentId, {
          position: { x, y },
          size: { width: Math.max(1, w), height: Math.max(1, h) }
        })
      }
      // Clear any pending frame
      if (drawingRafIdRef.current != null) {
        cancelAnimationFrame(drawingRafIdRef.current)
        drawingRafIdRef.current = null
      }
      drawingPendingRef.current = null
      setIsDrawing(false)
      setDrawingComponentId(null)
      setDrawingScreenId(null)
      // Switch back to select tool like Figma
      setActiveTool('select')
    }
    if (isDrawing) {
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      return () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
    }
  }, [isDrawing, drawingComponentId, drawingScreenId, drawingStart.x, drawingStart.y, pan.x, pan.y, zoom, screenPositions, screens, updateComponentInScreen, activeTool, gridSize, snapToGrid])

  // Resize handlers (multi-side)
  type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  const resizingDirRef = useRef<ResizeDirection>('se')
  const resizeLiveBoxRef = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })
  const resizingElementRef = useRef<HTMLElement | null>(null)
  const resizeScreenPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const resizeScreenBoundsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })

  const handleResizeMouseDown = (e: React.MouseEvent, component: Component, screenId: string, dir: ResizeDirection = 'se') => {
    e.stopPropagation()
    setActiveTool('select')
    setSelectedComponentId(component.id)
    setRightSidebarVisible(true)
    setResizingComponentId(component.id)
    setResizingScreenId(screenId)
    resizingDirRef.current = dir
    resizeBaseRef.current = {
      x: component.position.x,
      y: component.position.y,
      width: component.size.width,
      height: component.size.height
    }
    resizeLiveBoxRef.current = { x: component.position.x, y: component.position.y, width: component.size.width, height: component.size.height }
    document.body.style.userSelect = 'none'
    // cache screen info and prepare element for fast updates
    const screenPos = screenPositions[screenId] || { x: 0, y: 0 }
    resizeScreenPosRef.current = { ...screenPos }
    const scr = screens.find(s => s.id === screenId)
    if (scr) resizeScreenBoundsRef.current = { width: scr.width, height: scr.height }
    const el = document.getElementById(`comp-${component.id}`) as HTMLElement | null
    resizingElementRef.current = el
    if (el) {
      el.style.transition = 'none'
      el.style.willChange = 'width, height, left, top'
    }
  }

  useEffect(() => {
    if (!resizingComponentId || !resizingScreenId) return
    const onMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const screenPos = resizeScreenPosRef.current
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      const base = resizeBaseRef.current
      const dir = resizingDirRef.current
      const minSize = 10
      let newX = base.x
      let newY = base.y
      let newW = base.width
      let newH = base.height

      if (dir.includes('e')) newW = Math.max(minSize, mouseX - screenPos.x - base.x)
      if (dir.includes('s')) newH = Math.max(minSize, mouseY - screenPos.y - base.y)
      if (dir.includes('w')) {
        const proposedX = mouseX - screenPos.x
        const maxX = base.x + base.width - minSize
        newX = Math.min(Math.max(0, proposedX), maxX)
        newW = base.width + (base.x - newX)
      }
      if (dir.includes('n')) {
        const proposedY = mouseY - screenPos.y
        const maxY = base.y + base.height - minSize
        newY = Math.min(Math.max(0, proposedY), maxY)
        newH = base.height + (base.y - newY)
      }

      const bounds = resizeScreenBoundsRef.current
      if (bounds.width && bounds.height) {
        if (dir.includes('e')) newW = Math.min(newW, bounds.width - base.x)
        if (dir.includes('s')) newH = Math.min(newH, bounds.height - base.y)
        if (dir.includes('w')) newX = Math.max(0, newX)
        if (dir.includes('n')) newY = Math.max(0, newY)
      }
      resizeLiveBoxRef.current = { x: newX, y: newY, width: newW, height: newH }
      if (resizeRafIdRef.current == null) {
        resizeRafIdRef.current = requestAnimationFrame(() => {
          const el = resizingElementRef.current
          if (el) {
            el.style.width = `${resizeLiveBoxRef.current.width}px`
            el.style.height = `${resizeLiveBoxRef.current.height}px`
            el.style.left = `${resizeLiveBoxRef.current.x}px`
            el.style.top = `${resizeLiveBoxRef.current.y}px`
          }
          resizeRafIdRef.current = null
        })
      }
    }
    const onUp = () => {
      if (resizeRafIdRef.current != null) {
        cancelAnimationFrame(resizeRafIdRef.current)
        resizeRafIdRef.current = null
      }
      const { x, y, width, height } = resizeLiveBoxRef.current
      updateComponentInScreen(resizingScreenId!, resizingComponentId!, {
        position: { x, y },
        size: { width, height }
      })
      if (resizingElementRef.current) {
        resizingElementRef.current.style.transition = ''
        resizingElementRef.current.style.willChange = ''
      }
      resizingElementRef.current = null
      setResizingComponentId(null)
      setResizingScreenId(null)
      document.body.style.userSelect = 'auto'
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [resizingComponentId, resizingScreenId, pan.x, pan.y, zoom, screenPositions, screens, updateComponentInScreen])

  const getDefaultProps = (type: string) => {
    switch (type) {
      case 'button':
        return { text: 'Button', variant: 'primary', color: '#ffffff' }
      case 'text':
        return { text: 'Text', fontSize: 16, fontWeight: 'normal' }
      case 'image':
        return { src: '', alt: 'Image' }
      case 'input':
        return { placeholder: 'Enter text', type: 'text' }
      case 'container':
        return { padding: 16, borderRadius: 8 }
      case 'card':
        return { padding: 16, shadow: true }
      case 'ellipse':
        return { }
      case 'line':
        return { lineColor: '#111827', thickness: 2 }
      case 'arrow':
        return { lineColor: '#111827', thickness: 2 }
      case 'measurement':
        return { lineColor: '#111827', thickness: 2 }
      case 'polygon':
        return { sides: 5, lineColor: '#111827', thickness: 1 }
      case 'star':
        return { points: 5, innerRatio: 0.5, lineColor: '#111827', thickness: 1 }
      case 'comment':
        return { text: 'Comment', color: '#111827' }
      case 'annotation':
        return { color: 'rgba(255, 214, 10, 0.25)', borderColor: '#f59e0b', borderWidth: 2 }
      default:
        return {}
    }
  }

  // Get current screen data
  const currentScreen = screens.find(s => s.id === activeScreen)

  // Toggle layer expansion
  const toggleLayerExpansion = (layerId: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        newSet.delete(layerId)
      } else {
        newSet.add(layerId)
      }
      return newSet
    })
  }

  // Color utilities for right sidebar color controls
  const getColorSpaceFromString = (val?: string): 'srgb' | 'p3' => {
    if (!val) return 'srgb'
    return /^color\(display-p3/i.test(val) ? 'p3' : 'srgb'
  }
  const parseHex = (hex?: string): { r: number; g: number; b: number } | null => {
    if (!hex) return null
    const h = hex.replace('#', '')
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16)
      const g = parseInt(h[1] + h[1], 16)
      const b = parseInt(h[2] + h[2], 16)
      return { r, g, b }
    }
    if (h.length === 6) {
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      return { r, g, b }
    }
    return null
  }
  const parseRgba = (css?: string): { r: number; g: number; b: number; a: number } | null => {
    if (!css) return null
    const m = css.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\)/i)
    if (!m) return null
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 }
  }
  const parseP3 = (css?: string): { r: number; g: number; b: number; a: number } | null => {
    if (!css) return null
    const m = css.match(/color\(display-p3\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)(?:\s*\/\s*([0-9]*\.?[0-9]+))?\)/i)
    if (!m) return null
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 }
  }
  const rgbToHex = (r: number, g: number, b: number) => {
    const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
    return `#${to(r)}${to(g)}${to(b)}`
  }
  const buildSrgbCss = (hex: string, alpha: number) => {
    const rgb = parseHex(hex) || { r: 255, g: 255, b: 255 }
    const a = Math.max(0, Math.min(1, alpha))
    return a < 1 ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})` : hex
  }
  const buildP3Css = (r01: number, g01: number, b01: number, a: number) => {
    const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
    return `color(display-p3 ${clamp01(r01)} ${clamp01(g01)} ${clamp01(b01)} / ${Math.max(0, Math.min(1, a))})`
  }

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setZoom(prev => Math.max(prev * 0.8, 0.1))
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="h-screen flex bg-gray-50 font-['Inter'] font-semibold">
      {/* Left Sidebar */}
      {leftSidebarVisible && !isFullScreen && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Link
                to="/user-dashboard"
                className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded"
                title="Back to User Dashboard"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="ml-1">Back</span>
              </Link>
            <h2 className="text-sm font-semibold text-gray-900">Design Tools</h2>
            </div>
            <button
              onClick={() => setLeftSidebarVisible(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pb-24">
            {/* Screens Section */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Screens</h3>
              <p className="text-xs text-gray-500 mb-3">Manage your app screens</p>
              
              <div className="relative mb-3">
                <button
                  onClick={() => setShowScreenPresets(!showScreenPresets)}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Add Screen</span>
                </button>
                
                {showScreenPresets && (
                  <div className="absolute left-0 top-12 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-full">
                    {SCREEN_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleAddScreen(preset)}
                        className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-100 text-left"
                      >
                        <preset.icon size={16} className="text-gray-600" />
                        <div className="flex-1">
                          <div className="text-sm text-gray-700">{preset.name}</div>
                          <div className="text-xs text-gray-500">{preset.width} × {preset.height}</div>
            </div>
                      </button>
                    ))}
            </div>
                )}
          </div>
              
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {screens.map((screen) => (
                  <div
                    key={screen.id}
                    className={`group p-3 rounded-lg transition-colors ${
                      activeScreen === screen.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div 
                      onClick={() => setActiveScreen(screen.id)}
                      onDoubleClick={() => {
                        setActiveScreen(screen.id)
                        setHighlightedScreenId(screen.id)
                        setTimeout(() => setHighlightedScreenId(prev => (prev === screen.id ? null : prev)), 800)
                      }}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Smartphone size={14} />
                        {editingScreenId === screen.id ? (
                          <input
                            autoFocus
                            className="text-sm font-medium truncate px-1 py-0.5 border border-blue-300 rounded outline-none"
                            value={editingScreenName}
                            onChange={(e) => setEditingScreenName(e.target.value)}
                            onBlur={() => {
                              const newName = editingScreenName.trim()
                              if (newName && newName !== screen.name) {
                                updateScreen(screen.id, { name: newName })
                              }
                              setEditingScreenId(null)
                              setEditingScreenName('')
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur()
                              } else if (e.key === 'Escape') {
                                setEditingScreenId(null)
                                setEditingScreenName('')
                              }
                            }}
                          />
                        ) : (
                          <span
                            className="text-sm font-medium truncate"
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              setEditingScreenId(screen.id)
                              setEditingScreenName(screen.name)
                            }}
                            title="Double-click to rename"
                          >
                            {screen.name}
                          </span>
                        )}
          </div>
                      {screens.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Delete screen "${screen.name}"?`)) {
                              deleteScreen(screen.id)
                            }
                          }}
                          className="p-1 rounded hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Screen"
                        >
                          <Trash2 size={12} />
            </button>
                      )}
          </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {screen.width} × {screen.height}
          </div>
              </div>
                ))}
            </div>
          </div>

            {/* Layers Section (moved up) */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                <Layers size={16} className="text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
          </div>
                <button
                  onClick={() => {
                    if (!currentScreen) return
                    const newLayer = { id: `layer-${Date.now()}`, name: `Layer ${currentScreen.layers.length + 1}`, visible: true, locked: false, components: [] }
                    updateScreen(currentScreen.id, { layers: [...currentScreen.layers, newLayer] })
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  + Layer
                        </button>
          </div>
                      
              <div className="max-h-64 overflow-y-auto pr-1">
                {/* Flat list per screen: front-to-back ordering (top = front) with drag to reorder or nest */}
                {screens.map((scr) => (
                  <div key={`layers-${scr.id}`} className={`mb-4 rounded-lg border ${activeScreen === scr.id ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                      <button onClick={() => setActiveScreen(scr.id)} className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        {scr.name}
                      </button>
                      <div className="text-[11px] text-gray-400">Components</div>
                    </div>
                    <div className="p-2"
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => {
                           e.preventDefault()
                           try {
                             const data = JSON.parse(e.dataTransfer.getData('application/json'))
                             if (data.kind !== 'component') return
                             const { componentId: draggedId, screenId: fromScreenId } = data
                             const fromScreen = screens.find(s => s.id === fromScreenId)
                             const sourceComp = fromScreen?.layers.flatMap(l => l.components).find(c => c.id === draggedId)
                             if (!sourceComp) return
                             const targetScreen = scr
                             if (fromScreen && fromScreen.id === targetScreen.id) {
                               // Move within same screen: compute new layers in memory, then commit once
                               const removed = removeComponentFromScreen(targetScreen, draggedId)
                               const withAdded = addComponentToLayer({ ...targetScreen, layers: removed }, { ...sourceComp }, targetScreen.activeLayer)
                               const newOrderIds = [ draggedId, ...getCombinedComponents({ ...targetScreen, layers: withAdded }).filter(c => c.id !== draggedId).map(c => c.id) ]
                               updateScreen(targetScreen.id, { layers: applyZOrder({ ...targetScreen, layers: withAdded }, newOrderIds) })
                             } else {
                               // Cross-screen move: update source first, then target
                               if (fromScreen) {
                                 const newSourceLayers = removeComponentFromScreen(fromScreen, draggedId)
                                 const newSourceOrder = getCombinedComponents({ ...fromScreen, layers: newSourceLayers }).map(c => c.id)
                                 updateScreen(fromScreen.id, { layers: applyZOrder({ ...fromScreen, layers: newSourceLayers }, newSourceOrder) })
                               }
                               const withAdded = addComponentToLayer(targetScreen, { ...sourceComp }, targetScreen.activeLayer)
                               const newOrderIds = [ draggedId, ...getCombinedComponents({ ...targetScreen, layers: withAdded }).filter(c => c.id !== draggedId).map(c => c.id) ]
                               updateScreen(targetScreen.id, { layers: applyZOrder({ ...targetScreen, layers: withAdded }, newOrderIds) })
                             }
                           } catch {}
                         }}
                    >
                      {(() => {
                        const combined = getCombinedComponents(scr)
                          .slice()
                          .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                        if (combined.length === 0) {
                          return <div className="text-xs text-gray-400 px-2 py-1">No components</div>
                        }
                        return combined.map((component) => (
                          <div
                            key={component.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'component', componentId: component.id, screenId: scr.id }))
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                              const y = e.clientY
                              const before = y < rect.top + rect.height / 3
                              const after = y > rect.bottom - rect.height / 3
                              const inside = !before && !after
                              setLayerDragPreview({ screenId: scr.id, targetId: component.id, position: before ? 'before' : after ? 'after' : 'inside' })
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              try {
                                const data = JSON.parse(e.dataTransfer.getData('application/json'))
                                if (data.kind !== 'component') return
                                const { componentId: draggedId, screenId: fromScreenId } = data
                                const targetId = component.id
                                const preview = layerDragPreview
                                const before = preview && preview.targetId === targetId && preview.position === 'before'
                                const after = preview && preview.targetId === targetId && preview.position === 'after'
                                const inside = preview && preview.targetId === targetId && preview.position === 'inside'
                                const fromScreen = screens.find(s => s.id === fromScreenId)
                                const sourceComp = fromScreen?.layers.flatMap(l => l.components).find(c => c.id === draggedId)
                                if (!sourceComp) return
                                if (inside && component.type === 'container') {
                                  // Move dragged to be a child of target container
                                  if (fromScreen) {
                                    const newSourceLayers = removeComponentFromScreen(fromScreen, draggedId)
                                    updateScreen(fromScreen.id, { layers: newSourceLayers })
                                  }
                                  addChildComponentInScreen(scr.id, targetId, { ...sourceComp })
                                  return
                                }
                                if (fromScreen && fromScreen.id !== scr.id) {
                                  // remove from source screen
                                  const newSourceLayers = removeComponentFromScreen(fromScreen, draggedId)
                                  const newSourceOrder = getCombinedComponents({ ...fromScreen, layers: newSourceLayers }).map(c => c.id)
                                  updateScreen(fromScreen.id, { layers: applyZOrder({ ...fromScreen, layers: newSourceLayers }, newSourceOrder) })
                                  // insert into target screen
                                  const currentOrderIds = getCombinedComponents(scr).map(c => c.id).filter(id => id !== draggedId)
                                  const targetIndex = currentOrderIds.findIndex(id => id === targetId)
                                  const insertIndex = targetIndex === -1 ? 0 : (before ? targetIndex : after ? targetIndex + 1 : targetIndex)
                                  currentOrderIds.splice(insertIndex, 0, draggedId)
                                  updateScreen(scr.id, { layers: applyZOrder(scr, currentOrderIds) })
                                } else {
                                  // within same screen reorder
                                  const currentOrderIds = getCombinedComponents(scr).map(c => c.id)
                                  const filtered = currentOrderIds.filter(id => id !== draggedId)
                                  const targetIndex = filtered.findIndex(id => id === targetId)
                                  if (targetIndex === -1) return
                                  const insertIndex = before ? targetIndex : after ? targetIndex + 1 : targetIndex
                                  filtered.splice(insertIndex, 0, draggedId)
                                  updateScreen(scr.id, { layers: applyZOrder(scr, filtered) })
                                }
                              } catch {}
                              setLayerDragPreview(null)
                            }}
                            onDragLeave={() => { setLayerDragPreview(null) }}
                            className={`flex items-center space-x-2 px-2 py-1 rounded cursor-move text-xs ${
                              selectedComponent?.id === component.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => { setSelectedComponentId(component.id); setRightSidebarVisible(true) }}
                          >
                            <div className="relative w-full flex items-center space-x-2">
                              {/* Tracker lines */}
                              {layerDragPreview && layerDragPreview.screenId === scr.id && layerDragPreview.targetId === component.id && layerDragPreview.position === 'before' && (
                                <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-black rounded" />
                              )}
                              {layerDragPreview && layerDragPreview.screenId === scr.id && layerDragPreview.targetId === component.id && layerDragPreview.position === 'after' && (
                                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-black rounded" />
                              )}
                              {layerDragPreview && layerDragPreview.screenId === scr.id && layerDragPreview.targetId === component.id && layerDragPreview.position === 'inside' && (
                                <div className="absolute inset-0 ring-1 ring-black/60 rounded pointer-events-none" />
                              )}
                              <Square size={12} className="text-gray-500 flex-shrink-0" />
                              <span className="truncate flex-1">{component.name}</span>
                              <span className="text-[10px] text-gray-400">{component.type}</span>
                            </div>
                          </div>
                        ))
                      })()}
            </div>
          </div>
                  ))}
            </div>
              </div>
            </div>

            {/* Components Library (moved down) */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Components</h3>
              <p className="text-xs text-gray-500 mb-2">Drag components to canvas</p>
              {/* Component search */}
              <div className="mb-2 relative">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-1 focus-within:ring-2 focus-within:ring-blue-200">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    type="text"
                    value={componentSearchQuery}
                    onChange={(e) => setComponentSearchQuery(e.target.value)}
                    placeholder="Search built-ins or npm…"
                    className="flex-1 px-2 py-1 text-sm bg-transparent outline-none"
                  />
                  {isSearchingComponents && (
                    <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                  )}
                </div>
                {/* Remote results dropdown with drag support and preview */}
                {componentSearchQuery.trim().length >= 2 && remoteComponentResults.length > 0 && (
                  <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                    {remoteComponentResults.map((pkg) => (
                      <div
                        key={pkg.name}
                        className="px-3 py-2 hover:bg-gray-50 cursor-move flex items-center space-x-2"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'component', componentType: 'external', packageName: pkg.name, packageLink: pkg.link }))
                        }}
                        onClick={() => addExternalComponentToActiveScreen(pkg.name, { package: pkg.name, link: pkg.link })}
                      >
                        <div className="w-8 h-6 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {remoteComponentPreviews[pkg.name]
                            ? <img src={remoteComponentPreviews[pkg.name]} alt="preview" className="max-w-full max-h-full" />
                            : <div className="text-[10px] text-gray-400">UI</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{pkg.name}</div>
                          {pkg.description && <div className="text-[11px] text-gray-500 truncate">{pkg.description}</div>}
                        </div>
                      </div>
                    ))}
                    <div className="px-3 py-2 text-[11px] text-gray-400 border-t">Results from npm registry</div>
                  </div>
                )}
              </div>
              <div className="space-y-2 h-64 overflow-y-auto pr-1">
                    {COMPONENT_LIBRARY.filter(c =>
                  c.name.toLowerCase().includes(componentSearchQuery.toLowerCase()) ||
                  c.type.toLowerCase().includes(componentSearchQuery.toLowerCase())
                ).map((component) => (
                  <div
                    key={component.type}
                    draggable
                        onDragStart={(e) => handleComponentDragStart(e, component.type)}
                    onDragEnd={handleComponentDragEnd}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-move"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${component.type === 'button' ? 'bg-red-500' : 'bg-blue-500'}`}>
                      <component.icon size={14} className="text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">{component.name}</div>
                      <div className="text-xs text-gray-500">UI Component</div>
                    </div>
                  </div>
                ))}
                {COMPONENT_LIBRARY.filter(c =>
                  c.name.toLowerCase().includes(componentSearchQuery.toLowerCase()) ||
                  c.type.toLowerCase().includes(componentSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-xs text-gray-400 px-2 py-1">No components found</div>
                )}
              </div>
            </div>
          </div>
      )}

      {/* Main Canvas */}
      <div
        className={`flex-1 relative overflow-hidden ${leftSidebarVisible ? '' : 'w-full'}`}
        ref={containerRef}
        onPaste={async (e) => {
          // Paste image from clipboard like Figma
          if (!activeScreen) return
          const items = e.clipboardData?.items
          if (!items || items.length === 0) return
          let imageFile: File | null = null
          for (const item of items as any) {
            if (item.kind === 'file') {
              const file = item.getAsFile()
              if (file && file.type.startsWith('image/')) { imageFile = file; break }
            }
          }
          if (!imageFile) return
          e.preventDefault()
          try {
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result as string
              const screenId = activeScreen
              const targetScreen = screens.find(s => s.id === screenId)
              if (!targetScreen) return
              const activeLayer = targetScreen.layers.find(l => l.id === targetScreen.activeLayer)
              const nextZ = activeLayer ? Math.max(0, ...activeLayer.components.map(c => c.zIndex || 0)) + 1 : 1
              const id = `image-${Date.now()}-${pasteImageCounterRef.current++}`
              const newComponent: Component = {
                id,
                type: 'image',
                name: 'Pasted Image',
                props: { src: dataUrl, alt: 'Pasted Image', objectFit: 'cover' },
                position: { x: 24, y: 24 },
                size: { width: 240, height: 160 },
                backgroundColor: '#f9fafb',
                zIndex: nextZ
              }
              const updatedLayers = targetScreen.layers.map(layer =>
                layer.id === targetScreen.activeLayer
                  ? { ...layer, components: [...layer.components, newComponent] }
                  : layer
              )
              updateScreen(targetScreen.id, { layers: updatedLayers })
              addComponent(newComponent)
              setSelectedComponentId(newComponent.id)
              setRightSidebarVisible(true)
            }
            reader.readAsDataURL(imageFile)
          } catch {}
        }}
      >
        {/* Bottom Toolbar - Grouped dropdowns (always bottom-center of viewport) */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70]">
          <div className="flex items-center bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-2xl px-3 py-2 space-x-2">
            {/* Cursor group */}
            <div className="relative">
              <button
                onClick={() => { setShowCursorMenu((v) => !v); setShowShapesMenu(false); setShowMediaMenu(false); setShowCommentsMenu(false); setShowFrameMenu(false) }}
                className={`h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100 ${['select','move','hand','scale'].includes(activeTool) ? 'bg-gray-100 ring-1 ring-gray-300' : ''}`}
                title="Cursor tools"
              >
                {activeTool === 'hand' ? <Hand className="w-4 h-4" /> : activeTool === 'scale' ? <ZoomIn className="w-4 h-4" /> : <Move className="w-4 h-4" />}
                <span className="ml-1 px-1 rounded bg-gray-100 text-[10px] leading-none text-gray-600">V</span>
                <ChevronDown className="w-3 h-3 ml-1 text-gray-500" />
              </button>
              {showCursorMenu && (
                <div className="absolute bottom-11 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 w-32">
                  <button onClick={() => { setActiveTool('select'); setShowCursorMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='select'?'bg-gray-100':''}`}>
                    <Move className="w-4 h-4" /><span className="text-xs">Move/Select</span>
                  </button>
                  <button onClick={() => { setActiveTool('hand'); setShowCursorMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='hand'?'bg-gray-100':''}`}>
                    <Hand className="w-4 h-4" /><span className="text-xs">Hand</span>
                  </button>
                  <button onClick={() => { setActiveTool('scale'); setShowCursorMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='scale'?'bg-gray-100':''}`}>
                    <ZoomIn className="w-4 h-4" /><span className="text-xs">Scale</span>
                  </button>
                </div>
              )}
            </div>

            {/* Frame menu (moved to 2nd position) */}
            <div className="relative">
              <button
                onClick={() => { setActiveTool('frame'); setShowFrameMenu((v) => !v); setShowCursorMenu(false); setShowShapesMenu(false); setShowMediaMenu(false); setShowCommentsMenu(false) }}
                className={`h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100 ${activeTool === 'frame' || showFrameMenu ? 'bg-gray-100 ring-1 ring-gray-300' : ''}`}
                title="Frame"
              >
                {/* Custom frame icon: 2 vertical + 2 horizontal lines (grid-like) */}
                <svg className="w-4 h-4 text-gray-700" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="5" y1="2" x2="5" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="11" y1="2" x2="11" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="ml-1 px-1 rounded bg-gray-100 text-[10px] leading-none text-gray-600">F</span>
                <ChevronDown className="w-3 h-3 ml-1 text-gray-500" />
              </button>
              {showFrameMenu && (
                <div className="absolute bottom-11 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-56">
                  <div className="text-[11px] font-semibold text-gray-500 mb-1 px-1">iOS</div>
                  {[{ name: 'iPhone SE', w: 375, h: 667, type: 'mobile' as const }, { name: 'iPhone 14', w: 390, h: 844, type: 'mobile' as const }, { name: 'iPhone 14 Plus', w: 428, h: 926, type: 'mobile' as const }, { name: 'iPad', w: 768, h: 1024, type: 'tablet' as const }].map(p => (
                    <button key={p.name} onClick={() => { handleAddScreen({ name: p.name, width: p.w, height: p.h, type: p.type, icon: Smartphone }); closeAllMenus() }} className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100">
                      <span className="text-xs text-gray-800">{p.name}</span>
                      <span className="text-[11px] text-gray-500">{p.w} × {p.h}</span>
                    </button>
                  ))}
                  <div className="text-[11px] font-semibold text-gray-500 mt-2 mb-1 px-1">Android</div>
                  {[{ name: 'Android Small', w: 360, h: 640 }, { name: 'Android Medium', w: 411, h: 891 }, { name: 'Android Large', w: 480, h: 960 }].map(p => (
                    <button key={p.name} onClick={() => { handleAddScreen({ name: p.name, width: p.w, height: p.h, type: 'mobile' as const, icon: Smartphone }); closeAllMenus() }} className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100">
                      <span className="text-xs text-gray-800">{p.name}</span>
                      <span className="text-[11px] text-gray-500">{p.w} × {p.h}</span>
                    </button>
                  ))}
                  <div className="text-[11px] font-semibold text-gray-500 mt-2 mb-1 px-1">Desktop</div>
                  {[{ name: 'Desktop 1440×900', w: 1440, h: 900 }, { name: 'Desktop 1920×1080', w: 1920, h: 1080 }].map(p => (
                    <button key={p.name} onClick={() => { handleAddScreen({ name: p.name, width: p.w, height: p.h, type: 'desktop' as const, icon: Monitor }); closeAllMenus() }} className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100">
                      <span className="text-xs text-gray-800">{p.name}</span>
                      <span className="text-[11px] text-gray-500">{p.w} × {p.h}</span>
                    </button>
                  ))}
                  <div className="text-[11px] text-gray-500 mt-2 px-1">Or drag on canvas with Frame tool to draw a custom frame.</div>
                </div>
              )}
            </div>

            {/* Shapes group */}
            <div className="relative">
              <button
                onClick={() => { setShowShapesMenu((v) => !v); setShowCursorMenu(false); setShowMediaMenu(false); setShowCommentsMenu(false); setShowFrameMenu(false) }}
                className={`h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100 ${['rectangle','ellipse','line','arrow','polygon','star'].includes(activeTool) ? 'bg-gray-100 ring-1 ring-gray-300' : ''}`}
                title="Shapes"
              >
                {activeTool === 'ellipse' ? <Circle className="w-4 h-4" /> : activeTool === 'line' ? <Minus className="w-4 h-4" /> : activeTool === 'arrow' ? <ArrowRight className="w-4 h-4" /> : activeTool === 'polygon' ? <Pentagon className="w-4 h-4" /> : activeTool === 'star' ? <StarIcon className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <ChevronDown className="w-3 h-3 ml-1 text-gray-500" />
              </button>
              {showShapesMenu && (
                <div className="absolute bottom-11 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 w-36">
                  <button onClick={() => { setActiveTool('rectangle'); setShowShapesMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='rectangle'?'bg-gray-100':''}`}>
                    <Square className="w-4 h-4" /><span className="text-xs">Rectangle</span>
                  </button>
                  <button onClick={() => { setActiveTool('ellipse'); setShowShapesMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='ellipse'?'bg-gray-100':''}`}>
                    <Circle className="w-4 h-4" /><span className="text-xs">Ellipse</span>
                  </button>
                  <button onClick={() => { setActiveTool('line'); setShowShapesMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='line'?'bg-gray-100':''}`}>
                    <Minus className="w-4 h-4" /><span className="text-xs">Line</span>
                  </button>
                  <button onClick={() => { setActiveTool('arrow'); setShowShapesMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='arrow'?'bg-gray-100':''}`}>
                    <ArrowRight className="w-4 h-4" /><span className="text-xs">Arrow</span>
                  </button>
                  <button onClick={() => { setActiveTool('polygon'); setShowShapesMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='polygon'?'bg-gray-100':''}`}>
                    <Pentagon className="w-4 h-4" /><span className="text-xs">Polygon</span>
                  </button>
                  <button onClick={() => { setActiveTool('star'); setShowShapesMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='star'?'bg-gray-100':''}`}>
                    <StarIcon className="w-4 h-4" /><span className="text-xs">Star</span>
                  </button>
                </div>
              )}
            </div>

            {/* Text/Image group (Frame separated) */}
            <div className="relative">
              <button
                onClick={() => { setShowMediaMenu((v) => !v); setShowCursorMenu(false); setShowShapesMenu(false); setShowCommentsMenu(false); setShowFrameMenu(false) }}
                className={`h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100 ${['text','image'].includes(activeTool) ? 'bg-gray-100 ring-1 ring-gray-300' : ''}`}
                title="Media"
              >
                {activeTool === 'image' ? <Image className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                <ChevronDown className="w-3 h-3 ml-1 text-gray-500" />
              </button>
              {showMediaMenu && (
                <div className="absolute bottom-11 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 w-28">
                  <button onClick={() => { setActiveTool('text'); closeAllMenus() }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='text'?'bg-gray-100':''}`}>
                    <Type className="w-4 h-4" /><span className="text-xs">Text</span>
                  </button>
                  <button onClick={() => { setActiveTool('image'); closeAllMenus() }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='image'?'bg-gray-100':''}`}>
                    <Image className="w-4 h-4" /><span className="text-xs">Image</span>
                  </button>
                </div>
              )}
            </div>

            

            {/* Comments group */}
            <div className="relative">
              <button
                onClick={() => { setShowCommentsMenu((v) => !v); setShowCursorMenu(false); setShowShapesMenu(false); setShowMediaMenu(false); setShowFrameMenu(false) }}
                className={`h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100 ${['comment','annotation','measurement'].includes(activeTool) ? 'bg-gray-100 ring-1 ring-gray-300' : ''}`}
                title="Comments & Measure"
              >
                {activeTool === 'annotation' ? <StickyNote className="w-4 h-4" /> : activeTool === 'measurement' ? <Ruler className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                <ChevronDown className="w-3 h-3 ml-1 text-gray-500" />
              </button>
              {showCommentsMenu && (
                <div className="absolute bottom-11 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 w-36">
                  <button onClick={() => { setActiveTool('comment'); setShowCommentsMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='comment'?'bg-gray-100':''}`}>
                    <MessageSquare className="w-4 h-4" /><span className="text-xs">Comment</span>
                  </button>
                  <button onClick={() => { setActiveTool('annotation'); setShowCommentsMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='annotation'?'bg-gray-100':''}`}>
                    <StickyNote className="w-4 h-4" /><span className="text-xs">Annotation</span>
                  </button>
                  <button onClick={() => { setActiveTool('measurement'); setShowCommentsMenu(false) }} className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 ${activeTool==='measurement'?'bg-gray-100':''}`}>
                    <Ruler className="w-4 h-4" /><span className="text-xs">Measurement</span>
                  </button>
                </div>
              )}
            </div>

            {/* Fullscreen toggle and properties */}
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={() => {
                if (!isFullScreen) {
                  prevLeftSidebarRef.current = leftSidebarVisible
                  prevRightSidebarRef.current = rightSidebarVisible
                  setLeftSidebarVisible(false)
                  setRightSidebarVisible(false)
                  setIsFullScreen(true)
                } else {
                  setLeftSidebarVisible(prevLeftSidebarRef.current)
                  setRightSidebarVisible(prevRightSidebarRef.current)
                  setIsFullScreen(false)
                }
              }}
              className="h-9 px-3 flex items-center justify-center rounded-full hover:bg-gray-100 text-xs text-gray-700"
              title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullScreen ? 'Exit Full' : 'Full Screen'}
            </button>

            {/* Screen count indicator */}
            <div className="h-9 px-3 flex items-center justify-center rounded-full text-xs text-gray-700">
              <span className="relative inline-flex items-center">
                <span className="relative inline-flex items-center justify-center mr-2">
                  {/* Soft glow ring */}
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-60 animate-ping"></span>
                  {/* Core dot (smaller) */}
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.7)]"></span>
                </span>
                <span>{screens.length} screen{screens.length !== 1 ? 's' : ''}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Left Sidebar Toggle Button (when sidebar is closed) */}
        {!leftSidebarVisible && (
          <div className="absolute top-4 left-4 z-40">
            <button
              onClick={() => setLeftSidebarVisible(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
              title="Show Tools"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="text-sm font-medium">Design Tools</span>
            </button>
            </div>
        )}

        {/* Zoom Controls - repositioned to avoid sidebar overlaps */}
        <div className={`absolute z-40 flex items-center space-x-2 ${leftSidebarVisible ? 'top-4 left-4' : 'top-16 left-4'}`}>
          <button
            onClick={zoomOut}
            className="w-8 h-8 bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center hover:bg-gray-50"
            title="Zoom Out"
          >
            −
          </button>
          <div className="bg-white border border-gray-300 rounded shadow-lg px-3 py-1 text-sm text-gray-600">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={zoomIn}
            className="w-8 h-8 bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center hover:bg-gray-50"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={resetView}
            className="w-8 h-8 bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center hover:bg-gray-50 text-xs"
            title="Reset View"
          >
            ⌂
          </button>
          {/* Grid snapping controls */}
          <div className="ml-2 bg-white border border-gray-300 rounded shadow-lg px-2 py-1 flex items-center space-x-2">
            <label className="text-xs text-gray-600 flex items-center space-x-1">
              <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
              <span>Snap</span>
            </label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-700"
              title="Grid size"
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={4}>4px</option>
              <option value={8}>8px</option>
              <option value={10}>10px</option>
              <option value={20}>20px</option>
            </select>
          </div>
            </div>

                {/* Saving indicator */}
        {isSaving && (
          <div className="absolute top-16 left-4 bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 text-blue-800 text-sm z-50">
            Saving design...
          </div>
        )}

                {/* Drag feedback */}
        {isDraggingComponent && (
          <div className="absolute top-16 left-4 bg-green-100 border border-green-300 rounded-lg px-4 py-2 text-green-800 text-sm z-50">
            Drop component on any screen
            </div>
        )}

        {/* Screen dragging feedback */}
        {isDraggingScreen && (
          <div className="absolute top-16 left-4 bg-purple-100 border border-purple-300 rounded-lg px-4 py-2 text-purple-800 text-sm z-50">
            Dragging screen: {screens.find(s => s.id === draggedScreenId)?.name}
          </div>
        )}

        {/* Canvas info removed per request */}

        <div
          ref={canvasRef}
          className={`w-full h-full relative ${
            isPanning ? 'cursor-grabbing' : isDraggingComponent ? 'cursor-copy' : activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'
          }`}
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px),
              linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px, ${gridSize * zoom}px ${gridSize * zoom}px, ${gridSize * 10 * zoom}px ${gridSize * 10 * zoom}px, ${gridSize * 10 * zoom}px ${gridSize * 10 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`
          }}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onClick={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (activeTool === 'scale' && rect) {
              const canvasX = (e.clientX - rect.left - pan.x) / zoom
              const canvasY = (e.clientY - rect.top - pan.y) / zoom
              const factor = e.altKey ? 0.9 : 1.1
              const newZoom = Math.min(Math.max(zoom * factor, 0.1), 3)
              const newPanX = pan.x + canvasX * (zoom - newZoom)
              const newPanY = pan.y + canvasY * (zoom - newZoom)
              setZoom(newZoom)
              setPan({ x: newPanX, y: newPanY })
              return
            }
            if (activeTool === 'hand') {
              // instruct users: use spacebar drag or middle mouse; keep default deselect behavior
            }
            if (e.target === e.currentTarget) {
              setSelectedComponentId(null)
              setRightSidebarVisible(false)
            }
          }}
        >
          {/* Content wrapper that pans/zooms inside the fixed canvas */}
          <div
            className="absolute top-0 left-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%'
            }}
          >
          {/* Canvas content - Render all screens */}
          {screens.length === 0 ? (
            /* Empty state - No screens */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v2h-2v-2zm0-10h2v8h-2V7z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Design Mode</h3>
                <p className="text-gray-600 mb-4">Start creating your app by adding your first screen</p>
                <button
                  onClick={() => setShowScreenPresets(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Screen
                </button>
              </div>
            </div>
          ) : (
            screens.map((screen) => {
            const screenPos = screenPositions[screen.id] || { x: 200, y: 100 }
            const screenComponents = getComponentsByScreen(screen.id)
            const isActive = activeScreen === screen.id
            
            return (
              <div
                key={screen.id}
                className={`absolute bg-white border-2 shadow-lg transition-all ${
                  isActive ? (highlightedScreenId === screen.id ? 'border-blue-500 ring-4 ring-blue-400' : 'border-blue-500 ring-2 ring-blue-200') : 'border-gray-300 hover:border-gray-400'
                } ${isDraggingScreen && draggedScreenId === screen.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  width: screen.width,
                  height: screen.height,
                  left: screenPos.x,
                  top: screenPos.y,
                  zIndex: isActive ? 10 : 1
                }}
                onMouseDown={(e) => handleScreenMouseDown(e, screen.id)}
                onDoubleClick={() => {
                  setActiveScreen(screen.id)
                  setHighlightedScreenId(screen.id)
                  setTimeout(() => setHighlightedScreenId(prev => (prev === screen.id ? null : prev)), 800)
                }}
                onDragOver={handleCanvasDragOver}
                onDrop={handleCanvasDrop}
              >
                {/* Screen header */}
                <div 
                  className="screen-header absolute -top-8 left-0 right-0 h-6 flex items-center justify-between px-2 bg-white border border-gray-300 rounded-t text-xs font-medium text-gray-700 cursor-move"
                  style={{ zIndex: 15 }}
                >
                  <span>{screen.name}</span>
                  <span className="text-gray-500">{screen.width} × {screen.height}</span>
                </div>
                
                {/* Screen content */}
                <div
                  className="absolute top-0 left-0 w-full h-full overflow-hidden"
                  onMouseDown={(e) => {
                    // If select tool and clicked on empty area inside the screen, deselect
                    if (activeTool === 'select' && e.target === e.currentTarget) {
                      setSelectedComponentId(null)
                      setRightSidebarVisible(false)
                      return
                    }
                    beginDrawOnScreen(e, screen.id)
                  }}
                  onClick={(e) => {
                    // Fallback: deselect on click if background area
                    if (e.target === e.currentTarget) {
                      setSelectedComponentId(null)
                      setRightSidebarVisible(false)
                    }
                  }}
                >
                  {/* Drag alignment guides */}
                  {dragGuides.screenId === screen.id && (dragGuides.v.length > 0 || dragGuides.h.length > 0) && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                      {dragGuides.v.map((x) => (
                        <div key={`v-${x}`} className="absolute bg-pink-500/70" style={{ left: x, top: 0, width: 1, height: '100%' }} />
                      ))}
                      {dragGuides.h.map((y) => (
                        <div key={`h-${y}`} className="absolute bg-pink-500/70" style={{ top: y, left: 0, height: 1, width: '100%' }} />
                      ))}
                    </div>
                  )}
                  {dragGuides.screenId === screen.id && dragGuides.badge && (
                    <div className="absolute text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white pointer-events-none" style={{ left: dragGuides.badge.x, top: dragGuides.badge.y, zIndex: 25 }}>
                      {dragGuides.badge.text}
                    </div>
                  )}
                  {screenComponents.map((component) => {
                  const renderComponentContent = () => {
                    const baseStyle: React.CSSProperties = {
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: component.backgroundColor,
                      borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : undefined,
                      border: component.props?.borderWidth ? 
                        `${component.props.borderWidth}px ${component.props?.borderStyle || 'solid'} ${component.props?.borderColor || '#000'}` : 
                        undefined,
                      opacity: component.props?.opacity || 1,
                      boxShadow: component.props?.shadowBlur ? 
                        `${component.props?.shadowX || 0}px ${component.props?.shadowY || 0}px ${component.props.shadowBlur}px ${component.props?.shadowColor || '#000'}` : 
                        undefined,
                    }

                    if (component.type === 'text') {
                      return (
                        <div
                          style={{
                            ...baseStyle,
                            fontSize: component.props?.fontSize ? `${component.props.fontSize}px` : '16px',
                            fontFamily: component.props?.fontFamily || 'Inter',
                            fontWeight: component.props?.fontWeight || '500',
                            fontStyle: component.props?.italic ? 'italic' : 'normal',
                            textDecoration: component.props?.underline ? 'underline' : 'none',
                            textTransform: component.props?.textTransform || 'none',
                            color: component.props?.color || '#111827',
                            textAlign: (component.props?.textAlign as any) || 'left',
                            lineHeight: component.props?.lineHeight || 1.4,
                            letterSpacing: component.props?.letterSpacing ? `${component.props.letterSpacing}px` : undefined,
                            wordSpacing: component.props?.wordSpacing ? `${component.props.wordSpacing}px` : undefined,
                            whiteSpace: component.props?.whiteSpace || 'normal',
                            padding: '8px 10px',
                            wordWrap: 'break-word',
                            overflow: 'hidden'
                          }}
                        >
                          {component.props?.text || 'Text'}
                        </div>
                      )
                    }

                    if (component.type === 'button') {
                      return (
                        <button
                          style={{
                            ...baseStyle,
                            fontSize: '14px',
                            fontFamily: 'Inter',
                            fontWeight: 600,
                            color: component.props?.color || '#ffffff',
                          background: component.props?.gradient
                              ? `linear-gradient(135deg, ${component.backgroundColor || '#ef4444'} 0%, ${component.props?.gradient} 100%)`
                              : component.backgroundColor || '#ef4444',
                            border: '0',
                            cursor: 'pointer',
                            borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : '10px',
                            boxShadow: '0 8px 20px rgba(99,102,241,0.25)'
                          }}
                        >
                          {component.props?.text || 'Button'}
                        </button>
                      )
                    }

                    if (component.type === 'input') {
                      return (
                        <input
                          type={component.props?.type || 'text'}
                          placeholder={component.props?.placeholder || 'Enter text'}
                          style={{
                            ...baseStyle,
                            fontSize: '14px',
                            fontFamily: 'Inter',
                            padding: '10px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : '10px',
                            backgroundColor: component.backgroundColor || '#ffffff',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
                          }}
                        />
                      )
                    }

                    if (component.type === 'image') {
                      return (
                        <div
                          style={{
                            ...baseStyle,
                            backgroundColor: component.backgroundColor || '#f9fafb',
                            borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : '12px',
                            backgroundImage: component.props?.src ? `url(${component.props.src})` : undefined,
                            backgroundSize: component.props?.objectFit === 'contain' ? 'contain' : 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          {!component.props?.src && (
                            <div className="text-gray-500 text-sm">
                              <Image size={20} className="mx-auto mb-1" />
                              <span>Image</span>
                            </div>
                          )}
                        </div>
                      )
                    }

                    if (component.type === 'ellipse') {
                      return (
                        <div
                          style={{
                            ...baseStyle,
                            borderRadius: '9999px',
                            backgroundColor: component.backgroundColor || '#ffffff',
                            border: component.props?.borderWidth
                              ? `${component.props.borderWidth}px ${component.props?.borderStyle || 'solid'} ${component.props?.borderColor || '#000'}`
                              : undefined
                          }}
                        />
                      )
                    }

                    if (component.type === 'line' || component.type === 'arrow') {
                      const horizontal = (component.size.width || 0) >= (component.size.height || 0)
                      const stroke = component.props?.lineColor || '#111827'
                      const thickness = Math.max(1, Number(component.props?.thickness) || 2)
                      const w = Math.max(1, component.size.width)
                      const h = Math.max(1, component.size.height)
                      // Line endpoints (axis aligned)
                      const x1 = 0
                      const y1 = horizontal ? h / 2 : 0
                      const x2 = horizontal ? w : 0
                      const y2 = horizontal ? h / 2 : h
                      // Arrowhead triangle near end
                      let arrowPoints = ''
                      if (component.type === 'arrow') {
                        const head = 6 + thickness // arrow size scales with thickness
                        if (horizontal) {
                          arrowPoints = `${w - head},${y2 - head} ${w},${y2} ${w - head},${y2 + head}`
                        } else {
                          arrowPoints = `${x2 - head},${h - head} ${x2},${h} ${x2 + head},${h - head}`
                        }
                      }
                      return (
                        <svg width="100%" height="100%" style={{ display: 'block' }}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={thickness} />
                          {component.type === 'arrow' && arrowPoints && (
                            <polygon points={arrowPoints} fill={stroke} />
                          )}
                        </svg>
                      )
                    }
                    if (component.type === 'polygon') {
                      const sides = Math.max(3, Number(component.props?.sides) || 5)
                      const w = Math.max(1, component.size.width)
                      const h = Math.max(1, component.size.height)
                      const cx = w / 2
                      const cy = h / 2
                      const r = Math.min(w, h) / 2
                      const points = Array.from({ length: sides }, (_, i) => {
                        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
                        const x = cx + r * Math.cos(angle)
                        const y = cy + r * Math.sin(angle)
                        return `${x},${y}`
                      }).join(' ')
                      const stroke = component.props?.lineColor || '#111827'
                      const thickness = Math.max(1, Number(component.props?.thickness) || 1)
                      return (
                        <svg width="100%" height="100%" style={{ display: 'block' }}>
                          <polygon points={points} fill={component.backgroundColor || '#ffffff'} stroke={stroke} strokeWidth={thickness} />
                        </svg>
                      )
                    }
                    if (component.type === 'star') {
                      const pointsNum = Math.max(3, Number(component.props?.points) || 5)
                      const innerRatio = Math.max(0.1, Math.min(0.9, Number(component.props?.innerRatio) || 0.5))
                      const w = Math.max(1, component.size.width)
                      const h = Math.max(1, component.size.height)
                      const cx = w / 2
                      const cy = h / 2
                      const outer = Math.min(w, h) / 2
                      const inner = outer * innerRatio
                      const total = pointsNum * 2
                      const points = Array.from({ length: total }, (_, i) => {
                        const r = (i % 2 === 0) ? outer : inner
                        const angle = (i / total) * Math.PI * 2 - Math.PI / 2
                        const x = cx + r * Math.cos(angle)
                        const y = cy + r * Math.sin(angle)
                        return `${x},${y}`
                      }).join(' ')
                      const stroke = component.props?.lineColor || '#111827'
                      const thickness = Math.max(1, Number(component.props?.thickness) || 1)
                      return (
                        <svg width="100%" height="100%" style={{ display: 'block' }}>
                          <polygon points={points} fill={component.backgroundColor || '#ffffff'} stroke={stroke} strokeWidth={thickness} />
                        </svg>
                      )
                    }
                    if (component.type === 'measurement') {
                      const horizontal = (component.size.width || 0) >= (component.size.height || 0)
                      const stroke = component.props?.lineColor || '#111827'
                      const thickness = Math.max(1, Number(component.props?.thickness) || 2)
                      const w = Math.max(1, component.size.width)
                      const h = Math.max(1, component.size.height)
                      const x1 = 0
                      const y1 = horizontal ? h / 2 : 0
                      const x2 = horizontal ? w : 0
                      const y2 = horizontal ? h / 2 : h
                      const label = `${Math.round(horizontal ? w : h)} px`
                      return (
                        <svg width="100%" height="100%" style={{ display: 'block' }}>
                          {horizontal ? (
                            <>
                              <line x1={0} y1={0} x2={0} y2={h} stroke={stroke} strokeWidth={1} />
                              <line x1={w} y1={0} x2={w} y2={h} stroke={stroke} strokeWidth={1} />
                            </>
                          ) : (
                            <>
                              <line x1={0} y1={0} x2={w} y2={0} stroke={stroke} strokeWidth={1} />
                              <line x1={0} y1={h} x2={w} y2={h} stroke={stroke} strokeWidth={1} />
                            </>
                          )}
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={thickness} />
                          <text x={w / 2} y={h / 2} fill={stroke} textAnchor="middle" dominantBaseline="middle" fontSize="10">{label}</text>
                        </svg>
                      )
                    }
                    if (component.type === 'comment') {
                      return (
                        <div style={{
                          ...baseStyle,
                          background: '#FFF9C4',
                          color: '#111827',
                          border: '1px solid #FDE68A',
                          borderRadius: '8px',
                          alignItems: 'flex-start',
                          padding: '8px 10px'
                        }}>
                          {component.props?.text || 'Comment'}
                        </div>
                      )
                    }
                    if (component.type === 'annotation') {
                      return (
                        <div style={{
                          ...baseStyle,
                          background: component.props?.color || 'rgba(255, 214, 10, 0.25)',
                          border: `${component.props?.borderWidth || 2}px solid ${component.props?.borderColor || '#f59e0b'}`,
                          borderRadius: '6px'
                        }} />
                      )
                    }

                    // Default container/card
                    return (
                      <div
                        style={{
                          ...baseStyle,
                          background: component.backgroundColor || '#ffffff',
                          borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : '12px',
                          border: '1px solid #e5e7eb',
                          boxShadow: component.props?.shadowBlur
                            ? baseStyle.boxShadow
                            : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
                        }}
                        className="text-sm text-gray-700"
                      >
                        {component.name}
                      </div>
                    )
                  }

                  const renderNestedChildren = (children?: Component[]) => {
                    if (!children || children.length === 0) return null
                    return children.map(child => (
                      <div
                        key={child.id}
                        id={`comp-${child.id}`}
                        data-component-id={child.id}
                        className={`absolute cursor-pointer ${draggingComponentId === child.id ? 'grabbing' : 'grab'}`}
                        style={{
                          left: child.position.x,
                          top: child.position.y,
                          width: child.size.width,
                          height: child.size.height,
                          zIndex: child.zIndex,
                        }}
                        onMouseDown={(e) => handleComponentMouseDown(e, child, screen.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedComponentId(child.id)
                          setRightSidebarVisible(true)
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleNestedDrop(e, screen.id, component.id)}
                      >
                        {renderChildContent(child)}
                        {/* Recursive children */}
                        {renderNestedChildren(child.children)}
                      </div>
                    ))
                  }

                  const renderChildContent = (child: Component) => {
                    // Reuse the same rendering rules as top-level components
                    // by temporarily assigning to `component` and invoking existing block
                    // We inline minimal duplication for safety
                    const baseStyle: React.CSSProperties = {
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: child.backgroundColor,
                      borderRadius: child.props?.borderRadius ? `${child.props.borderRadius}px` : undefined,
                      border: child.props?.borderWidth ? `${child.props.borderWidth}px ${child.props?.borderStyle || 'solid'} ${child.props?.borderColor || '#000'}` : undefined,
                      opacity: child.props?.opacity || 1,
                      boxShadow: child.props?.shadowBlur ? `${child.props?.shadowX || 0}px ${child.props?.shadowY || 0}px ${child.props.shadowBlur}px ${child.props?.shadowColor || '#000'}` : undefined,
                    }
                    if (child.type === 'text') {
                      return (
                        <div style={{
                          ...baseStyle,
                          fontSize: child.props?.fontSize ? `${child.props.fontSize}px` : '16px',
                          fontFamily: child.props?.fontFamily || 'Inter',
                          fontWeight: child.props?.fontWeight || '500',
                          fontStyle: child.props?.italic ? 'italic' : 'normal',
                          textDecoration: child.props?.underline ? 'underline' : 'none',
                          textTransform: child.props?.textTransform || 'none',
                          color: child.props?.color || '#111827',
                          textAlign: (child.props?.textAlign as any) || 'left',
                          lineHeight: child.props?.lineHeight || 1.4,
                          letterSpacing: child.props?.letterSpacing ? `${child.props.letterSpacing}px` : undefined,
                          wordSpacing: child.props?.wordSpacing ? `${child.props.wordSpacing}px` : undefined,
                          whiteSpace: child.props?.whiteSpace || 'normal',
                          padding: '8px 10px',
                          wordWrap: 'break-word',
                          overflow: 'hidden'
                        }}>{child.props?.text || 'Text'}</div>
                      )
                    }
                    if (child.type === 'button') {
                      return (
                        <button style={{
                          ...baseStyle,
                          fontSize: '14px', fontFamily: 'Inter', fontWeight: 600,
                          color: child.props?.color || '#ffffff',
                          background: child.props?.gradient ? `linear-gradient(135deg, ${child.backgroundColor || '#ef4444'} 0%, ${child.props?.gradient} 100%)` : child.backgroundColor || '#ef4444',
                          border: '0', cursor: 'pointer', borderRadius: child.props?.borderRadius ? `${child.props.borderRadius}px` : '10px',
                          boxShadow: '0 8px 20px rgba(99,102,241,0.25)'
                        }}>{child.props?.text || 'Button'}</button>
                      )
                    }
                    if (child.type === 'input') {
                      return (
                        <input type={child.props?.type || 'text'} placeholder={child.props?.placeholder || 'Enter text'} style={{
                          ...baseStyle,
                          fontSize: '14px', fontFamily: 'Inter', padding: '10px 12px',
                          border: '1px solid #e5e7eb', borderRadius: child.props?.borderRadius ? `${child.props.borderRadius}px` : '10px',
                          backgroundColor: child.backgroundColor || '#ffffff', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
                        }} />
                      )
                    }
                    if (child.type === 'image') {
                      return (
                        <div style={{
                          ...baseStyle,
                          backgroundColor: child.backgroundColor || '#f9fafb',
                          borderRadius: child.props?.borderRadius ? `${child.props.borderRadius}px` : '12px',
                          backgroundImage: child.props?.src ? `url(${child.props.src})` : undefined,
                          backgroundSize: child.props?.objectFit === 'contain' ? 'contain' : 'cover',
                          backgroundRepeat: 'no-repeat', backgroundPosition: 'center', border: '1px solid #e5e7eb'
                        }}>
                          {!child.props?.src && <div className="text-gray-500 text-sm">Image</div>}
                        </div>
                      )
                    }
                     if (child.type === 'ellipse') {
                      return (
                        <div style={{
                          ...baseStyle, borderRadius: '9999px', backgroundColor: child.backgroundColor || '#ffffff',
                          border: child.props?.borderWidth ? `${child.props.borderWidth}px ${child.props?.borderStyle || 'solid'} ${child.props?.borderColor || '#000'}` : undefined
                        }} />
                      )
                    }
                     if (child.type === 'polygon') {
                       const sides = Math.max(3, Number(child.props?.sides) || 5)
                       const w = Math.max(1, child.size.width)
                       const h = Math.max(1, child.size.height)
                       const cx = w / 2
                       const cy = h / 2
                       const r = Math.min(w, h) / 2
                       const points = Array.from({ length: sides }, (_, i) => {
                         const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
                         const x = cx + r * Math.cos(angle)
                         const y = cy + r * Math.sin(angle)
                         return `${x},${y}`
                       }).join(' ')
                       const stroke = child.props?.lineColor || '#111827'
                       const thickness = Math.max(1, Number(child.props?.thickness) || 1)
                       return (
                         <svg width="100%" height="100%" style={{ display: 'block' }}>
                           <polygon points={points} fill={child.backgroundColor || '#ffffff'} stroke={stroke} strokeWidth={thickness} />
                         </svg>
                       )
                     }
                     if (child.type === 'star') {
                       const pointsNum = Math.max(3, Number(child.props?.points) || 5)
                       const innerRatio = Math.max(0.1, Math.min(0.9, Number(child.props?.innerRatio) || 0.5))
                       const w = Math.max(1, child.size.width)
                       const h = Math.max(1, child.size.height)
                       const cx = w / 2
                       const cy = h / 2
                       const outer = Math.min(w, h) / 2
                       const inner = outer * innerRatio
                       const total = pointsNum * 2
                       const points = Array.from({ length: total }, (_, i) => {
                         const r = (i % 2 === 0) ? outer : inner
                         const angle = (i / total) * Math.PI * 2 - Math.PI / 2
                         const x = cx + r * Math.cos(angle)
                         const y = cy + r * Math.sin(angle)
                         return `${x},${y}`
                       }).join(' ')
                       const stroke = child.props?.lineColor || '#111827'
                       const thickness = Math.max(1, Number(child.props?.thickness) || 1)
                       return (
                         <svg width="100%" height="100%" style={{ display: 'block' }}>
                           <polygon points={points} fill={child.backgroundColor || '#ffffff'} stroke={stroke} strokeWidth={thickness} />
                         </svg>
                       )
                     }
                     if (child.type === 'measurement') {
                       const horizontal = (child.size.width || 0) >= (child.size.height || 0)
                       const stroke = child.props?.lineColor || '#111827'
                       const thickness = Math.max(1, Number(child.props?.thickness) || 2)
                       const w = Math.max(1, child.size.width)
                       const h = Math.max(1, child.size.height)
                       const x1 = 0
                       const y1 = horizontal ? h / 2 : 0
                       const x2 = horizontal ? w : 0
                       const y2 = horizontal ? h / 2 : h
                       const label = `${Math.round(horizontal ? w : h)} px`
                       return (
                         <svg width="100%" height="100%" style={{ display: 'block' }}>
                           {horizontal ? (
                             <>
                               <line x1={0} y1={0} x2={0} y2={h} stroke={stroke} strokeWidth={1} />
                               <line x1={w} y1={0} x2={w} y2={h} stroke={stroke} strokeWidth={1} />
                             </>
                           ) : (
                             <>
                               <line x1={0} y1={0} x2={w} y2={0} stroke={stroke} strokeWidth={1} />
                               <line x1={0} y1={h} x2={w} y2={h} stroke={stroke} strokeWidth={1} />
                             </>
                           )}
                           <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={thickness} />
                           <text x={w / 2} y={h / 2} fill={stroke} textAnchor="middle" dominantBaseline="middle" fontSize="10">{label}</text>
                         </svg>
                       )
                     }
                     if (child.type === 'comment') {
                       return (
                         <div style={{
                           ...baseStyle,
                           background: '#FFF9C4', color: '#111827', border: '1px solid #FDE68A', borderRadius: '8px',
                           alignItems: 'flex-start', padding: '8px 10px'
                         }}>{child.props?.text || 'Comment'}</div>
                       )
                     }
                     if (child.type === 'annotation') {
                       return (
                         <div style={{
                           ...baseStyle,
                           background: child.props?.color || 'rgba(255, 214, 10, 0.25)',
                           border: `${child.props?.borderWidth || 2}px solid ${child.props?.borderColor || '#f59e0b'}`,
                           borderRadius: '6px'
                         }} />
                       )
                     }
                    if (child.type === 'line' || child.type === 'arrow') {
                      const horizontal = (child.size.width || 0) >= (child.size.height || 0)
                      const stroke = child.props?.lineColor || '#111827'
                      const thickness = Math.max(1, Number(child.props?.thickness) || 2)
                      const w = Math.max(1, child.size.width)
                      const h = Math.max(1, child.size.height)
                      const x1 = 0
                      const y1 = horizontal ? h / 2 : 0
                      const x2 = horizontal ? w : 0
                      const y2 = horizontal ? h / 2 : h
                      let arrowPoints = ''
                      if (child.type === 'arrow') {
                        const head = 6 + thickness
                        if (horizontal) arrowPoints = `${w - head},${y2 - head} ${w},${y2} ${w - head},${y2 + head}`
                      }
                      return (
                        <svg width="100%" height="100%" style={{ display: 'block' }}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={thickness} />
                          {child.type === 'arrow' && arrowPoints && (<polygon points={arrowPoints} fill={stroke} />)}
                        </svg>
                      )
                    }
                    return (
                      <div style={{
                        ...baseStyle,
                        background: child.backgroundColor || '#ffffff', borderRadius: child.props?.borderRadius ? `${child.props.borderRadius}px` : '12px',
                        border: '1px solid #e5e7eb', boxShadow: child.props?.shadowBlur ? baseStyle.boxShadow as any : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
                      }} className="text-sm text-gray-700">{child.name}</div>
                    )
                  }

                  return (
                    <div
                      key={component.id}
                      id={`comp-${component.id}`}
                      data-component-id={component.id}
                      onClick={(e) => {
    e.stopPropagation()
                        setSelectedComponentId(component.id)
                        setRightSidebarVisible(true)
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setSelectedComponentId(component.id)
                        setRightSidebarVisible(true)
                      }}
                      onMouseDown={(e) => handleComponentMouseDown(e, component, screen.id)}
                      className={`absolute cursor-pointer transition-all component-hover ${
                        selectedComponent?.id === component.id
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : 'hover:ring-1 hover:ring-gray-300'
                      }`}
                      style={{
                        left: component.position.x,
                        top: component.position.y,
                        width: component.size.width,
                        height: component.size.height,
                        zIndex: component.zIndex,
                        cursor: draggingComponentId === component.id ? 'grabbing' : 'grab'
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleNestedDrop(e, screen.id, component.id)}
                    >
                      {renderComponentContent()}
                      {/* Render nested children inside this container */}
                      {renderNestedChildren(component.children)}
                      {/* Resize handles */}
                      <div className="absolute inset-0 pointer-events-none" style={{ display: selectedComponent?.id === component.id ? 'block' : 'none' }}>
                        {/* Corner handles only */}
                        <button className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-gray-300 rounded cursor-nw-resize" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 'nw')} aria-label="Resize nw" />
                        <button className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-gray-300 rounded cursor-ne-resize" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 'ne')} aria-label="Resize ne" />
                        <button className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-gray-300 rounded cursor-sw-resize" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 'sw')} aria-label="Resize sw" />
                        <button className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-gray-300 rounded cursor-se-resize" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 'se')} aria-label="Resize se" />
                        {/* Invisible edge hit areas for resize from any side */}
                        <div
                          className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
                          style={{ pointerEvents: 'auto' }}
                          onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 'n')}
                          aria-label="Resize n"
                        />
                        <div
                          className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
                          style={{ pointerEvents: 'auto' }}
                          onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 's')}
                          aria-label="Resize s"
                        />
                        <div
                          className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
                          style={{ pointerEvents: 'auto' }}
                          onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 'w')}
                          aria-label="Resize w"
                        />
                        <div
                          className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
                          style={{ pointerEvents: 'auto' }}
                          onMouseDown={(e) => handleResizeMouseDown(e, component, screen.id, 'e')}
                          aria-label="Resize e"
                        />
                      </div>
                    </div>
                                    )
                  })}
                </div>
              </div>
            )
          }))}
          </div>
        </div>
          </div>

      {/* Right Sidebar - Properties Panel */}
      {rightSidebarVisible && selectedComponent && !isFullScreen && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-60 shadow-lg">
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Component Properties</h3>
                <button
                  onClick={() => {
              setSelectedComponentId(null)
                    setRightSidebarVisible(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
            </div>
              
              <div className="space-y-4">
                {/* Position section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Position</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                      <input
                        type="number"
                        value={selectedComponent.position.x}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          position: { ...selectedComponent.position, x: Number(e.target.value) }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                      <input
                        type="number"
                        value={selectedComponent.position.y}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          position: { ...selectedComponent.position, y: Number(e.target.value) }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={selectedComponent.size.width}
                        onChange={(e) => {
                          const parsed = Number(e.target.value)
                          if (Number.isNaN(parsed)) return
                          const width = Math.max(1, parsed)
                          updateComponent(selectedComponent.id, { size: { ...selectedComponent.size, width } })
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={selectedComponent.size.height}
                        onChange={(e) => {
                          const parsed = Number(e.target.value)
                          if (Number.isNaN(parsed)) return
                          const height = Math.max(1, parsed)
                          updateComponent(selectedComponent.id, { size: { ...selectedComponent.size, height } })
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rotation</label>
                      <input
                        type="number"
                        step={1}
                        value={selectedComponent.rotation || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { rotation: Number(e.target.value) })}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Layout section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Layout</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Flow</label>
                      <select
                        value={selectedComponent.props?.flow || 'none'}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, flow: e.target.value } })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="none">None</option>
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedComponent.props?.padding || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, padding: Number(e.target.value) } })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Appearance</h4>
                  
                  {/* Background Color with Color Space and Alpha */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                    {(() => {
                      const current = selectedComponent.backgroundColor || '#ffffff'
                      const space = getColorSpaceFromString(current)
                      let srgbHex = '#ffffff'
                      let alpha = 1
                      let p3 = { r: 1, g: 1, b: 1 }
                      if (space === 'srgb') {
                        // parse hex or rgba
                        const asRgba = parseRgba(current)
                        if (asRgba) {
                          srgbHex = rgbToHex(asRgba.r, asRgba.g, asRgba.b)
                          alpha = asRgba.a
                        } else {
                          const h = parseHex(current)
                          if (h) {
                            srgbHex = rgbToHex(h.r, h.g, h.b)
                            alpha = selectedComponent.props?.opacity ?? 1
                          }
                        }
                      } else {
                        const p = parseP3(current)
                        if (p) { p3 = { r: p.r, g: p.g, b: p.b }; alpha = p.a }
                      }
                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <button
                              className={`px-2 py-1 rounded border ${space==='srgb'?'border-blue-400 text-blue-600':'border-gray-200 text-gray-700'}`}
                              onClick={() => {
                                // convert from p3 to srgb approximately by scaling [0..1] to 0..255
                                if (space === 'p3') {
                                  const p = parseP3(current)
                                  const r = Math.round((p?.r ?? 1) * 255)
                                  const g = Math.round((p?.g ?? 1) * 255)
                                  const b = Math.round((p?.b ?? 1) * 255)
                                  const hex = rgbToHex(r, g, b)
                                  updateComponent(selectedComponent.id, { backgroundColor: buildSrgbCss(hex, p?.a ?? 1) })
                                }
                              }}
                            >sRGB</button>
                            <button
                              className={`px-2 py-1 rounded border ${space==='p3'?'border-blue-400 text-blue-600':'border-gray-200 text-gray-700'}`}
                              onClick={() => {
                                if (space === 'srgb') {
                                  const h = parseHex(srgbHex)
                                  if (h) {
                                    updateComponent(selectedComponent.id, { backgroundColor: buildP3Css(h.r/255, h.g/255, h.b/255, alpha) })
                                  }
                                }
                              }}
                            >P3</button>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">A</span>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={alpha}
                                onChange={(e) => {
                                  const a = Number(e.target.value)
                                  if (space === 'srgb') {
                                    updateComponent(selectedComponent.id, { backgroundColor: buildSrgbCss(srgbHex, a) })
                                  } else {
                                    updateComponent(selectedComponent.id, { backgroundColor: buildP3Css(p3.r, p3.g, p3.b, a) })
                                  }
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                          {space === 'srgb' ? (
                            <div className="flex space-x-2">
                              <input
                                type="color"
                                value={srgbHex}
                                onChange={(e) => updateComponent(selectedComponent.id, { backgroundColor: buildSrgbCss(e.target.value, alpha) })}
                                className="w-10 h-8 border border-gray-200 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={srgbHex}
                                onChange={(e) => updateComponent(selectedComponent.id, { backgroundColor: buildSrgbCss(e.target.value, alpha) })}
                                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                                placeholder="#ffffff"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                {(['r','g','b'] as const).map((ch, idx) => (
                                  <div key={ch} className="flex items-center space-x-1">
                                    <span className="text-xs text-gray-500">{ch.toUpperCase()}</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={1}
                                      step={0.01}
                                      value={idx===0? p3.r : idx===1? p3.g : p3.b}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(1, Number(e.target.value)))
                                        const next = { r: p3.r, g: p3.g, b: p3.b }
                                        if (idx===0) next.r = v; else if (idx===1) next.g = v; else next.b = v
                                        updateComponent(selectedComponent.id, { backgroundColor: buildP3Css(next.r, next.g, next.b, alpha) })
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                              {/* P3 color input box (mapped via sRGB picker) */}
                              <div className="flex space-x-2 items-center">
                                {(() => {
                                  const hexFromP3 = rgbToHex(Math.round(p3.r*255), Math.round(p3.g*255), Math.round(p3.b*255))
                                  return (
                                    <>
                                      <input
                                        type="color"
                                        value={hexFromP3}
                                        onChange={(e) => {
                                          const h = parseHex(e.target.value)
                                          if (h) {
                                            updateComponent(selectedComponent.id, { backgroundColor: buildP3Css(h.r/255, h.g/255, h.b/255, alpha) })
                                          }
                                        }}
                                        className="w-10 h-8 border border-gray-200 rounded cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        value={`color(display-p3 ${p3.r.toFixed(3)} ${p3.g.toFixed(3)} ${p3.b.toFixed(3)} / ${alpha.toFixed(2)})`}
                                        onChange={(e) => {
                                          const parsed = parseP3(e.target.value)
                                          if (parsed) {
                                            updateComponent(selectedComponent.id, { backgroundColor: buildP3Css(parsed.r, parsed.g, parsed.b, parsed.a) })
                                          }
                                        }}
                                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                                      />
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Stroke */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stroke</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={selectedComponent.props?.borderWidth || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, borderWidth: Number(e.target.value) }
                        })}
                        className="px-2 py-1 text-xs border border-gray-200 rounded"
                        placeholder="Width"
                      />
                      <input
                        type="color"
                        value={selectedComponent.props?.borderColor || '#000000'}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, borderColor: e.target.value }
                        })}
                        className="w-full h-7 border border-gray-200 rounded cursor-pointer"
                      />
                    </div>
                    <div className="mt-1">
                      <select
                        value={selectedComponent.props?.borderStyle || 'solid'}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, borderStyle: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>

                  {/* Corner Radius */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Corner Radius</label>
                    <input
                      type="number"
                      value={selectedComponent.props?.borderRadius || 0}
                      onChange={(e) => updateComponent(selectedComponent.id, { 
                        props: { ...selectedComponent.props, borderRadius: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      placeholder="0"
                    />
                  </div>

                  {/* Shadow */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Shadow</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={selectedComponent.props?.shadowBlur || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, shadowBlur: Number(e.target.value) }
                        })}
                        className="px-2 py-1 text-xs border border-gray-200 rounded"
                        placeholder="Blur"
                      />
                      <input
                        type="color"
                        value={selectedComponent.props?.shadowColor || '#000000'}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, shadowColor: e.target.value }
                        })}
                        className="w-full h-7 border border-gray-200 rounded cursor-pointer"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        value={selectedComponent.props?.shadowX || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, shadowX: Number(e.target.value) }
                        })}
                        className="px-2 py-1 text-xs border border-gray-200 rounded"
                        placeholder="X offset"
                      />
                      <input
                        type="number"
                        value={selectedComponent.props?.shadowY || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, shadowY: Number(e.target.value) }
                        })}
                        className="px-2 py-1 text-xs border border-gray-200 rounded"
                        placeholder="Y offset"
                      />
                    </div>
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedComponent.props?.opacity || 1}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, opacity: Number(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500 w-8">
                        {Math.round((selectedComponent.props?.opacity || 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Typography Section - Only for text components */}
                {selectedComponent.type === 'text' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Typography</h4>
                    
                    {/* Text Content */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                      <textarea
                        value={selectedComponent.props?.text || ''}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, text: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded resize-none"
                        rows={3}
                        placeholder="Enter text..."
                      />
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={selectedComponent.props?.fontFamily || 'Inter'}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, fontFamily: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                      </select>
                    </div>

                    {/* Font Size & Weight */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                        <input
                          type="number"
                          value={selectedComponent.props?.fontSize || 16}
                          onChange={(e) => updateComponent(selectedComponent.id, { 
                            props: { ...selectedComponent.props, fontSize: Number(e.target.value) }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                          min="8"
                          max="72"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                        <select
                          value={selectedComponent.props?.fontWeight || 'normal'}
                          onChange={(e) => updateComponent(selectedComponent.id, { 
                            props: { ...selectedComponent.props, fontWeight: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        >
                          <option value="100">Thin</option>
                          <option value="200">Extra Light</option>
                          <option value="300">Light</option>
                          <option value="normal">Normal</option>
                          <option value="500">Medium</option>
                          <option value="600">Semi Bold</option>
                          <option value="bold">Bold</option>
                          <option value="800">Extra Bold</option>
                          <option value="900">Black</option>
                        </select>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={selectedComponent.props?.color || '#000000'}
                          onChange={(e) => updateComponent(selectedComponent.id, { 
                            props: { ...selectedComponent.props, color: e.target.value }
                          })}
                          className="w-10 h-8 border border-gray-200 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedComponent.props?.color || '#000000'}
                          onChange={(e) => updateComponent(selectedComponent.id, { 
                            props: { ...selectedComponent.props, color: e.target.value }
                          })}
                          className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Text Align</label>
                      <div className="flex space-x-1">
                        {[
                          { value: 'left', icon: AlignLeft },
                          { value: 'center', icon: AlignCenter },
                          { value: 'right', icon: AlignRight },
                          { value: 'justify', icon: AlignJustify }
                        ].map(({ value, icon: Icon }) => (
        <button
                            key={value}
                            onClick={() => updateComponent(selectedComponent.id, { 
                              props: { ...selectedComponent.props, textAlign: value }
                            })}
                            className={`p-2 border border-gray-200 rounded ${
                              selectedComponent.props?.textAlign === value 
                                ? 'bg-blue-100 border-blue-500' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={12} />
        </button>
                        ))}
      </div>
                    </div>

                    {/* Line Height */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Line Height</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedComponent.props?.lineHeight || 1.2}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, lineHeight: Number(e.target.value) }
                        })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        min="0.5"
                        max="3"
                      />
                    </div>

                    {/* Letter Spacing */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Letter Spacing</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedComponent.props?.letterSpacing || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { 
                          props: { ...selectedComponent.props, letterSpacing: Number(e.target.value) }
                        })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        min="-2"
                        max="10"
                      />
        </div>

                  {/* Word Spacing */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Word Spacing</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedComponent.props?.wordSpacing || 0}
                      onChange={(e) => updateComponent(selectedComponent.id, {
                        props: { ...selectedComponent.props, wordSpacing: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      min="-10"
                      max="50"
                    />
                  </div>

                  {/* White Space */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">White Space</label>
                    <select
                      value={selectedComponent.props?.whiteSpace || 'normal'}
                      onChange={(e) => updateComponent(selectedComponent.id, {
                        props: { ...selectedComponent.props, whiteSpace: e.target.value }
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                    >
                      <option value="normal">normal</option>
                      <option value="nowrap">nowrap</option>
                      <option value="pre">pre</option>
                      <option value="pre-wrap">pre-wrap</option>
                      <option value="pre-line">pre-line</option>
                    </select>
                  </div>
                  </div>
      )}

      {/* Right Sidebar - Frame Presets (when Frame tool active and nothing selected) */}
      {rightSidebarVisible && !selectedComponent && activeTool === 'frame' && !isFullScreen && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-60 shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Frame Presets</h3>
            <button onClick={() => setRightSidebarVisible(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">iOS</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'iPhone SE', width: 375, height: 667, type: 'mobile' as const, icon: Smartphone },
                  { name: 'iPhone 14', width: 390, height: 844, type: 'mobile' as const, icon: Smartphone },
                  { name: 'iPhone 14 Plus', width: 428, height: 926, type: 'mobile' as const, icon: Smartphone },
                  { name: 'iPad', width: 768, height: 1024, type: 'tablet' as const, icon: Tablet }
                ].map((preset) => (
                  <button key={preset.name} onClick={() => handleAddScreen(preset)} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 text-left flex items-center space-x-2">
                    <preset.icon className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">{preset.name}</div>
                      <div className="text-[11px] text-gray-500">{preset.width} × {preset.height}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">Android</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Android Small', width: 360, height: 640, type: 'mobile' as const, icon: Smartphone },
                  { name: 'Android Medium', width: 411, height: 891, type: 'mobile' as const, icon: Smartphone },
                  { name: 'Android Large', width: 480, height: 960, type: 'mobile' as const, icon: Smartphone }
                ].map((preset) => (
                  <button key={preset.name} onClick={() => handleAddScreen(preset)} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 text-left flex items-center space-x-2">
                    <preset.icon className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">{preset.name}</div>
                      <div className="text-[11px] text-gray-500">{preset.width} × {preset.height}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

                {selectedComponent.type === 'button' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={selectedComponent.props?.text || ''}
                      onChange={(e) => updateComponent(selectedComponent.id, { 
                        props: { ...selectedComponent.props, text: e.target.value }
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                        <input
                          type="color"
                          value={selectedComponent.props?.color || '#ffffff'}
                          onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, color: e.target.value } })}
                          className="w-full h-8 border border-gray-200 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Variant</label>
                        <select
                          value={selectedComponent.props?.variant || 'primary'}
                          onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, variant: e.target.value } })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                          <option value="ghost">Ghost</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Gradient End</label>
                        <input
                          type="text"
                          placeholder="#8b5cf6"
                          value={selectedComponent.props?.gradient || ''}
                          onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, gradient: e.target.value } })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        />
                      </div>
                    </div>
                </div>
                )}

                {selectedComponent.type === 'text' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium text-gray-700">Style</label>
                      <button
                        onClick={() => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, italic: !selectedComponent.props?.italic } })}
                        className={`px-2 py-1 text-xs border rounded ${selectedComponent.props?.italic ? 'bg-blue-100 border-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                      >Italic</button>
                      <button
                        onClick={() => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, underline: !selectedComponent.props?.underline } })}
                        className={`px-2 py-1 text-xs border rounded ${selectedComponent.props?.underline ? 'bg-blue-100 border-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                      >Underline</button>
                      <select
                        value={selectedComponent.props?.textTransform || 'none'}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, textTransform: e.target.value } })}
                        className="px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="none">None</option>
                        <option value="uppercase">Uppercase</option>
                        <option value="lowercase">Lowercase</option>
                        <option value="capitalize">Capitalize</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'image' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={selectedComponent.props?.src || ''}
                      onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, src: e.target.value } })}
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, src: String(reader.result || '') } })
                          }
                          reader.readAsDataURL(file)
                        }}
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Alt Text</label>
                        <input
                          type="text"
                          value={selectedComponent.props?.alt || ''}
                          onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, alt: e.target.value } })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fit</label>
                        <select
                          value={selectedComponent.props?.objectFit || 'cover'}
                          onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, objectFit: e.target.value } })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        >
                          <option value="cover">Cover</option>
                          <option value="contain">Contain</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedComponent.type === 'line' || selectedComponent.type === 'arrow') && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Line Color</label>
                      <input
                        type="color"
                        value={selectedComponent.props?.lineColor || '#111827'}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, lineColor: e.target.value } })}
                        className="w-full h-8 border border-gray-200 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Thickness</label>
                      <input
                        type="number"
                        min={1}
                        value={selectedComponent.props?.thickness || 2}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, thickness: Math.max(1, Number(e.target.value) || 1) } })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'input' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={selectedComponent.props?.placeholder || ''}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, placeholder: e.target.value } })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={selectedComponent.props?.type || 'text'}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, type: e.target.value } })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="password">Password</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                  </div>
                )}

                {(selectedComponent.type === 'container' || selectedComponent.type === 'card') && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedComponent.props?.padding || 0}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, padding: Number(e.target.value) } })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="text-xs font-medium text-gray-700 mr-2">Shadow</label>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedComponent.props?.shadowBlur)}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, shadowBlur: e.target.checked ? (selectedComponent.props?.shadowBlur || 12) : 0 } })}
                        className="mt-1"
                      />
                    </div>
                </div>
                )}

                {selectedComponent.type === 'frame' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
                      <select
                        value={selectedComponent.props?.platform || 'android'}
                        onChange={(e) => updateComponent(selectedComponent.id, { props: { ...selectedComponent.props, platform: e.target.value } })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="android">Android</option>
                        <option value="ios">iOS</option>
                        <option value="web">Web</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Preset</label>
                      <select
                        value={selectedComponent.props?.preset || 'custom'}
                        onChange={(e) => {
                          const preset = e.target.value
                          let width = selectedComponent.size.width
                          let height = selectedComponent.size.height
                          const platform = selectedComponent.props?.platform || 'android'
                          // Common device ratios/sizes
                          const presets: Record<string, { w: number; h: number }> = {
                            // Android
                            'android-small': { w: 360, h: 640 },
                            'android-medium': { w: 411, h: 891 },
                            'android-large': { w: 480, h: 960 },
                            // iOS
                            'ios-iphone-se': { w: 375, h: 667 },
                            'ios-iphone-14': { w: 390, h: 844 },
                            'ios-iphone-14-plus': { w: 428, h: 926 },
                            'ios-ipad': { w: 768, h: 1024 },
                            // Web
                            'web-mobile': { w: 390, h: 844 },
                            'web-tablet': { w: 768, h: 1024 },
                            'web-desktop': { w: 1440, h: 900 }
                          }
                          let key = 'web-desktop'
                          if (platform === 'android') key = 'android-medium'
                          if (platform === 'ios') key = 'ios-iphone-14'
                          if (preset !== 'custom') {
                            const size = presets[preset] || presets[key]
                            width = size.w
                            height = size.h
                          }
                          updateComponent(selectedComponent.id, {
                            props: { ...selectedComponent.props, preset },
                            size: { width, height }
                          })
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="custom">Custom</option>
                        <optgroup label="Android">
                          <option value="android-small">Small (360×640)</option>
                          <option value="android-medium">Medium (411×891)</option>
                          <option value="android-large">Large (480×960)</option>
                        </optgroup>
                        <optgroup label="iOS">
                          <option value="ios-iphone-se">iPhone SE (375×667)</option>
                          <option value="ios-iphone-14">iPhone 14 (390×844)</option>
                          <option value="ios-iphone-14-plus">iPhone 14 Plus (428×926)</option>
                          <option value="ios-ipad">iPad (768×1024)</option>
                        </optgroup>
                        <optgroup label="Web">
                          <option value="web-mobile">Mobile (390×844)</option>
                          <option value="web-tablet">Tablet (768×1024)</option>
                          <option value="web-desktop">Desktop (1440×900)</option>
                        </optgroup>
                      </select>
                    </div>
                </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                  <button
                      onClick={() => {
                        const newComponent = { 
                          ...selectedComponent, 
                          id: `component-${Date.now()}`, 
                          name: `${selectedComponent.name} Copy`,
                          position: { 
                            x: selectedComponent.position.x + 20, 
                            y: selectedComponent.position.y + 20 
                          }
                        }
    addComponent(newComponent)
      setSelectedComponentId(newComponent.id)
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <Copy size={12} className="inline mr-1" />
                      Copy
                  </button>
                  <button
                      onClick={() => {
                        deleteComponent(selectedComponent.id)
                        setSelectedComponentId(null)
                        setRightSidebarVisible(false)
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      <Trash2 size={12} className="inline mr-1" />
                      Delete
                  </button>
                </div>
              </div>
            </div>
            </div>
        </div>
          </div>
        )}

      {/* Mode Navigation Buttons - Bottom Right */}
      <div className="fixed bottom-4 right-4 flex space-x-2 z-50">
                  <button
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
                  >
          <Layout className="h-4 w-4" />
          <span className="text-sm font-medium">Design</span>
                  </button>
                  <button
          onClick={() => navigateToMode('logic')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        >
          <GitBranch className="h-4 w-4" />
          <span className="text-sm font-medium">Logic</span>
        </button>
        <button
          onClick={() => navigateToMode('code')}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg hover:bg-purple-600 transition-colors"
        >
          <Code className="h-4 w-4" />
          <span className="text-sm font-medium">Code</span>
                  </button>
        </div>
      </div>
    )
  }