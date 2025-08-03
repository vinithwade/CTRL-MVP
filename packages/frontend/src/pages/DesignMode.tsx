import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigation } from '../contexts/NavigationContext'
import { useDesign, Component } from '../contexts/DesignContext'
import { useNavigate } from 'react-router-dom'
import { ProjectService } from '@/services/projectService'
import { 
  Move,
  RotateCcw, 
  Trash2, 
  Eye, 
  Layers, 
  Settings, 
  Palette, 
  Square, 
  ChevronDown,
  Layout,
  Database,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  Code,
  Circle,
  Triangle,
  Type,
  Image,
  MousePointer,
  PenTool,
  Minus
} from 'lucide-react'

interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  components: Component[]
}

interface Variable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  value: any
  scope: 'global' | 'local'
}

interface Screen {
  id: string
  name: string
  width: number
  height: number
  type: 'mobile' | 'tablet' | 'desktop' | 'custom'
  layers: Layer[]
  activeLayer: string
}

interface DesignModeProps {
  projectId?: string
}

export function DesignMode({ projectId }: DesignModeProps) {
  const navigate = useNavigate();
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
    deleteComponent
  } = useDesign()
  
  // Add state for project information
  const [projectInfo, setProjectInfo] = useState<{ name: string; language: string; device: string } | null>(null)
  const [loadingProject, setLoadingProject] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false) // Add loading state to prevent save during load
  const [hasLoadedData, setHasLoadedData] = useState(false) // Track if data has been loaded
  const [isSaving, setIsSaving] = useState(false) // Add saving state indicator
  const [savedIndicator, setSavedIndicator] = useState(false) // Add saved indicator
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Component resizing state
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null)
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })
  const [showScreenSelector, setShowScreenSelector] = useState(false)
  
  // Drag and drop from library state
  const [isDraggingFromLibrary, setIsDraggingFromLibrary] = useState(false)
  const [draggedComponentType, setDraggedComponentType] = useState<string | null>(null)
  
  const [variables, setVariables] = useState<Variable[]>([])
  const [activeTab, setActiveTab] = useState<'file' | 'assets'>('file')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Sidebar collapse states
  const [sidebarStates, setSidebarStates] = useState({
    library: true,
    screens: true,
    layers: true
  })
  
  // Sidebar visibility state
  const [sidebarVisible, setSidebarVisible] = useState(true)
  
  // Screen positions for dragging
  const [screenPositions, setScreenPositions] = useState<{[key: string]: {x: number, y: number}}>({})
  const [draggedScreen, setDraggedScreen] = useState<string | null>(null)
  const [screenDragOffset, setScreenDragOffset] = useState({ x: 0, y: 0 })

  // Cross-screen component dragging
  const [isDraggingComponent, setIsDraggingComponent] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState<Component | null>(null)
  const [sourceScreenId, setSourceScreenId] = useState<string | null>(null)
  const [sourceLayerId, setSourceLayerId] = useState<string | null>(null)

  const currentScreen = screens.find(screen => screen.id === activeScreen)
  const currentLayer = currentScreen?.layers.find(layer => layer.id === currentScreen.activeLayer)
  
  // Keep selectedComponent in sync with actual component data
  const selectedComponentData = selectedComponent 
    ? currentLayer?.components.find(comp => comp.id === selectedComponent.id) || null
    : null

  // Debug logging for Properties panel sync
  useEffect(() => {
    if (selectedComponentData) {
      console.log('Properties panel synced with component:', selectedComponentData)
    }
  }, [selectedComponentData])

  // Debug loading state changes
  useEffect(() => {
    console.log('Loading state changed:', { isLoadingData, hasLoadedData })
  }, [isLoadingData, hasLoadedData])

  // Monitor screens changes and ensure proper loading
  useEffect(() => {
    console.log('Screens changed:', { 
      screensCount: screens.length, 
      hasLoadedData, 
      isLoadingData,
      activeScreen,
      screenNames: screens.map(s => s.name)
    })
    
    // If we have loaded data and screens, but no active screen, set the first one
    if (hasLoadedData && !isLoadingData && screens.length > 0 && !activeScreen) {
      console.log('Setting first screen as active after load')
      setActiveScreen(screens[0].id)
    }
  }, [screens, hasLoadedData, isLoadingData, activeScreen, setActiveScreen])

  // Save project data functionality
  const saveProjectData = useCallback(async () => {
    if (!projectId) {
      console.warn('No project ID available for saving')
      return
    }

    // Prevent saving while loading data
    if (isLoadingData) {
      console.log('Skipping save - data is currently loading')
      return
    }

    // Prevent multiple simultaneous saves
    if (isSaving) {
      console.log('Save already in progress, skipping...')
      return
    }

    setIsSaving(true) // Set saving state
    
    // Add a timeout to prevent stuck saving state
    const saveTimeout = setTimeout(() => {
      console.warn('Save timeout reached, clearing saving state')
      setIsSaving(false)
    }, 10000) // 10 second timeout
    
    try {
      console.log('=== STARTING SAVE PROJECT DATA ===')
      console.log('Saving project data with', screens.length, 'screens')
      console.log('Screens data:', screens)
      console.log('Active screen:', activeScreen)
      console.log('Screen positions:', screenPositions)
      
      const designData = {
        screens, // Save screens to persist them
        activeScreen,
        variables,
        zoom,
        pan,
        sidebarStates,
        screenPositions
      }

      console.log('Saving design data:', designData)
      const result = await ProjectService.saveProjectData(projectId, 'design', designData)
      console.log('Project design data saved successfully:', result)
      console.log('=== SAVE PROJECT DATA COMPLETED ===')
    } catch (error) {
      console.error('Error saving project data:', error)
    } finally {
      clearTimeout(saveTimeout) // Clear the timeout
      // Ensure saving state is cleared with a small delay to show the saved state
      setTimeout(() => {
        setIsSaving(false)
        setSavedIndicator(true) // Show saved indicator
        console.log('Save completed, clearing saving state')
        
        // Hide saved indicator after 2 seconds
        setTimeout(() => {
          setSavedIndicator(false)
        }, 2000)
      }, 500)
    }
  }, [projectId, screens, activeScreen, variables, zoom, pan, sidebarStates, screenPositions, isLoadingData])

  // Manual save function
  const manualSave = useCallback(async () => {
    console.log('Manual save triggered')
    await saveProjectData()
  }, [saveProjectData])

  // Load project data functionality
  const loadProjectData = useCallback(async () => {
    if (!projectId) {
      console.warn('No project ID available for loading')
      return
    }

    console.log('=== STARTING LOAD PROJECT DATA ===')
    console.log('Project ID:', projectId)
    console.log('Current screens before load:', screens.length)
    console.log('Current active screen:', activeScreen)
    
    setIsLoadingData(true) // Set loading state to prevent saves
    try {
      console.log('Loading project data for projectId:', projectId)
      const designData = await ProjectService.getProjectData(projectId, 'design')
      
      console.log('Raw design data from service:', designData)
      
      if (designData && designData.data) {
        console.log('Found saved design data:', designData.data)
        const { screens: savedScreens, activeScreen: savedActiveScreen, variables: savedVariables, zoom: savedZoom, pan: savedPan, sidebarStates: savedSidebarStates, screenPositions: savedScreenPositions } = designData.data
        
        console.log('Parsed saved screens:', savedScreens)
        console.log('Saved active screen:', savedActiveScreen)
        
        // Always restore screens if they exist, regardless of current screens length
        if (savedScreens && Array.isArray(savedScreens) && savedScreens.length > 0) {
          console.log('Restoring', savedScreens.length, 'screens from saved data')
          console.log('Current screens before restore:', screens.length)
          
          // Clear existing screens first to ensure clean state
          screens.forEach(screen => {
            console.log('Removing existing screen:', screen.name, screen.id)
            deleteScreen(screen.id)
          })
          
          // Add saved screens
          savedScreens.forEach((screen: Screen) => {
            console.log('Adding saved screen:', screen.name, screen.id)
            addScreen(screen)
          })
        
          console.log('Screens restored successfully. New count:', screens.length + savedScreens.length)
          
          // Set active screen after a short delay to ensure screens are loaded
          setTimeout(() => {
        if (savedActiveScreen) {
              console.log('Setting saved active screen after delay:', savedActiveScreen)
          setActiveScreen(savedActiveScreen)
            } else if (savedScreens.length > 0) {
              console.log('Setting first screen as active after delay')
              setActiveScreen(savedScreens[0].id)
            }
          }, 100)
        } else {
          console.log('No saved screens found in design data')
        }
        
        // Restore other state after screens are loaded
        if (savedVariables) {
          console.log('Restoring variables')
          setVariables(savedVariables)
        }
        
        if (savedZoom) {
          console.log('Restoring zoom:', savedZoom)
          setZoom(savedZoom)
        }
        
        if (savedPan) {
          console.log('Restoring pan:', savedPan)
          setPan(savedPan)
        }
        
        if (savedSidebarStates) {
          console.log('Restoring sidebar states')
          setSidebarStates(savedSidebarStates)
        }
        
        if (savedScreenPositions) {
          console.log('Restoring screen positions')
          setScreenPositions(savedScreenPositions)
        }
        
        console.log('Project design data loaded successfully')
      } else {
        console.log('No saved design data found - this is a new project')
      }
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      console.log('Loading completed, clearing loading state')
      console.log('Final screens count:', screens.length)
      console.log('Final active screen:', activeScreen)
      console.log('=== LOAD PROJECT DATA COMPLETED ===')
      setIsLoadingData(false) // Clear loading state
      setHasLoadedData(true) // Mark as loaded
    }
  }, [projectId, addScreen, setActiveScreen, setVariables, setZoom, setPan, setSidebarStates, setScreenPositions, screens, deleteScreen])

  // Auto-save functionality
  useEffect(() => {
    if (projectId) {
      const autoSaveInterval = setInterval(() => {
        console.log('Auto-saving project data...')
        saveProjectData()
      }, 30000) // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval)
    }
  }, [projectId, saveProjectData])

  // Save when screens change - with guard to prevent infinite loop
  useEffect(() => {
    if (projectId && screens.length > 0 && !isLoadingData && !isSaving) {
      // Add a longer delay to prevent rapid saves
      const timeoutId = setTimeout(() => {
        console.log('Screens changed, saving project data...')
        saveProjectData()
      }, 10000) // 10 second delay to prevent rapid saves

      return () => clearTimeout(timeoutId)
    }
  }, [projectId, screens.length, saveProjectData, isLoadingData, isSaving]) // Use screens.length instead of screens to prevent unnecessary saves

  // Save when active screen changes
  useEffect(() => {
    if (projectId && activeScreen && !isLoadingData && !isSaving) {
      console.log('Active screen changed, saving project data...')
      saveProjectData()
    }
  }, [projectId, activeScreen, saveProjectData, isLoadingData, isSaving])

  // Save when screen positions change
  useEffect(() => {
    if (projectId && Object.keys(screenPositions).length > 0 && !isLoadingData && !isSaving) {
      console.log('Screen positions changed, saving project data...')
      saveProjectData()
    }
  }, [projectId, screenPositions, saveProjectData, isLoadingData, isSaving])

  // Load project data on mount - only once
  useEffect(() => {
    if (projectId) {
      console.log('Loading project data on mount for projectId:', projectId)
      
      // Reset loading states to ensure fresh load
      setIsLoadingData(false)
      setHasLoadedData(false)
      
      // Add timeout to prevent infinite loading
      const loadTimeout = setTimeout(() => {
        if (isLoadingData) {
          console.warn('Loading timeout reached, clearing loading state')
          setIsLoadingData(false)
          setHasLoadedData(true)
        }
      }, 5000) // 5 second timeout
      
      // Force load after a short delay to ensure context is ready
      setTimeout(() => {
      loadProjectData()
      }, 100)
      
      return () => clearTimeout(loadTimeout)
    }
  }, [projectId]) // Remove loadProjectData from dependencies to prevent infinite loop

  // Local update function that ensures proper synchronization
  const updateComponentLocal = (componentId: string, updates: Partial<Component>) => {
    console.log('Updating component:', componentId, 'with updates:', updates)
    
    // Update in global context
    updateComponent(componentId, updates)
    
    // Also update in current screen's layers
    if (currentScreen && currentLayer) {
      const updatedLayers = currentScreen.layers.map(layer => ({
        ...layer,
        components: layer.components.map(comp => 
          comp.id === componentId ? { ...comp, ...updates } : comp
        )
      }))
      
      updateScreen(activeScreen!, {
        layers: updatedLayers
      })
      
      console.log('Component updated in both global context and screen layers')
      
      // Trigger save when component is modified
      if (projectId) {
        console.log('Component modified, triggering save...')
        // Add a small delay to prevent rapid saves
        setTimeout(() => {
          if (!isSaving && !isLoadingData) {
            saveProjectData()
          }
        }, 2000) // 2 second delay to prevent rapid saves
      }
    }
  }

  const componentLibrary = [
    { type: 'container', name: 'Container', icon: Layout },
    { type: 'text', name: 'Text', icon: Palette },
    { type: 'button', name: 'Button', icon: Settings },
    { type: 'input', name: 'Input', icon: Database },
    { type: 'image', name: 'Image', icon: Eye },
    { type: 'form', name: 'Form', icon: Database },
    { type: 'list', name: 'List', icon: Layers },
    { type: 'table', name: 'Table', icon: Layout },
    { type: 'chart', name: 'Chart', icon: Palette },
    { type: 'map', name: 'Map', icon: Eye },
    { type: 'video', name: 'Video', icon: Eye },
    { type: 'audio', name: 'Audio', icon: Eye },
    { type: 'canvas', name: 'Canvas', icon: Layout },
    { type: 'svg', name: 'SVG', icon: Palette },
    { type: 'webgl', name: 'WebGL', icon: Layout },
    { type: 'vr', name: 'VR', icon: Eye },
    { type: 'ar', name: 'AR', icon: Eye },
    { type: '3d', name: '3D', icon: Layout }
  ]

  // Component preview renderer for library
  const renderComponentPreview = (componentType: string) => {
    switch (componentType) {
      case 'container':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="flex-1 bg-white rounded border border-gray-200 p-1">
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded"></div>
            </div>
          </div>
        )
      case 'text':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-3/4 h-2 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-1 bg-gray-200 rounded mb-1"></div>
            <div className="w-2/3 h-1 bg-gray-200 rounded"></div>
          </div>
        )
      case 'button':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-16 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md shadow-sm flex items-center justify-center">
              <div className="w-8 h-1 bg-white bg-opacity-80 rounded"></div>
            </div>
          </div>
        )
      case 'input':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-1/2 h-1 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-4 bg-white border border-gray-300 rounded-md"></div>
          </div>
        )
      case 'image':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )
      case 'form':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-2/3 h-1 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-3 bg-white border border-gray-300 rounded mb-1"></div>
            <div className="w-full h-3 bg-white border border-gray-300 rounded mb-1"></div>
            <div className="w-full h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
          </div>
        )
      case 'list':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-1/2 h-1 bg-gray-300 rounded mb-1"></div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 border border-gray-400 rounded"></div>
                <div className="w-8 h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 border border-gray-400 rounded"></div>
                <div className="w-6 h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 border border-gray-400 rounded"></div>
                <div className="w-7 h-1 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        )
      case 'table':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-full h-3 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
            <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
            <div className="w-full h-2 bg-gray-200 rounded"></div>
          </div>
        )
      case 'chart':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded border border-gray-200 p-1">
              <div className="w-full h-full flex items-end justify-center space-x-1">
                <div className="w-2 bg-blue-500 rounded-t" style={{ height: '60%' }}></div>
                <div className="w-2 bg-green-500 rounded-t" style={{ height: '80%' }}></div>
                <div className="w-2 bg-purple-500 rounded-t" style={{ height: '40%' }}></div>
                <div className="w-2 bg-orange-500 rounded-t" style={{ height: '70%' }}></div>
              </div>
            </div>
          </div>
        )
      case 'map':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        )
      case 'video':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
            </div>
          </div>
        )
      case 'audio':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.617-3.794a1 1 0 011.383.07zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )
      case 'canvas':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-white border border-gray-300 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded"></div>
            </div>
          </div>
        )
      case 'svg':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-white border border-gray-300 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )
      case 'webgl':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded transform rotate-45"></div>
            </div>
          </div>
        )
      case 'vr':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black rounded flex items-center justify-center">
              <div className="w-6 h-4 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        )
      case 'ar':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900 rounded flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-400 rounded-full"></div>
            </div>
          </div>
        )
      case '3d':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-pink-500 transform rotate-45"></div>
            </div>
          </div>
        )
      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
          </div>
        )
    }
  }

  const screenPresets = [
    // iOS Devices
    { 
      name: 'iPhone 15 Pro Max', 
      width: 430, 
      height: 932, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'iOS 6.7" display',
      ratio: '19.5:9',
      category: 'iOS'
    },
    { 
      name: 'iPhone 15 Pro', 
      width: 393, 
      height: 852, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'iOS 6.1" display',
      ratio: '19.5:9',
      category: 'iOS'
    },
    { 
      name: 'iPhone 15', 
      width: 393, 
      height: 852, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'iOS 6.1" display',
      ratio: '19.5:9',
      category: 'iOS'
    },
    { 
      name: 'iPhone 15 Plus', 
      width: 430, 
      height: 932, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'iOS 6.7" display',
      ratio: '19.5:9',
      category: 'iOS'
    },
    { 
      name: 'iPhone 14', 
      width: 390, 
      height: 844, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'iOS 6.1" display',
      ratio: '19.5:9',
      category: 'iOS'
    },
    { 
      name: 'iPhone SE', 
      width: 375, 
      height: 667, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'iOS 4.7" display',
      ratio: '16:9',
      category: 'iOS'
    },
    { 
      name: 'iPad Pro 12.9"', 
      width: 1024, 
      height: 1366, 
      type: 'tablet' as const, 
      icon: Smartphone,
      description: 'iOS 12.9" display',
      ratio: '4:3',
      category: 'iOS'
    },
    { 
      name: 'iPad Pro 11"', 
      width: 834, 
      height: 1194, 
      type: 'tablet' as const, 
      icon: Smartphone,
      description: 'iOS 11" display',
      ratio: '4:3',
      category: 'iOS'
    },
    { 
      name: 'iPad Air', 
      width: 820, 
      height: 1180, 
      type: 'tablet' as const, 
      icon: Smartphone,
      description: 'iOS 10.9" display',
      ratio: '4:3',
      category: 'iOS'
    },
    { 
      name: 'iPad mini', 
      width: 744, 
      height: 1133, 
      type: 'tablet' as const, 
      icon: Smartphone,
      description: 'iOS 8.3" display',
      ratio: '4:3',
      category: 'iOS'
    },
    
    // Android Devices
    { 
      name: 'Samsung Galaxy S24 Ultra', 
      width: 412, 
      height: 892, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'Android 6.8" display',
      ratio: '19.3:9',
      category: 'Android'
    },
    { 
      name: 'Samsung Galaxy S24+', 
      width: 393, 
      height: 852, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'Android 6.7" display',
      ratio: '19.5:9',
      category: 'Android'
    },
    { 
      name: 'Samsung Galaxy S24', 
      width: 360, 
      height: 780, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'Android 6.2" display',
      ratio: '19.5:9',
      category: 'Android'
    },
    { 
      name: 'Google Pixel 8 Pro', 
      width: 412, 
      height: 892, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'Android 6.7" display',
      ratio: '19.3:9',
      category: 'Android'
    },
    { 
      name: 'Google Pixel 8', 
      width: 393, 
      height: 852, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'Android 6.2" display',
      ratio: '19.5:9',
      category: 'Android'
    },
    { 
      name: 'OnePlus 12', 
      width: 412, 
      height: 892, 
      type: 'mobile' as const, 
      icon: Smartphone,
      description: 'Android 6.8" display',
      ratio: '19.3:9',
      category: 'Android'
    },
    { 
      name: 'Samsung Galaxy Tab S9 Ultra', 
      width: 1024, 
      height: 1366, 
      type: 'tablet' as const, 
      icon: Smartphone,
      description: 'Android 14.6" display',
      ratio: '4:3',
      category: 'Android'
    },
    { 
      name: 'Samsung Galaxy Tab S9+', 
      width: 834, 
      height: 1194, 
      type: 'tablet' as const, 
      icon: Smartphone,
      description: 'Android 12.4" display',
      ratio: '4:3',
      category: 'Android'
    },
    { 
      name: 'Samsung Galaxy Tab S9', 
      width: 820, 
      height: 1180, 
      type: 'tablet' as const, 
      icon: Smartphone,
      description: 'Android 11" display',
      ratio: '4:3',
      category: 'Android'
    },
    
    // Desktop & Custom
    { 
      name: 'Desktop', 
      width: 1440, 
      height: 900, 
      type: 'desktop' as const, 
      icon: Smartphone,
      description: 'Standard desktop',
      ratio: '16:10',
      category: 'Desktop'
    },
    { 
      name: 'Large Desktop', 
      width: 1920, 
      height: 1080, 
      type: 'desktop' as const, 
      icon: Smartphone,
      description: 'Full HD desktop',
      ratio: '16:9',
      category: 'Desktop'
    },
    { 
      name: 'Ultra Wide', 
      width: 2560, 
      height: 1080, 
      type: 'desktop' as const, 
      icon: Smartphone,
      description: 'Ultra-wide desktop',
      ratio: '21:9',
      category: 'Desktop'
    },
    { 
      name: 'Custom', 
      width: 400, 
      height: 600, 
      type: 'custom' as const, 
      icon: Square,
      description: 'Custom dimensions',
      ratio: '2:3',
      category: 'Custom'
    }
  ]

  // Keyboard shortcuts for mode switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            console.log('Ctrl+S pressed - saving project')
            manualSave()
            break
          case 'z':
            e.preventDefault()
            // TODO: Implement undo
            console.log('Undo')
            break
          case 'y':
            e.preventDefault()
            // TODO: Implement redo
            console.log('Redo')
            break
          case 'Delete':
          case 'Backspace':
            e.preventDefault()
            if (selectedComponentData) {
              deleteSelectedComponent()
            }
            break
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
        e.preventDefault()
            if (selectedComponentData) {
        deleteSelectedComponent()
      }
            break
          case 'Escape':
        e.preventDefault()
        setSelectedComponent(null)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedComponent, selectedComponentData, manualSave])

  // Wheel event for zoom and pan (Figma-like)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Zoom with Ctrl/Cmd + scroll
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(prev => {
          const newZoom = prev * delta
          return Math.max(0.1, Math.min(5, newZoom))
        })
      } else {
        // Trackpad panning (two-finger scroll)
        setPan(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }))
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Global mouse move for panning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Handle canvas panning
      if (isPanning) {
        e.preventDefault()
        const newPanX = e.clientX - panStart.x
        const newPanY = e.clientY - panStart.y
        setPan({
          x: newPanX,
          y: newPanY
        })
      }
      
      // Handle screen dragging
      if (draggedScreen && screenDragOffset) {
        // Get the canvas container to calculate proper coordinates
        const canvasContainer = containerRef.current
        if (canvasContainer) {
          const canvasRect = canvasContainer.getBoundingClientRect()
          
          // Calculate mouse position relative to canvas, accounting for zoom and pan
          const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom
          const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom
          
          // Calculate new screen position by subtracting the offset from the mouse position
          const newX = mouseX - screenDragOffset.x
          const newY = mouseY - screenDragOffset.y
          
          // Get the default position for this screen using the helper function
          const index = screens.findIndex(s => s.id === draggedScreen)
          const screen = screens[index]
          const { defaultX, defaultY } = calculateScreenPosition(index, screen)
          
          // Calculate the relative position (subtract default position)
          const relativeX = newX - defaultX
          const relativeY = newY - defaultY
          
          // Add some smoothing to prevent jumping
          setScreenPositions(prev => {
            const currentPos = prev[draggedScreen] || { x: 0, y: 0 }
            const smoothFactor = 0.8 // Adjust this for more or less smoothing
            
            return {
            ...prev,
              [draggedScreen]: { 
                x: currentPos.x * smoothFactor + relativeX * (1 - smoothFactor),
                y: currentPos.y * smoothFactor + relativeY * (1 - smoothFactor)
              }
            }
          })
        }
        
        document.body.style.cursor = 'grabbing'
      }
      
      // Handle component dragging within screen
      if (isDragging && selectedComponent && selectedComponentData) {
        console.log('Mouse move while dragging')
        
        const activeScreenElement = document.querySelector(`[data-screen-id="${activeScreen}"]`) as HTMLElement
        if (activeScreenElement) {
          const screenContentElement = activeScreenElement.querySelector('.relative.w-full.h-full') as HTMLElement
          if (screenContentElement) {
            // Get the canvas container that has the zoom and pan transformations
            const canvasContainer = document.querySelector('.absolute.inset-0') as HTMLElement
            if (canvasContainer) {
              const canvasRect = canvasContainer.getBoundingClientRect()
              // const screenRect = screenContentElement.getBoundingClientRect()
              
              // Calculate the mouse position relative to the screen content, accounting for zoom and pan
              const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom
              const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom
              
              // Calculate the screen's position within the canvas
              const currentScreen = screens.find(s => s.id === activeScreen)
              const screenIndex = screens.findIndex(s => s.id === activeScreen)
              const screenPosition = screenPositions[activeScreen!] || { x: 0, y: 0 }
              
              // Calculate grid position using the helper function
              const { defaultX, defaultY } = calculateScreenPosition(screenIndex, currentScreen!)
              const screenLeft = defaultX + screenPosition.x
              const screenTop = defaultY + screenPosition.y
              
              // Calculate new component position relative to the screen
              const newX = mouseX - screenLeft - dragOffset.x
              const newY = mouseY - screenTop - dragOffset.y
              
              // Constrain to screen bounds
              const constrainedX = Math.max(0, Math.min(newX, (currentScreen?.width || 400) - selectedComponent.size.width))
              const constrainedY = Math.max(0, Math.min(newY, (currentScreen?.height || 600) - selectedComponent.size.height))
              
              console.log('Dragging component to:', { x: constrainedX, y: constrainedY })
              
              updateComponentLocal(selectedComponent.id, {
                position: { x: constrainedX, y: constrainedY }
              })
            }
          }
        }
      }
      
      // Handle component resizing
      if (isResizing && selectedComponent && resizeHandle) {
        const activeScreenElement = document.querySelector(`[data-screen-id="${activeScreen}"]`) as HTMLElement
        if (activeScreenElement) {
          const screenContentElement = activeScreenElement.querySelector('.relative.w-full.h-full') as HTMLElement
          if (screenContentElement) {
            const canvasContainer = document.querySelector('.absolute.inset-0') as HTMLElement
            if (canvasContainer) {
              const canvasRect = canvasContainer.getBoundingClientRect()
              
              // Calculate the mouse position relative to the screen content, accounting for zoom and pan
              const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom
              const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom
              
              // Calculate the screen's position within the canvas
              const currentScreen = screens.find(s => s.id === activeScreen)
              const screenIndex = screens.findIndex(s => s.id === activeScreen)
              const screenPosition = screenPositions[activeScreen!] || { x: 0, y: 0 }
              
              // Calculate grid position using the helper function
              const { defaultX, defaultY } = calculateScreenPosition(screenIndex, currentScreen!)
              const screenLeft = defaultX + screenPosition.x
              const screenTop = defaultY + screenPosition.y
              
              // Calculate new size and position based on resize handle
              let newWidth = selectedComponent.size.width
              let newHeight = selectedComponent.size.height
              let newX = selectedComponent.position.x
              let newY = selectedComponent.position.y
              
              const minWidth = 50
              const minHeight = 30
              
              if (resizeHandle.includes('e')) {
                newWidth = Math.max(minWidth, mouseX - screenLeft - selectedComponent.position.x)
              }
              if (resizeHandle.includes('w')) {
                const rightEdge = selectedComponent.position.x + selectedComponent.size.width
                newWidth = Math.max(minWidth, rightEdge - (mouseX - screenLeft))
                newX = rightEdge - newWidth
              }
              if (resizeHandle.includes('s')) {
                newHeight = Math.max(minHeight, mouseY - screenTop - selectedComponent.position.y)
              }
              if (resizeHandle.includes('n')) {
                const bottomEdge = selectedComponent.position.y + selectedComponent.size.height
                newHeight = Math.max(minHeight, bottomEdge - (mouseY - screenTop))
                newY = bottomEdge - newHeight
              }
              
              // Constrain to screen bounds (allow resizing all the way to the edge)
              if (currentScreen) {
                // Clamp width/height so the component doesn't go outside the screen
                newWidth = Math.min(newWidth, currentScreen.width - newX);
                newHeight = Math.min(newHeight, currentScreen.height - newY);
                // Clamp position so the component doesn't go outside the screen
                newX = Math.max(0, Math.min(newX, currentScreen.width - newWidth));
                newY = Math.max(0, Math.min(newY, currentScreen.height - newHeight));
              }
              
              updateComponentLocal(selectedComponent.id, {
                position: { x: newX, y: newY },
                size: { width: newWidth, height: newHeight }
              })
            }
          }
        }
      }
    }

    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false)
        document.body.style.cursor = 'default'
      }
      if (draggedScreen) {
        setDraggedScreen(null)
        setScreenDragOffset({ x: 0, y: 0 })
        document.body.style.cursor = 'default'
      }
      if (isDragging) {
        setIsDragging(false)
        setSelectedComponent(null)
        document.body.style.cursor = 'default'
      }
      if (isResizing) {
        setIsResizing(false)
        setResizeHandle(null)
        document.body.style.cursor = 'default'
      }
    }

    if (isPanning || draggedScreen) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
      document.addEventListener('mouseup', handleGlobalMouseUp)
      if (isPanning) document.body.style.cursor = 'grabbing'
      if (draggedScreen) document.body.style.cursor = 'grabbing'
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
        document.body.style.cursor = 'default'
      }
    }
  }, [isPanning, panStart, draggedScreen, screenDragOffset, pan, zoom, isDragging, selectedComponent, selectedComponentData, dragOffset, isResizing, resizeHandle, activeScreen, screens, screenPositions])





  // const addVariable = () => {
  //   const newVariable: Variable = {
  //     id: Date.now().toString(),
  //     name: `Variable ${variables.length + 1}`,
  //     type: 'string',
  //     value: '',
  //     scope: 'global'
  //   }
  //   setVariables(prev => [...prev, newVariable])
  // }

  // const deleteVariable = (variableId: string) => {
  //   setVariables(prev => prev.filter(v => v.id !== variableId))
  // }

  // const updateVariable = (variableId: string, updates: Partial<Variable>) => {
  //   setVariables(prev => prev.map(v => v.id === variableId ? { ...v, ...updates } : v))
  // }

  // Interaction management functions
  const addClickEvent = (componentId: string) => {
    updateComponentLocal(componentId, {
      interactions: {
        ...selectedComponentData?.interactions,
        click: 'handle_click'
      }
    })
  }

  const addHoverEffect = (componentId: string) => {
    updateComponentLocal(componentId, {
      interactions: {
        ...selectedComponentData?.interactions,
        hover: 'scale'
      }
    })
  }

  const addAnimation = (componentId: string) => {
    updateComponentLocal(componentId, {
      interactions: {
        ...selectedComponentData?.interactions,
        animation: 'fadeIn'
      }
    })
  }

  const removeInteraction = (componentId: string, interactionType: 'click' | 'hover' | 'animation') => {
    const updatedInteractions = { ...selectedComponentData?.interactions }
    delete updatedInteractions[interactionType]
    updateComponentLocal(componentId, { interactions: updatedInteractions })
  }

  // Data binding functions
  const bindToVariable = (componentId: string) => {
    updateComponentLocal(componentId, {
      dataBinding: {
        ...selectedComponentData?.dataBinding,
        variable: 'data_variable'
      }
    })
  }

  const connectToAPI = (componentId: string) => {
    updateComponentLocal(componentId, {
      dataBinding: {
        ...selectedComponentData?.dataBinding,
        api: 'https://api.example.com/data'
      }
    })
  }

  const removeDataBinding = (componentId: string, bindingType: 'variable' | 'api') => {
    const updatedDataBinding = { ...selectedComponentData?.dataBinding }
    delete updatedDataBinding[bindingType]
    updateComponentLocal(componentId, { dataBinding: updatedDataBinding })
  }

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent, component: Component) => {
    console.log('Mouse down on component:', component.name, component.id)
    e.stopPropagation()
    setSelectedComponent(component)
    
    // Get the canvas container that has the zoom and pan transformations
    const canvasContainer = document.querySelector('.absolute.inset-0') as HTMLElement
    if (canvasContainer) {
      const canvasRect = canvasContainer.getBoundingClientRect()
      
      // Calculate the mouse position relative to the canvas, accounting for zoom and pan
      const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom
      const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom
      
      // Calculate the screen's position within the canvas
      const currentScreen = screens.find(s => s.id === activeScreen)
      const screenIndex = screens.findIndex(s => s.id === activeScreen)
      const screenPosition = screenPositions[activeScreen!] || { x: 0, y: 0 }
      
      // Calculate grid position using the helper function
      const { defaultX, defaultY } = calculateScreenPosition(screenIndex, currentScreen!)
      const screenLeft = defaultX + screenPosition.x
      const screenTop = defaultY + screenPosition.y
      
      // Calculate offset from mouse to component position
      const offsetX = mouseX - screenLeft - component.position.x
      const offsetY = mouseY - screenTop - component.position.y
      
      setDragOffset({ x: offsetX, y: offsetY })
      setIsDragging(true)
      console.log('Drag started - offset:', { x: offsetX, y: offsetY })

      // Set up cross-screen dragging after a short delay
      const crossScreenTimer = setTimeout(() => {
        if (isDragging) {
          setIsDraggingComponent(true)
          setDraggedComponent(component)
          setSourceScreenId(activeScreen)
          setSourceLayerId(currentScreen?.activeLayer || null)
          console.log('Cross-screen dragging enabled for component:', component.id)
        }
      }, 300) // 300ms delay to distinguish from regular dragging

      // Store timer reference to clear it if mouse up happens before delay
      const handleMouseUpEarly = () => {
        clearTimeout(crossScreenTimer)
        document.removeEventListener('mouseup', handleMouseUpEarly)
      }
      document.addEventListener('mouseup', handleMouseUpEarly, { once: true })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && selectedComponent && selectedComponentData) {
      console.log('Mouse move while dragging')
      
      const activeScreenElement = document.querySelector(`[data-screen-id="${activeScreen}"]`) as HTMLElement
      if (activeScreenElement) {
        const screenContentElement = activeScreenElement.querySelector('.relative.w-full.h-full') as HTMLElement
        if (screenContentElement) {
          // Get the canvas container that has the zoom and pan transformations
          const canvasContainer = document.querySelector('.absolute.inset-0') as HTMLElement
          if (canvasContainer) {
            const canvasRect = canvasContainer.getBoundingClientRect()
            // const screenRect = screenContentElement.getBoundingClientRect()
            
            // Calculate the mouse position relative to the screen content, accounting for zoom and pan
            const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom
            const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom
            
            // Calculate the screen's position within the canvas
            const currentScreen = screens.find(s => s.id === activeScreen)
            const screenIndex = screens.findIndex(s => s.id === activeScreen)
            const screenPosition = screenPositions[activeScreen!] || { x: 0, y: 0 }
            
            // Calculate grid position using the helper function
            const { defaultX, defaultY } = calculateScreenPosition(screenIndex, currentScreen!)
            const screenLeft = defaultX + screenPosition.x
            const screenTop = defaultY + screenPosition.y
            
            // Calculate new component position relative to the screen
            const newX = mouseX - screenLeft - dragOffset.x
            const newY = mouseY - screenTop - dragOffset.y
            
            // Constrain to screen bounds
            const constrainedX = Math.max(0, Math.min(newX, (currentScreen?.width || 400) - selectedComponent.size.width))
            const constrainedY = Math.max(0, Math.min(newY, (currentScreen?.height || 600) - selectedComponent.size.height))
            
            console.log('Dragging component to:', { x: constrainedX, y: constrainedY })
            
            updateComponentLocal(selectedComponent.id, {
              position: { x: constrainedX, y: constrainedY }
            })
          }
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      console.log('Mouse up - drag ended')
      
      // Trigger save when component drag ends
      if (projectId && selectedComponent) {
        console.log('Component moved, triggering save...')
        setTimeout(() => {
          if (!isSaving && !isLoadingData) {
            saveProjectData()
          }
        }, 2000) // 2 second delay to prevent rapid saves
      }
    }
    if (isDraggingComponent) {
      console.log('Cross-screen drag ended')
      setIsDraggingComponent(false)
      setDraggedComponent(null)
      setSourceScreenId(null)
      setSourceLayerId(null)
    }
    setIsDragging(false)
  }

  // Add document-level event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove)
      document.addEventListener('mouseup', isDragging ? handleMouseUp : handleResizeEnd)
      
      return () => {
        document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove)
        document.removeEventListener('mouseup', isDragging ? handleMouseUp : handleResizeEnd)
      }
    }
  }, [isDragging, isResizing, selectedComponent, dragOffset, zoom, pan, activeScreen, resizeHandle, resizeStartPos, resizeStartSize])

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking on canvas background and not dragging
    if (e.target === e.currentTarget && !isDragging) {
    setSelectedComponent(null)
    }
  }

  // Pan functionality
  const handleMouseDownPan = (e: React.MouseEvent) => {
    // Only pan if not clicking on a component and using middle mouse, Alt+Left, or left click on empty space
    if ((e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && e.target === e.currentTarget))) {
    e.preventDefault()
      e.stopPropagation()
    setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (isPanning) {
    e.preventDefault()
      e.stopPropagation()
      const newPanX = e.clientX - panStart.x
      const newPanY = e.clientY - panStart.y
      setPan({
        x: newPanX,
        y: newPanY
      })
    }
  }

  const handleMouseUpPan = () => {
    if (isPanning) {
    setIsPanning(false)
    }
  }

  const handleMouseEnter = () => {
    if (isPanning) {
      document.body.style.cursor = 'grabbing'
    }
  }

  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false)
      document.body.style.cursor = 'default'
    }
  }

  // Screen dragging handlers
  const handleScreenMouseDown = (e: React.MouseEvent, screenId: string) => {
    e.stopPropagation()
    setDraggedScreen(screenId)
    
    // Get the canvas container to calculate offset relative to its actual visual position
    const canvasContainer = containerRef.current
    if (canvasContainer) {
      const canvasRect = canvasContainer.getBoundingClientRect()
      
      // Calculate the screen's current position in canvas coordinates
      const index = screens.findIndex(s => s.id === screenId)
      const screen = screens[index]
      const { defaultX, defaultY } = calculateScreenPosition(index, screen)
      const screenPosition = screenPositions[screenId] || { x: 0, y: 0 }
      const currentScreenX = defaultX + screenPosition.x
      const currentScreenY = defaultY + screenPosition.y
      
      // Calculate offset from mouse to the screen's top-left corner in canvas coordinates
      const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom
      const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom
      const offsetX = mouseX - currentScreenX
      const offsetY = mouseY - currentScreenY
      
      setScreenDragOffset({ x: offsetX, y: offsetY })
    }
  }

  // const handleScreenMouseMove = (e: React.MouseEvent) => {
  //   if (draggedScreen) {
  //     // Get the canvas container to calculate proper coordinates (same as global mouse move)
  //     const canvasContainer = document.querySelector('.absolute') as HTMLElement
  //     if (canvasContainer) {
  //       const canvasRect = canvasContainer.getBoundingClientRect()
  //       
  //       // Calculate mouse position relative to canvas, accounting for zoom and pan (same as global mouse move)
  //       const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom
  //       const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom
  //       
  //       // Calculate new screen position
  //       const newX = mouseX - screenDragOffset.x
  //       const newY = mouseY - screenDragOffset.y
  //       
  //       // Get the default position for this screen using the helper function
  //       const index = screens.findIndex(s => s.id === draggedScreen)
  //       const screen = screens[index]
  //       const { defaultX, defaultY } = calculateScreenPosition(index, screen)
  //       
  //       // Calculate the relative position (subtract default position)
  //       const relativeX = newX - defaultX
  //       const relativeY = newY - defaultY
  //       
  //       setScreenPositions(prev => ({
  //         ...prev,
  //         [draggedScreen]: { x: relativeX, y: relativeY }
  //       }))
  //     }
  //   }
  // }

  // const handleScreenMouseUp = () => {
  // setDraggedScreen(null)
  // setScreenDragOffset({ x: 0, y: 0 })
// }

  const renderComponent = (component: Component) => {
    const baseStyle = {
      backgroundColor: component.backgroundColor || 'white'
    }
    
    switch (component.type) {
      case 'container':
        return (
          <div className="w-full h-full bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col" style={baseStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Container</h3>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="flex-1 bg-white rounded border border-gray-100 p-3">
              <p className="text-xs text-gray-600">Content area</p>
            </div>
          </div>
        )
      case 'text':
        return (
          <div className="w-full h-full flex flex-col justify-center p-3" style={baseStyle}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {component.props?.heading || 'Heading Text'}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {component.props?.content || 'This is a paragraph of text that demonstrates how text content would appear in your application.'}
            </p>
          </div>
        )
      case 'button':
        return (
          <div className="w-full h-full flex items-center justify-center p-3" style={baseStyle}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors duration-200">
              {component.props?.text || 'Click Me'}
            </button>
          </div>
        )
      case 'input':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-1/2 h-1 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-4 bg-white border border-gray-300 rounded-md"></div>
          </div>
        )
      case 'image':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )
      case 'form':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-2/3 h-1 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-3 bg-white border border-gray-300 rounded mb-1"></div>
            <div className="w-full h-3 bg-white border border-gray-300 rounded mb-1"></div>
            <div className="w-full h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
          </div>
        )
      case 'list':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-1/2 h-1 bg-gray-300 rounded mb-1"></div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 border border-gray-400 rounded"></div>
                <div className="w-8 h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 border border-gray-400 rounded"></div>
                <div className="w-6 h-1 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 border border-gray-400 rounded"></div>
                <div className="w-7 h-1 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        )
      case 'table':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex flex-col justify-center">
            <div className="w-full h-3 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
            <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
            <div className="w-full h-2 bg-gray-200 rounded"></div>
          </div>
        )
      case 'chart':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded border border-gray-200 p-1">
              <div className="w-full h-full flex items-end justify-center space-x-1">
                <div className="w-2 bg-blue-500 rounded-t" style={{ height: '60%' }}></div>
                <div className="w-2 bg-green-500 rounded-t" style={{ height: '80%' }}></div>
                <div className="w-2 bg-purple-500 rounded-t" style={{ height: '40%' }}></div>
                <div className="w-2 bg-orange-500 rounded-t" style={{ height: '70%' }}></div>
              </div>
            </div>
          </div>
        )
      case 'map':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        )
      case 'video':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
            </div>
          </div>
        )
      case 'audio':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.617-3.794a1 1 0 011.383.07zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )
      case 'canvas':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-white border border-gray-300 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded"></div>
            </div>
          </div>
        )
      case 'svg':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-white border border-gray-300 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )
      case 'webgl':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded transform rotate-45"></div>
            </div>
          </div>
        )
      case 'vr':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black rounded flex items-center justify-center">
              <div className="w-6 h-4 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        )
      case 'ar':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900 rounded flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-400 rounded-full"></div>
            </div>
          </div>
        )
      case '3d':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-2 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-pink-500 transform rotate-45"></div>
            </div>
          </div>
        )
      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
          </div>
        )
    }
  }

  // Pre-built mobile page functions
  const addLoginPage = () => {
    if (!currentScreen) return

    const loginComponents: Component[] = [
      {
        id: Date.now().toString() + '_email_input',
        type: 'input',
        name: 'Email',
        props: {},
        position: { x: 50, y: 200 },
        size: { width: 300, height: 50 },
        backgroundColor: '#f8f9fa',
        interactions: {
          click: 'focus',
          hover: 'highlight'
        },
        dataBinding: {
          variable: 'userEmail'
        }
      },
      {
        id: Date.now().toString() + '_password_input',
        type: 'input',
        name: 'Password',
        props: {},
        position: { x: 50, y: 270 },
        size: { width: 300, height: 50 },
        backgroundColor: '#f8f9fa',
        interactions: {
          click: 'focus',
          hover: 'highlight'
        },
        dataBinding: {
          variable: 'userPassword'
        }
      },
      {
        id: Date.now().toString() + '_login_button',
        type: 'button',
        name: 'Login',
        props: {},
        position: { x: 50, y: 340 },
        size: { width: 300, height: 50 },
        backgroundColor: '#3b82f6',
        interactions: {
          click: 'submit_login',
          hover: 'scale'
        },
        dataBinding: {
          api: 'https://api.example.com/auth/login'
        }
      }
    ]

    // Add each component to the context first
    loginComponents.forEach(comp => {
      addComponent(comp)
    })

    // Update the current layer
    updateScreen(activeScreen!, {
      layers: currentScreen.layers.map(layer => 
        layer.id === currentScreen.activeLayer 
          ? { ...layer, components: [...layer.components, ...loginComponents] }
          : layer
      )
    })
  }

  const addDashboardPage = () => {
    if (!currentScreen) return

    const dashboardComponents: Component[] = [
      {
        id: Date.now().toString() + '_header',
        type: 'text',
        name: 'Dashboard',
        props: {},
        position: { x: 30, y: 60 },
        size: { width: 200, height: 40 },
        backgroundColor: '#ffffff'
      },
      {
        id: Date.now().toString() + '_profile_avatar',
        type: 'image',
        name: 'Profile Avatar',
        props: {},
        position: { x: 320, y: 60 },
        size: { width: 50, height: 50 },
        backgroundColor: '#e5e7eb',
        interactions: {
          click: 'open_profile_menu',
          hover: 'scale'
        }
      },
      {
        id: Date.now().toString() + '_stats_card1',
        type: 'container',
        name: 'Total Users',
        props: {},
        position: { x: 30, y: 130 },
        size: { width: 160, height: 100 },
        backgroundColor: '#f0f9ff',
        interactions: {
          hover: 'shadow'
        },
        dataBinding: {
          variable: 'totalUsers'
        }
      },
      {
        id: Date.now().toString() + '_stats_card2',
        type: 'container',
        name: 'Active Sessions',
        props: {},
        position: { x: 210, y: 130 },
        size: { width: 160, height: 100 },
        backgroundColor: '#f0fdf4',
        interactions: {
          hover: 'shadow'
        },
        dataBinding: {
          variable: 'activeSessions'
        }
      },
      {
        id: Date.now().toString() + '_chart_container',
        type: 'chart',
        name: 'Analytics Chart',
        props: {},
        position: { x: 30, y: 250 },
        size: { width: 340, height: 200 },
        backgroundColor: '#ffffff',
        interactions: {
          hover: 'highlight'
        },
        dataBinding: {
          api: 'https://api.example.com/analytics/chart-data'
        }
      },
      {
        id: Date.now().toString() + '_recent_activity',
        type: 'list',
        name: 'Recent Activity',
        props: {},
        position: { x: 30, y: 470 },
        size: { width: 340, height: 150 },
        backgroundColor: '#ffffff',
        interactions: {
          hover: 'highlight'
        },
        dataBinding: {
          api: 'https://api.example.com/activity/recent'
        }
      },
      {
        id: Date.now().toString() + '_quick_action1',
        type: 'button',
        name: 'Add User',
        props: {},
        position: { x: 30, y: 640 },
        size: { width: 160, height: 50 },
        backgroundColor: '#3b82f6',
        interactions: {
          click: 'open_add_user_modal',
          hover: 'scale'
        }
      },
      {
        id: Date.now().toString() + '_quick_action2',
        type: 'button',
        name: 'Generate Report',
        props: {},
        position: { x: 210, y: 640 },
        size: { width: 160, height: 50 },
        backgroundColor: '#10b981',
        interactions: {
          click: 'generate_report',
          hover: 'scale'
        }
      }
    ]

    // Add components to context
    dashboardComponents.forEach(comp => addComponent(comp))

    // Update the current layer
    updateScreen(activeScreen!, {
      layers: currentScreen.layers.map(layer => 
        layer.id === currentScreen.activeLayer 
          ? { ...layer, components: [...layer.components, ...dashboardComponents] }
          : layer
      )
    })
  }

  const addProfilePage = () => {
    if (!currentScreen) return

    const profileComponents: Component[] = [
      {
        id: Date.now().toString() + '_profile_header',
        type: 'text',
        name: 'Profile',
        props: {},
        position: { x: 30, y: 60 },
        size: { width: 200, height: 40 },
        backgroundColor: '#ffffff'
      },
      {
        id: Date.now().toString() + '_back_button',
        type: 'button',
        name: '← Back',
        props: {},
        position: { x: 320, y: 60 },
        size: { width: 60, height: 40 },
        backgroundColor: '#f3f4f6',
        interactions: {
          click: 'navigate_back',
          hover: 'highlight'
        }
      },
      {
        id: Date.now().toString() + '_profile_photo',
        type: 'image',
        name: 'Profile Photo',
        props: {},
        position: { x: 150, y: 120 },
        size: { width: 120, height: 120 },
        backgroundColor: '#e5e7eb',
        interactions: {
          click: 'change_profile_photo',
          hover: 'scale'
        },
        dataBinding: {
          variable: 'profilePhoto'
        }
      },
      {
        id: Date.now().toString() + '_edit_photo',
        type: 'button',
        name: 'Edit Photo',
        props: {},
        position: { x: 150, y: 260 },
        size: { width: 120, height: 30 },
        backgroundColor: '#3b82f6',
        interactions: {
          click: 'open_photo_picker',
          hover: 'scale'
        }
      },
      {
        id: Date.now().toString() + '_name_label',
        type: 'text',
        name: 'Full Name',
        props: {},
        position: { x: 30, y: 320 },
        size: { width: 100, height: 20 },
        backgroundColor: '#ffffff'
      },
      {
        id: Date.now().toString() + '_name_input',
        type: 'input',
        name: 'Name Input',
        props: {},
        position: { x: 30, y: 350 },
        size: { width: 350, height: 50 },
        backgroundColor: '#f8f9fa',
        interactions: {
          click: 'focus',
          hover: 'highlight'
        },
        dataBinding: {
          variable: 'userName'
        }
      },
      {
        id: Date.now().toString() + '_email_label',
        type: 'text',
        name: 'Email',
        props: {},
        position: { x: 30, y: 420 },
        size: { width: 100, height: 20 },
        backgroundColor: '#ffffff'
      },
      {
        id: Date.now().toString() + '_email_input',
        type: 'input',
        name: 'Email Input',
        props: {},
        position: { x: 30, y: 450 },
        size: { width: 350, height: 50 },
        backgroundColor: '#f8f9fa',
        interactions: {
          click: 'focus',
          hover: 'highlight'
        },
        dataBinding: {
          variable: 'userEmail'
        }
      },
      {
        id: Date.now().toString() + '_phone_label',
        type: 'text',
        name: 'Phone',
        props: {},
        position: { x: 30, y: 520 },
        size: { width: 100, height: 20 },
        backgroundColor: '#ffffff'
      },
      {
        id: Date.now().toString() + '_phone_input',
        type: 'input',
        name: 'Phone Input',
        props: {},
        position: { x: 30, y: 550 },
        size: { width: 350, height: 50 },
        backgroundColor: '#f8f9fa',
        interactions: {
          click: 'focus',
          hover: 'highlight'
        },
        dataBinding: {
          variable: 'userPhone'
        }
      },
      {
        id: Date.now().toString() + '_save_button',
        type: 'button',
        name: 'Save Changes',
        props: {},
        position: { x: 30, y: 620 },
        size: { width: 350, height: 50 },
        backgroundColor: '#10b981',
        interactions: {
          click: 'save_profile',
          hover: 'scale'
        },
        dataBinding: {
          api: 'https://api.example.com/profile/update'
        }
      },
      {
        id: Date.now().toString() + '_logout_button',
        type: 'button',
        name: 'Logout',
        props: {},
        position: { x: 30, y: 690 },
        size: { width: 350, height: 50 },
        backgroundColor: '#ef4444',
        interactions: {
          click: 'logout_user',
          hover: 'scale'
        }
      }
    ]

    // Add components to context
    profileComponents.forEach(comp => addComponent(comp))

    // Update the current layer
    updateScreen(activeScreen!, {
      layers: currentScreen.layers.map(layer => 
        layer.id === currentScreen.activeLayer 
          ? { ...layer, components: [...layer.components, ...profileComponents] }
          : layer
      )
    })
  }

  const addEcommercePage = () => {
    if (!currentScreen) return

    const ecommerceComponents: Component[] = [
      {
        id: Date.now().toString() + '_search_header',
        type: 'input',
        name: 'Search Products',
        props: {},
        position: { x: 20, y: 60 },
        size: { width: 360, height: 50 },
        backgroundColor: '#f8f9fa',
        interactions: {
          click: 'focus',
          hover: 'highlight'
        }
      },
      {
        id: Date.now().toString() + '_category_tabs',
        type: 'container',
        name: 'Categories',
        props: {},
        position: { x: 20, y: 130 },
        size: { width: 360, height: 50 },
        backgroundColor: '#ffffff',
        interactions: {
          hover: 'highlight'
        }
      },
      {
        id: Date.now().toString() + '_product_card1',
        type: 'container',
        name: 'Product Card 1',
        props: {},
        position: { x: 20, y: 200 },
        size: { width: 170, height: 220 },
        backgroundColor: '#ffffff',
        interactions: {
          click: 'view_product',
          hover: 'shadow'
        },
        dataBinding: {
          variable: 'product1'
        }
      },
      {
        id: Date.now().toString() + '_product_card2',
        type: 'container',
        name: 'Product Card 2',
        props: {},
        position: { x: 210, y: 200 },
        size: { width: 170, height: 220 },
        backgroundColor: '#ffffff',
        interactions: {
          click: 'view_product',
          hover: 'shadow'
        },
        dataBinding: {
          variable: 'product2'
        }
      },
      {
        id: Date.now().toString() + '_product_card3',
        type: 'container',
        name: 'Product Card 3',
        props: {},
        position: { x: 20, y: 440 },
        size: { width: 170, height: 220 },
        backgroundColor: '#ffffff',
        interactions: {
          click: 'view_product',
          hover: 'shadow'
        },
        dataBinding: {
          variable: 'product3'
        }
      },
      {
        id: Date.now().toString() + '_product_card4',
        type: 'container',
        name: 'Product Card 4',
        props: {},
        position: { x: 210, y: 440 },
        size: { width: 170, height: 220 },
        backgroundColor: '#ffffff',
        interactions: {
          click: 'view_product',
          hover: 'shadow'
        },
        dataBinding: {
          variable: 'product4'
        }
      },
      {
        id: Date.now().toString() + '_cart_button',
        type: 'button',
        name: '🛒 Cart (3)',
        props: {},
        position: { x: 20, y: 680 },
        size: { width: 360, height: 50 },
        backgroundColor: '#3b82f6',
        interactions: {
          click: 'open_cart',
          hover: 'scale'
        },
        dataBinding: {
          variable: 'cartItems'
        }
      }
    ]

    // Add components to context
    ecommerceComponents.forEach(comp => addComponent(comp))

    // Update the current layer
    updateScreen(activeScreen!, {
      layers: currentScreen.layers.map(layer => 
        layer.id === currentScreen.activeLayer 
          ? { ...layer, components: [...layer.components, ...ecommerceComponents] }
          : layer
      )
    })
  }

  const addComponentToCanvas = (componentType: string) => {
    if (!currentScreen || !currentLayer) {
      console.log('No current screen or layer')
      return
    }

    // Calculate smart position to avoid overlapping
    const existingComponents = currentLayer.components
    let newX = 50
    let newY = 50
    
    // Find a position that doesn't overlap with existing components
    const gridSize = 20
    let attempts = 0
    const maxAttempts = 100
    
    while (attempts < maxAttempts) {
      let hasOverlap = false
      
      for (const component of existingComponents) {
        const overlap = !(
          newX + 200 < component.position.x ||
          newX > component.position.x + component.size.width ||
          newY + 100 < component.position.y ||
          newY > component.position.y + component.size.height
        )
        
        if (overlap) {
          hasOverlap = true
          break
        }
      }
      
      if (!hasOverlap) {
        break
      }
      
      // Try next position in a grid pattern
      newX += gridSize
      if (newX > (currentScreen.width || 400) - 200) {
        newX = 50
        newY += gridSize
      }
      
      attempts++
    }

    const newComponent: Component = {
      id: Date.now().toString(),
      type: componentType,
      name: `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} ${Date.now()}`,
      props: {},
      position: { x: newX, y: newY },
      size: { width: 200, height: 100 },
      backgroundColor: '#ffffff',
      zIndex: currentLayer.components.length + 1, // New components get highest z-index
      interactions: {},
      dataBinding: {}
    }

    console.log('Adding component at position:', { x: newX, y: newY })

    // Add component to the context
    addComponent(newComponent)
    
    // Update the current screen's active layer with the new component
    const updatedLayers = currentScreen.layers.map(layer => 
      layer.id === currentScreen.activeLayer 
        ? { ...layer, components: [...layer.components, newComponent] }
        : layer
    )
    
    updateScreen(activeScreen!, {
      layers: updatedLayers
    })
    
    setSelectedComponent(newComponent)
    console.log('Component added successfully')
    
    // Trigger save when component is added
    if (projectId) {
      console.log('Component added, triggering save...')
      setTimeout(() => {
        if (!isSaving && !isLoadingData) {
          saveProjectData()
        }
      }, 5000) // 5 second delay to prevent rapid saves
    }
  }

  // Toggle sidebar sections

  // Component resize handlers
  const handleResizeStart = (e: React.MouseEvent, component: Component, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w') => {
    e.stopPropagation()
    setResizeHandle(handle)
    setIsResizing(true)
    
    const activeScreenElement = document.querySelector(`[data-screen-id="${activeScreen}"]`) as HTMLElement
    if (activeScreenElement) {
      const screenRect = activeScreenElement.getBoundingClientRect()
      
      // Calculate mouse position relative to the screen element
      const mouseX = e.clientX - screenRect.left
      const mouseY = e.clientY - screenRect.top
      
      setResizeStartPos({ x: mouseX, y: mouseY })
      setResizeStartSize({ width: component.size.width, height: component.size.height })
    }
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (isResizing && selectedComponent && resizeHandle) {
      const activeScreenElement = document.querySelector(`[data-screen-id="${activeScreen}"]`) as HTMLElement
      if (activeScreenElement) {
        const screenRect = activeScreenElement.getBoundingClientRect()
        
        // Calculate mouse position relative to the screen element
        const mouseX = e.clientX - screenRect.left
        const mouseY = e.clientY - screenRect.top
        
        // Calculate deltas from the resize start position
        const deltaX = mouseX - resizeStartPos.x
        const deltaY = mouseY - resizeStartPos.y
        
        let newWidth = resizeStartSize.width
        let newHeight = resizeStartSize.height
        let newX = selectedComponent.position.x
        let newY = selectedComponent.position.y
        
        // Calculate new size and position based on resize handle
        switch (resizeHandle) {
          case 'se': // bottom-right
            newWidth = Math.max(20, resizeStartSize.width + deltaX)
            newHeight = Math.max(20, resizeStartSize.height + deltaY)
            break
          case 'sw': // bottom-left
            newWidth = Math.max(20, resizeStartSize.width - deltaX)
            newHeight = Math.max(20, resizeStartSize.height + deltaY)
            newX = selectedComponent.position.x + resizeStartSize.width - newWidth
            break
          case 'ne': // top-right
            newWidth = Math.max(20, resizeStartSize.width + deltaX)
            newHeight = Math.max(20, resizeStartSize.height - deltaY)
            newY = selectedComponent.position.y + resizeStartSize.height - newHeight
            break
          case 'nw': // top-left
            newWidth = Math.max(20, resizeStartSize.width - deltaX)
            newHeight = Math.max(20, resizeStartSize.height - deltaY)
            newX = selectedComponent.position.x + resizeStartSize.width - newWidth
            newY = selectedComponent.position.y + resizeStartSize.height - newHeight
            break
          case 'e': // right
            newWidth = Math.max(20, resizeStartSize.width + deltaX)
            break
          case 'w': // left
            newWidth = Math.max(20, resizeStartSize.width - deltaX)
            newX = selectedComponent.position.x + resizeStartSize.width - newWidth
            break
          case 's': // bottom
            newHeight = Math.max(20, resizeStartSize.height + deltaY)
            break
          case 'n': // top
            newHeight = Math.max(20, resizeStartSize.height - deltaY)
            newY = selectedComponent.position.y + resizeStartSize.height - newHeight
            break
        }
        
        // Constrain to screen bounds
        const currentScreen = screens.find(s => s.id === activeScreen)
        if (currentScreen) {
          // Clamp width/height so the component doesn't go outside the screen
          newWidth = Math.min(newWidth, currentScreen.width - newX)
          newHeight = Math.min(newHeight, currentScreen.height - newY)
          // Clamp position so the component doesn't go outside the screen
          newX = Math.max(0, Math.min(newX, currentScreen.width - newWidth))
          newY = Math.max(0, Math.min(newY, currentScreen.height - newHeight))
        }
        
        updateComponentLocal(selectedComponent.id, {
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight }
        })
      }
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeHandle(null)
    
    // Trigger save when component resize ends
    if (projectId && selectedComponent) {
      console.log('Component resized, triggering save...')
      setTimeout(() => {
        if (!isSaving && !isLoadingData) {
          saveProjectData()
        }
      }, 2000) // 2 second delay to prevent rapid saves
    }
  }

  // Drag from library handlers
  const handleLibraryDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('componentType', componentType)
    setIsDraggingFromLibrary(true)
    setDraggedComponentType(componentType)
    console.log('Started dragging component:', componentType)
  }

  const handleLibraryDragEnd = () => {
    setIsDraggingFromLibrary(false)
    setDraggedComponentType(null)
  }

  const handleScreenDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const componentType = e.dataTransfer.getData('componentType')
    const draggedComponentData = e.dataTransfer.getData('draggedComponent')
    
    // Get the screen that was dropped on by finding the closest screen element
    const dropTarget = e.currentTarget as HTMLElement
    const screenElement = dropTarget.closest('[data-screen-id]') as HTMLElement
    const targetScreenId = screenElement?.getAttribute('data-screen-id')
    
    if (!targetScreenId) {
      console.error('Could not determine target screen')
      return
    }
    
    // Find the target screen and its active layer
    const targetScreen = screens.find(s => s.id === targetScreenId)
    if (!targetScreen) {
      console.error('Target screen not found:', targetScreenId)
      return
    }
    
    const targetLayer = targetScreen.layers.find(l => l.id === targetScreen.activeLayer)
    if (!targetLayer) {
      console.error('Target layer not found for screen:', targetScreenId)
      return
    }
    
    // Handle dropping a component from another screen
    if (draggedComponentData && isDraggingComponent && draggedComponent) {
      try {
        const componentToMove = JSON.parse(draggedComponentData) as Component
        
        // Calculate drop position relative to the screen content
        const screenContentElement = e.currentTarget as HTMLElement
        const rect = screenContentElement.getBoundingClientRect()
        let dropX = (e.clientX - rect.left) / zoom
        let dropY = (e.clientY - rect.top) / zoom
        
        // Constrain to screen bounds
        const screenWidth = targetScreen.width || 400
        const screenHeight = targetScreen.height || 600
        const componentWidth = componentToMove.size.width
        const componentHeight = componentToMove.size.height
        
        dropX = Math.max(0, Math.min(dropX, screenWidth - componentWidth))
        dropY = Math.max(0, Math.min(dropY, screenHeight - componentHeight))
        
        // Create new component with updated position
        const movedComponent: Component = {
          ...componentToMove,
          id: Date.now().toString(), // New ID to avoid conflicts
          position: { x: dropX, y: dropY }
        }
        
        console.log('Moving component to target screen:', targetScreenId, movedComponent.id)
        
        // Add component to target screen
          const updatedLayers = targetScreen.layers.map(layer => 
            layer.id === targetScreen.activeLayer 
              ? { ...layer, components: [...layer.components, movedComponent] }
              : layer
          )
          
        updateScreen(targetScreenId, {
            layers: updatedLayers
          })
          
          // Remove component from source screen
          if (sourceScreenId && sourceLayerId) {
            const sourceScreen = screens.find(s => s.id === sourceScreenId)
            if (sourceScreen) {
              const sourceLayers = sourceScreen.layers.map(layer => 
                layer.id === sourceLayerId
                  ? { ...layer, components: layer.components.filter(c => c.id !== componentToMove.id) }
                  : layer
              )
              
              updateScreen(sourceScreenId, {
                layers: sourceLayers
              })
            }
          }
          
        // Update selection to the moved component
          setSelectedComponent(movedComponent)
        
        // Reset cross-screen dragging state
        setIsDraggingComponent(false)
        setDraggedComponent(null)
        setSourceScreenId(null)
        setSourceLayerId(null)
        
        return
      } catch (error) {
        console.error('Error parsing dragged component data:', error)
      }
    }
    
    // Handle dropping a new component from library
    if (componentType) {
      // Calculate drop position relative to the screen content
      const screenContentElement = e.currentTarget as HTMLElement
      const rect = screenContentElement.getBoundingClientRect()
      let dropX = (e.clientX - rect.left) / zoom
      let dropY = (e.clientY - rect.top) / zoom
      
      // Constrain to screen bounds
      const screenWidth = targetScreen.width || 400
      const screenHeight = targetScreen.height || 600
      const componentWidth = 200
      const componentHeight = 100
      
      dropX = Math.max(0, Math.min(dropX, screenWidth - componentWidth))
      dropY = Math.max(0, Math.min(dropY, screenHeight - componentHeight))
      
      // Check for overlap with existing components
      const existingComponents = targetLayer.components
      let hasOverlap = false
      
      for (const component of existingComponents) {
        const overlap = !(
          dropX + componentWidth < component.position.x ||
          dropX > component.position.x + component.size.width ||
          dropY + componentHeight < component.position.y ||
          dropY > component.position.y + component.size.height
        )
        
        if (overlap) {
          hasOverlap = true
          break
        }
      }
      
      // If there's overlap, find a nearby position
      if (hasOverlap) {
        const gridSize = 20
        let attempts = 0
        const maxAttempts = 50
        
        while (attempts < maxAttempts) {
          dropX += gridSize
          if (dropX > screenWidth - componentWidth) {
            dropX = 0
            dropY += gridSize
          }
          
          if (dropY > screenHeight - componentHeight) {
            dropY = 0
          }
          
          hasOverlap = false
          for (const component of existingComponents) {
            const overlap = !(
              dropX + componentWidth < component.position.x ||
              dropX > component.position.x + component.size.width ||
              dropY + componentHeight < component.position.y ||
              dropY > component.position.y + component.size.height
            )
            
            if (overlap) {
              hasOverlap = true
              break
            }
          }
          
          if (!hasOverlap) {
            break
          }
          
          attempts++
        }
      }
      
      const newComponent: Component = {
        id: Date.now().toString(),
        type: componentType,
        name: `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} ${Date.now()}`,
        props: {},
        position: { x: dropX, y: dropY },
        size: { width: componentWidth, height: componentHeight },
        backgroundColor: '#ffffff',
        interactions: {},
        dataBinding: {},
        zIndex: targetLayer.components.length + 1
      }

      console.log('Dropping component on target screen:', targetScreenId, 'at position:', { x: dropX, y: dropY })

      // Add component to the context
      addComponent(newComponent)
      
      // Update the target screen's active layer with the new component
      const updatedLayers = targetScreen.layers.map(layer => 
        layer.id === targetScreen.activeLayer 
          ? { ...layer, components: [...layer.components, newComponent] }
          : layer
      )
      
      updateScreen(targetScreenId, {
        layers: updatedLayers
      })
      
      setSelectedComponent(newComponent)
    }
    setIsDraggingFromLibrary(false)
    setDraggedComponentType(null)
    
    // Trigger save when component is dropped
    if (projectId) {
      console.log('Component dropped, triggering save...')
      setTimeout(() => {
        if (!isSaving && !isLoadingData) {
          saveProjectData()
        }
      }, 3000) // 3 second delay to prevent rapid saves
    }
  }

  const handleScreenDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Component layering functions
  const bringToFront = (componentId: string) => {
    if (!currentScreen || !currentLayer) return
    
    const maxZIndex = Math.max(...currentLayer.components.map(c => c.zIndex || 1))
    updateComponent(componentId, { zIndex: maxZIndex + 1 })
  }

  const sendToBack = (componentId: string) => {
    if (!currentScreen || !currentLayer) return
    
    const minZIndex = Math.min(...currentLayer.components.map(c => c.zIndex || 1))
    updateComponent(componentId, { zIndex: minZIndex - 1 })
  }

  const bringForward = (componentId: string) => {
    if (!currentScreen || !currentLayer) return
    
    const component = currentLayer.components.find(c => c.id === componentId)
    if (!component) return
    
    const currentZIndex = component.zIndex || 1
    const nextComponent = currentLayer.components
      .filter(c => c.id !== componentId)
      .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
      .find(c => (c.zIndex || 1) > currentZIndex)
    
    if (nextComponent) {
      updateComponent(componentId, { zIndex: (nextComponent.zIndex || 1) + 1 })
    }
  }

  const sendBackward = (componentId: string) => {
    if (!currentScreen || !currentLayer) return
    
    const component = currentLayer.components.find(c => c.id === componentId)
    if (!component) return
    
    const currentZIndex = component.zIndex || 1
    const prevComponent = currentLayer.components
      .filter(c => c.id !== componentId)
      .sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1))
      .find(c => (c.zIndex || 1) < currentZIndex)
    
    if (prevComponent) {
      updateComponent(componentId, { zIndex: (prevComponent.zIndex || 1) - 1 })
    }
  }

  // Delete selected component
  const deleteSelectedComponent = () => {
    if (selectedComponent) {
      deleteComponent(selectedComponent.id)
      setSelectedComponent(null)
    }
  }

  // Delete active screen
  const deleteActiveScreen = () => {
    if (activeScreen && screens.length > 1) {
      const screenToDelete = screens.find(s => s.id === activeScreen)
      if (screenToDelete) {
        if (window.confirm(`Are you sure you want to delete "${screenToDelete.name}"? This action cannot be undone.`)) {
          deleteScreen(activeScreen)
        }
      }
    } else if (screens.length <= 1) {
      alert('Cannot delete the last screen. Please add another screen first.')
    }
  }

  // Calculate dynamic canvas size based on number of screens
  const calculateCanvasSize = (): { width: string; height: string } => {
    if (screens.length === 0) {
      return { width: '2000px', height: '2000px' }
    }

    // Calculate canvas size based on screen positions like logic mode
    let minX = 0, minY = 0, maxX = 0, maxY = 0

    screens.forEach(screen => {
      const screenPosition = screenPositions[screen.id] || { x: 100, y: 100 }
      const screenRight = screenPosition.x + screen.width
      const screenBottom = screenPosition.y + screen.height

      minX = Math.min(minX, screenPosition.x)
      minY = Math.min(minY, screenPosition.y)
      maxX = Math.max(maxX, screenRight)
      maxY = Math.max(maxY, screenBottom)
    })

    // Add padding around all screens
    const padding = 200
    return {
      width: `${Math.max(2000, maxX - minX + padding * 2)}px`,
      height: `${Math.max(2000, maxY - minY + padding * 2)}px`
    }
  }

  const canvasSize = calculateCanvasSize()

  // Helper function to calculate screen position consistently
  const calculateScreenPosition = (screenIndex: number, _screen: Screen): { defaultX: number; defaultY: number } => {
    // If this is the first screen, position it at the center
    if (screenIndex === 0) {
      return { defaultX: 100, defaultY: 100 }
    }
    
    // For subsequent screens, position them beside the previous screen
    const gapX = 50 // Horizontal gap between screens
    const gapY = 50 // Vertical gap between screens
    
    // Get the position of the previous screen
    const previousScreen = screens[screenIndex - 1]
    const previousPosition = screenPositions[previousScreen.id] || { x: 0, y: 0 }
    const previousScreenIndex = screens.findIndex(s => s.id === previousScreen.id)
    const previousDefaultPos: { defaultX: number; defaultY: number } = calculateScreenPosition(previousScreenIndex, previousScreen)
    
    const previousX: number = previousPosition.x + previousDefaultPos.defaultX
    const previousY: number = previousPosition.y + previousDefaultPos.defaultY
    
    // Position the new screen to the right of the previous screen
    // If there's not enough space to the right, position it below
    const newX: number = previousX + previousScreen.width + gapX
    const newY: number = previousY
    
    // Check if the new position would be too far to the right
    // If so, position it below the first screen in the row
    const maxX = 1200 // Maximum X position before wrapping
    if (newX > maxX) {
      // Find the first screen in the current row and position below it
      const firstScreenInRow = screens[0]
      const firstPosition = screenPositions[firstScreenInRow.id] || { x: 0, y: 0 }
      const firstDefaultPos: { defaultX: number; defaultY: number } = calculateScreenPosition(0, firstScreenInRow)
      const firstX: number = firstPosition.x + firstDefaultPos.defaultX
      const firstY: number = firstPosition.y + firstDefaultPos.defaultY
      
      return {
        defaultX: firstX,
        defaultY: firstY + firstScreenInRow.height + gapY
      }
    }
    
    return { defaultX: newX, defaultY: newY }
  }

  // Recalculate canvas size when screens change
  useEffect(() => {
    // Force re-render when screens array changes
    // const newCanvasSize = calculateCanvasSize()
    // The canvas size will be recalculated on next render
  }, [screens.length])

  // Close screen selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showScreenSelector && !target.closest('.screen-selector')) {
        setShowScreenSelector(false)
      }
    }

      document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showScreenSelector])

  // Global mouse event handlers for dragging and resizing
  useEffect(() => {

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        e.preventDefault()
      }
    }

    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false)
        document.body.style.cursor = 'default'
      }
      if (draggedScreen) {
        setDraggedScreen(null)
        setScreenDragOffset({ x: 0, y: 0 })
        document.body.style.cursor = 'default'
      }
      if (isDragging) {
        setIsDragging(false)
        setSelectedComponent(null)
        document.body.style.cursor = 'default'
      }
      if (isResizing) {
        setIsResizing(false)
        setResizeHandle(null)
        document.body.style.cursor = 'default'
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = 'grabbing'
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = 'default'
    }
  }, [isDragging, isResizing, isPanning, draggedScreen, screenDragOffset, pan, zoom, selectedComponent, activeScreen, screens, screenPositions])


  // Helper function to automatically position new screens beside the current active screen
  const [isCreatingScreen, setIsCreatingScreen] = useState(false)
  
  const createScreenWithPosition = (screenData: Partial<Screen>) => {
    // Prevent multiple rapid screen creations
    if (isCreatingScreen) {
      console.log('Screen creation already in progress, skipping...')
      return
    }
    
    console.log('Creating new screen:', screenData.name)
    setIsCreatingScreen(true)
    
    const timestamp = Date.now()
    const newScreen: Screen = {
      id: timestamp.toString(),
      name: screenData.name || `Screen ${timestamp}`,
      width: screenData.width || 1200,
      height: screenData.height || 800,
      type: screenData.type || 'custom',
      layers: [
        {
          id: timestamp.toString() + '_layer',
          name: 'Main Layout',
          visible: true,
          locked: false,
          components: []
        }
      ],
      activeLayer: timestamp.toString() + '_layer'
    }
    
    console.log('Adding screen to context:', newScreen.id)
    // Add the screen and set it as active immediately
    addScreen(newScreen)
    setActiveScreen(newScreen.id)
    
    // Calculate position for the new screen beside the current active screen
    let newPosition = { x: 200, y: 200 } // Default position if no active screen
    
    if (activeScreen && screens.length > 0) {
      // Find the currently active screen
      const currentActiveScreen = screens.find(s => s.id === activeScreen)
      if (currentActiveScreen) {
        // Get the current active screen's position
        const currentScreenPosition = screenPositions[activeScreen] || { x: 0, y: 0 }
        const currentScreenIndex = screens.findIndex(s => s.id === activeScreen)
        const { defaultX: currentDefaultX, defaultY: currentDefaultY } = calculateScreenPosition(currentScreenIndex, currentActiveScreen)
        
        // Calculate the actual position of the current active screen
        const currentScreenX = currentDefaultX + currentScreenPosition.x
        const currentScreenY = currentDefaultY + currentScreenPosition.y
        
        // Position the new screen to the right of the current active screen
        const spacing = 50 // Space between screens
        newPosition = {
          x: currentScreenX + currentActiveScreen.width + spacing,
          y: currentScreenY
        }
        
        // If the new position would be too far to the right, position it below
        const maxX = 1200 // Maximum X position before wrapping
        if (newPosition.x > maxX) {
          newPosition = {
            x: currentScreenX,
            y: currentScreenY + currentActiveScreen.height + spacing
          }
        }
        
        console.log('Positioning new screen beside active screen:', {
          currentScreen: currentActiveScreen.name,
          currentPosition: { x: currentScreenX, y: currentScreenY },
          newPosition: newPosition
        })
      }
    }
    
    // Set initial position for the new screen
      setScreenPositions(prev => ({
        ...prev,
      [newScreen.id]: newPosition
    }))
    
    // Center the view on the new screen to ensure it's visible
    setTimeout(() => {
      const canvasContainer = containerRef.current
      if (canvasContainer) {
        const containerRect = canvasContainer.getBoundingClientRect()
        const centerX = containerRect.width / 2
        const centerY = containerRect.height / 2
        
        // Calculate pan to center the new screen
        const newScreenX = newPosition.x + newScreen.width / 2
        const newScreenY = newPosition.y + newScreen.height / 2
        
        setPan({
          x: centerX - newScreenX * zoom,
          y: centerY - newScreenY * zoom
        })
      }
    }, 100)
    
    setIsCreatingScreen(false)
  }

  // Fetch project information
  const fetchProjectInfo = useCallback(async () => {
    if (!projectId) return
    
    setLoadingProject(true)
    try {
      const projectData = await ProjectService.getProjectWithData(projectId)
      setProjectInfo({
        name: projectData.project.name,
        language: projectData.project.language,
        device: projectData.project.device
      })
    } catch (error) {
      console.error('Error fetching project info:', error)
    } finally {
      setLoadingProject(false)
    }
  }, [projectId])
  
  // Load project info on mount
  useEffect(() => {
    fetchProjectInfo()
  }, [fetchProjectInfo])

  // Toolbar state
  const [activeTool, setActiveTool] = useState<'select' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'image' | 'line'>('select')
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingStart, setDrawingStart] = useState({ x: 0, y: 0 })
  const [currentDrawing, setCurrentDrawing] = useState<any>(null)

  // Toolbar functions
  const handleToolSelect = (tool: 'select' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'image' | 'line') => {
    setActiveTool(tool)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'select') {
      // Handle selection
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    setIsDrawing(true)
    setDrawingStart({ x, y })

    // Create a temporary drawing element
    const drawingElement = {
      type: activeTool,
      x,
      y,
      width: 0,
      height: 0,
      id: Date.now().toString()
    }

    setCurrentDrawing(drawingElement)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentDrawing) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    const width = Math.abs(x - drawingStart.x)
    const height = Math.abs(y - drawingStart.y)

    setCurrentDrawing({
      ...currentDrawing,
      width,
      height
    })
  }

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentDrawing) return

    // Convert drawing to component
    const component: Component = {
      id: currentDrawing.id,
      name: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} ${Date.now()}`,
      type: activeTool,
      position: { x: currentDrawing.x, y: currentDrawing.y },
      size: { width: Math.max(currentDrawing.width, 20), height: Math.max(currentDrawing.height, 20) },
      backgroundColor: '#3b82f6',
      zIndex: 1,
      props: {}
    }

    // Add component to active screen
    if (activeScreen) {
      addComponent(component)
    }

    setIsDrawing(false)
    setCurrentDrawing(null)
    setActiveTool('select')
  }

  return (
    <div className="h-screen flex bg-gray-50 font-['Inter'] font-semibold">
      {/* Loading Indicator */}
      {isLoadingData && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading design data...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we load your project</p>
          </div>
        </div>
      )}
      
      {/* Left Panel - Library & Layers & Variables & Screens */}
      {sidebarVisible && (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Top Section - Project Name & Tabs */}
          <div className="p-4 border-b border-gray-200">
            {/* Project Name */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {loadingProject ? 'Loading...' : (projectInfo?.name || 'Untitled')}
              </div>
                <div className="text-xs text-gray-500">
                  {projectInfo ? `${projectInfo.language} • ${projectInfo.device}` : 'Drafts'}
                </div>
              </div>
              <button 
                onClick={() => setSidebarVisible(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Hide sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* File/Assets Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('file')}
                className={`flex-1 text-xs py-2 px-3 rounded-md transition-colors ${
                  activeTab === 'file' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                File
              </button>
              <button 
                onClick={() => setActiveTab('assets')}
                className={`flex-1 text-xs py-2 px-3 rounded-md transition-colors ${
                  activeTab === 'assets' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Assets
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'file' && (
              <>
                {/* Screens Section */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Screens</h3>
                    <div className="relative">
                      <button 
                        onClick={() => setShowScreenSelector(!showScreenSelector)}
                        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md screen-selector"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Screen</span>
                      </button>
                      
                      {/* Screen Type Selector Dropdown */}
                      {showScreenSelector && (
                        <div className="fixed left-64 top-20 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden screen-selector">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-medium text-gray-900">Add Screen</h3>
                              <button
                                onClick={() => setShowScreenSelector(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Helpful message about positioning */}
                            {activeScreen && screens.length > 0 && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="text-xs text-blue-700">
                                    <div className="font-medium">New screen will be positioned beside:</div>
                                    <div className="text-blue-600">
                                      {screens.find(s => s.id === activeScreen)?.name || 'Active screen'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {/* iOS Devices */}
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">iOS</h4>
                                </div>
                                <div className="space-y-1">
                                  {screenPresets.filter(preset => preset.category === 'iOS').map((preset) => (
                            <button
                                      key={preset.name}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-xs"
                              onClick={() => {
                                createScreenWithPosition({
                                          name: preset.name,
                                          width: preset.width,
                                          height: preset.height,
                                          type: preset.type
                                })
                                setShowScreenSelector(false)
                              }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <preset.icon className="w-4 h-4 text-gray-500" />
                                          <div>
                                            <div className="font-medium text-gray-900">{preset.name}</div>
                                            <div className="text-gray-500">{preset.description}</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-gray-500">{preset.width}×{preset.height}</div>
                                          <div className="text-gray-400">{preset.ratio}</div>
                                        </div>
                                      </div>
                            </button>
                                  ))}
                                </div>
                              </div>

                              {/* Android Devices */}
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Android</h4>
                                </div>
                                <div className="space-y-1">
                                  {screenPresets.filter(preset => preset.category === 'Android').map((preset) => (
                              <button
                                key={preset.name}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-xs"
                                onClick={() => {
                                  createScreenWithPosition({
                                    name: preset.name,
                                    width: preset.width,
                                    height: preset.height,
                                    type: preset.type
                                  })
                                  setShowScreenSelector(false)
                                }}
                              >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                <preset.icon className="w-4 h-4 text-gray-500" />
                                          <div>
                                            <div className="font-medium text-gray-900">{preset.name}</div>
                                            <div className="text-gray-500">{preset.description}</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-gray-500">{preset.width}×{preset.height}</div>
                                          <div className="text-gray-400">{preset.ratio}</div>
                                        </div>
                                      </div>
                              </button>
                            ))}
                                </div>
                              </div>

                              {/* Desktop */}
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Desktop</h4>
                                </div>
                                <div className="space-y-1">
                                  {screenPresets.filter(preset => preset.category === 'Desktop').map((preset) => (
                                    <button
                                      key={preset.name}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-xs"
                                      onClick={() => {
                                        createScreenWithPosition({
                                          name: preset.name,
                                          width: preset.width,
                                          height: preset.height,
                                          type: preset.type
                                        })
                                        setShowScreenSelector(false)
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <preset.icon className="w-4 h-4 text-gray-500" />
                                          <div>
                                            <div className="font-medium text-gray-900">{preset.name}</div>
                                            <div className="text-gray-500">{preset.description}</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-gray-500">{preset.width}×{preset.height}</div>
                                          <div className="text-gray-400">{preset.ratio}</div>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Custom */}
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Custom</h4>
                                </div>
                                <div className="space-y-1">
                                  {screenPresets.filter(preset => preset.category === 'Custom').map((preset) => (
                                    <button
                                      key={preset.name}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-xs"
                                      onClick={() => {
                                        createScreenWithPosition({
                                          name: preset.name,
                                          width: preset.width,
                                          height: preset.height,
                                          type: preset.type
                                        })
                                        setShowScreenSelector(false)
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <preset.icon className="w-4 h-4 text-gray-500" />
                                          <div>
                                            <div className="font-medium text-gray-900">{preset.name}</div>
                                            <div className="text-gray-500">{preset.description}</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-gray-500">{preset.width}×{preset.height}</div>
                                          <div className="text-gray-400">{preset.ratio}</div>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {screens.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No screens yet</p>
                        <p className="text-xs text-gray-500">Add a screen to get started</p>
                      </div>
                    ) : (
                      screens.map((screen, index) => {
                        const { defaultX, defaultY } = calculateScreenPosition(index, screen)
                        const currentPosition = screenPositions[screen.id] || { x: 0, y: 0 }
                        const actualX = currentPosition.x + defaultX
                        const actualY = currentPosition.y + defaultY
                        
                        return (
                          <div
                            key={screen.id}
                            className={`group relative bg-white border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              activeScreen === screen.id 
                                ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              if (!isPanning && !draggedScreen) {
                                setActiveScreen(screen.id)
                              }
                            }}
                            onDoubleClick={() => {
                              // Navigate to the screen on canvas
                              const canvasContainer = document.querySelector('.flex-1.bg-gray-100.overflow-hidden.relative') as HTMLElement
                              if (canvasContainer) {
                                const canvasRect = canvasContainer.getBoundingClientRect()
                                const containerWidth = canvasRect.width
                                const containerHeight = canvasRect.height
                                
                                const centerX = actualX + screen.width / 2
                                const centerY = actualY + screen.height / 2
                                
                                const newPanX = containerWidth / 2 - centerX
                                const newPanY = containerHeight / 2 - centerY
                                
                                setPan({ x: newPanX, y: newPanY })
                                setZoom(1)
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                {/* Screen Name with Inline Editing */}
                                <div className="flex items-center space-x-2 mb-2">
                                  {/* Active Screen Indicator */}
                                  {activeScreen === screen.id && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={screen.name}
                                      onChange={(e) => updateScreen(screen.id, { name: e.target.value })}
                                      className={`w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white px-2 py-1 rounded min-w-0 truncate ${
                                        activeScreen === screen.id ? 'text-blue-700 font-semibold' : 'text-gray-900'
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                      onDoubleClick={(e) => e.stopPropagation()}
                                      placeholder="Screen name"
                                    />
                                  </div>
                                  
                                  {/* Screen Type Badge */}
                                  <span className={`px-2 py-1 text-xs rounded-full capitalize flex-shrink-0 ${
                                    screen.type === 'mobile' ? 'bg-blue-100 text-blue-700' :
                                    screen.type === 'tablet' ? 'bg-green-100 text-green-700' :
                                    screen.type === 'desktop' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {screen.type}
                                  </span>
                                </div>
                                  
                                  {/* Screen Dimensions */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {screen.width}×{screen.height}
                                  </span>
                                  
                                  {/* Component Count */}
                                  <span className="text-xs text-gray-400">
                                    {screen.layers.reduce((total, layer) => total + layer.components.length, 0)} components
                                  </span>
                                </div>
                                
                                {/* Tags Section */}
                                <div className="flex items-center space-x-1 mt-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const tag = prompt('Enter a tag for this screen:')
                                      if (tag && tag.trim()) {
                                        // Add tag functionality here
                                        console.log('Adding tag:', tag, 'to screen:', screen.id)
                                      }
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center space-x-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span>Add Tag</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Edit Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Focus on the name input
                                    const input = e.currentTarget.parentElement?.parentElement?.querySelector('input')
                                    if (input) {
                                      input.focus()
                                      input.select()
                                    }
                                  }}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                  title="Edit screen name"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                
                                {/* Delete Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (screens.length <= 1) {
                                      alert('Cannot delete the last screen')
                                      return
                                    }
                                    if (window.confirm(`Delete "${screen.name}"?`)) {
                                      deleteActiveScreen()
                                    }
                                  }}
                                  className={`text-gray-400 hover:text-red-500 p-1 ${
                                    screens.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  disabled={screens.length <= 1}
                                  title={screens.length <= 1 ? 'Cannot delete the last screen' : 'Delete screen'}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Layers Section */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Layers</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {activeScreen && screens.find(s => s.id === activeScreen)?.layers.map((layer) => (
                      <div key={layer.id} className="group">
                        {/* Layer Header */}
                        <div className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-100">
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <div className="w-4 h-4 bg-gray-300 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-700 flex-1 text-left">{layer.name}</span>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                            <button 
                              className={`${layer.visible ? 'text-gray-600' : 'text-gray-400'} hover:text-gray-600`}
                              onClick={(e) => {
                                e.stopPropagation()
                                const screen = screens.find(s => s.id === activeScreen)
                                if (screen) {
                                  const updatedLayers = screen.layers.map(l => 
                                    l.id === layer.id ? { ...l, visible: !l.visible } : l
                                  )
                                  updateScreen(screen.id, { layers: updatedLayers })
                                }
                              }}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button 
                              className={`${layer.locked ? 'text-gray-600' : 'text-gray-400'} hover:text-gray-600`}
                              onClick={(e) => {
                                e.stopPropagation()
                                const screen = screens.find(s => s.id === activeScreen)
                                if (screen) {
                                  const updatedLayers = screen.layers.map(l => 
                                    l.id === layer.id ? { ...l, locked: !l.locked } : l
                                  )
                                  updateScreen(screen.id, { layers: updatedLayers })
                                }
                              }}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Components in Layer */}
                        <div className="ml-6 space-y-1">
                          {layer.components.map((component) => (
                            <div 
                              key={component.id}
                              className={`flex items-center space-x-2 py-1 px-2 rounded text-xs ${
                                selectedComponent?.id === component.id 
                                  ? 'bg-blue-100 text-blue-900' 
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              onClick={() => setSelectedComponent(component)}
                            >
                              <div className="w-3 h-3 bg-gray-400 rounded"></div>
                              <span className="flex-1 truncate">{component.type}</span>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                                <button className="text-gray-400 hover:text-gray-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'assets' && (
              <div className="p-4 space-y-6">
                {/* UI Components Section */}
                <div>
                  <div className="mb-4 cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Layout className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">UI Components</h3>
                          <p className="text-sm text-gray-500">Essential building blocks</p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                          sidebarStates.library ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {sidebarStates.library && (
                    <div className="space-y-4">
                      {/* Basic Elements */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 px-1">Basic Elements</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {componentLibrary.slice(0, 6).map((component) => (
                            <button
                              key={component.type}
                              onClick={() => addComponentToCanvas(component.type)}
                              draggable
                              onDragStart={(e) => handleLibraryDragStart(e, component.type)}
                              onDragEnd={handleLibraryDragEnd}
                              className="group relative bg-white border border-gray-200 rounded-lg p-2 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 transition-all duration-200 cursor-grab active:cursor-grabbing"
                            >
                              {/* Component Preview */}
                              <div className="w-full h-12 mb-2 rounded border border-gray-100 overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                {renderComponentPreview(component.type)}
                              </div>
                              
                              {/* Component Info */}
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                  <component.icon className="h-3 w-3 text-gray-600 group-hover:text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{component.name}</span>
                              </div>
                              
                              {/* Hover Effect */}
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200 pointer-events-none" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Advanced Components */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 px-1">Advanced Components</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {componentLibrary.slice(6, 12).map((component) => (
                            <button
                              key={component.type}
                              onClick={() => addComponentToCanvas(component.type)}
                              draggable
                              onDragStart={(e) => handleLibraryDragStart(e, component.type)}
                              onDragEnd={handleLibraryDragEnd}
                              className="group relative bg-white border border-gray-200 rounded-lg p-2 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100 transition-all duration-200 cursor-grab active:cursor-grabbing"
                            >
                              {/* Component Preview */}
                              <div className="w-full h-12 mb-2 rounded border border-gray-100 overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                {renderComponentPreview(component.type)}
                              </div>
                              
                              {/* Component Info */}
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                  <component.icon className="h-3 w-3 text-gray-600 group-hover:text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{component.name}</span>
                              </div>
                              
                              {/* Hover Effect */}
                              <div className="absolute inset-0 bg-purple-500 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200 pointer-events-none" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Elements */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 px-1">Interactive Elements</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {componentLibrary.slice(12).map((component) => (
                            <button
                              key={component.type}
                              onClick={() => addComponentToCanvas(component.type)}
                              draggable
                              onDragStart={(e) => handleLibraryDragStart(e, component.type)}
                              onDragEnd={handleLibraryDragEnd}
                              className="group relative bg-white border border-gray-200 rounded-lg p-2 hover:border-green-300 hover:shadow-md hover:shadow-green-100 transition-all duration-200 cursor-grab active:cursor-grabbing"
                            >
                              {/* Component Preview */}
                              <div className="w-full h-12 mb-2 rounded border border-gray-100 overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-sm">
                                {renderComponentPreview(component.type)}
                              </div>
                              
                              {/* Component Info */}
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                  <component.icon className="h-3 w-3 text-gray-600 group-hover:text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">{component.name}</span>
                              </div>
                              
                              {/* Hover Effect */}
                              <div className="absolute inset-0 bg-green-500 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200 pointer-events-none" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-built Pages Section */}
                <div>
                  <div className="mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Pre-built Pages</h3>
                        <p className="text-sm text-gray-500">Complete page templates with functionality</p>
                      </div>
                      <ChevronDown 
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          sidebarStates.screens ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {sidebarStates.screens && (
                    <div className="space-y-3">
                      {/* Login Page */}
                      <button 
                        onClick={addLoginPage}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 text-sm">🔐</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Login Page</h4>
                              <p className="text-xs text-gray-500">Authentication form with validation</p>
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Add</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Form</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Data Binding</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">API</span>
                        </div>
                      </button>

                      {/* Dashboard Page */}
                      <button 
                        onClick={addDashboardPage}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <span className="text-green-600 text-sm">📊</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Dashboard</h4>
                              <p className="text-xs text-gray-500">Analytics with charts and metrics</p>
                            </div>
                          </div>
                          <div className="text-xs text-green-600 font-medium">Add</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Charts</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Data</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Actions</span>
                        </div>
                      </button>

                      {/* Profile Page */}
                      <button 
                        onClick={addProfilePage}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-purple-600 text-sm">👤</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Profile Page</h4>
                              <p className="text-xs text-gray-500">User profile with settings</p>
                            </div>
                          </div>
                          <div className="text-xs text-purple-600 font-medium">Add</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Profile</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Settings</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Avatar</span>
                        </div>
                      </button>

                      {/* E-commerce Page */}
                      <button 
                        onClick={addEcommercePage}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <span className="text-orange-600 text-sm">🛒</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">E-commerce</h4>
                              <p className="text-xs text-gray-500">Product catalog with cart</p>
                            </div>
                          </div>
                          <div className="text-xs text-orange-600 font-medium">Add</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Products</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Cart</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Checkout</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Back to Dashboard Button - Bottom */}
          <div className="p-4 border-t border-gray-200">
        <button
              onClick={() => navigate('/user-dashboard')}
              className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
              <span>Back to Dashboard</span>
        </button>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 bg-gray-100 overflow-hidden relative">
        {/* Canvas Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            {/* Show Sidebar Button and Project Name (when hidden) */}
            {!sidebarVisible && (
              <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarVisible(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Show sidebar"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
            </button>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">C</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {loadingProject ? 'Loading...' : (projectInfo?.name || 'Untitled')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {projectInfo ? `${projectInfo.language} • ${projectInfo.device}` : 'Drafts'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <span className="text-sm text-gray-600">
              {screens.length} Screens • Active: {currentScreen?.name} ({currentScreen?.width}x{currentScreen?.height})
            </span>
            <div className="h-4 w-px bg-gray-300"></div>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              <Eye className="h-4 w-4" />
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              <Move className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              className="p-1 text-gray-600 hover:text-gray-900"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button 
              onClick={() => {
                // Fit all screens to viewport using dynamic canvas size
                const containerWidth = containerRef.current?.clientWidth || 800
                const containerHeight = containerRef.current?.clientHeight || 600
                const canvasDimensions = calculateCanvasSize()
                const canvasWidth = parseInt(canvasDimensions.width)
                const canvasHeight = parseInt(canvasDimensions.height)
                
                const scaleX = containerWidth / canvasWidth
                const scaleY = containerHeight / canvasHeight
                const newZoom = Math.min(scaleX, scaleY, 1) * 0.8 // 80% of fit
                setZoom(newZoom)
                setPan({ x: 0, y: 0 })
              }}
              className="p-1 text-gray-600 hover:text-gray-900"
              title="Fit All Screens"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <button 
              onClick={manualSave}
              disabled={isSaving}
              className={`text-sm flex items-center space-x-1 ${
                isSaving 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : savedIndicator
                  ? 'text-green-600 cursor-default'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Save project (Ctrl+S)"
            >
              {isSaving ? (
                <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : savedIndicator ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              <span>{isSaving ? 'Saving...' : savedIndicator ? 'Saved!' : 'Save'}</span>
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-900">Undo</button>
            <button className="text-sm text-gray-600 hover:text-gray-900">Redo</button>
            <button 
              onClick={() => {
                console.log('Force reload triggered')
                setHasLoadedData(false)
                setIsLoadingData(false)
                loadProjectData()
              }}
              className="text-sm text-red-600 hover:text-red-800"
              title="Force reload project data (debug)"
            >
              Reload
            </button>
          </div>
        </div>
        {/* Canvas Area with Figma-style background */}
        <div 
          ref={containerRef}
          className="flex-1 bg-gray-100 overflow-hidden relative"
          style={{ 
            height: 'calc(100vh - 48px)', // Subtract toolbar height
            cursor: isPanning ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onMouseDown={handleMouseDownPan}
          onMouseMove={handleMouseMovePan}
          onMouseUp={() => {
            if (activeTool === 'select') {
              handleMouseUpPan()
            } else {
              handleCanvasMouseUp()
            }
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Pan indicator */}
          {!isPanning && !draggedScreen && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Trackpad to pan • Ctrl/Cmd + scroll to zoom • Drag screens to move • Click to select
            </div>
          )}
          
          {/* Panning indicator */}
          {isPanning && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded animate-pulse">
              Panning... Release to stop
            </div>
          )}
          
          {/* Screen dragging indicator */}
          {draggedScreen && (
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded animate-pulse">
              Moving screen... Release to place
            </div>
          )}
          
          {/* Component drag indicator */}
          {isDraggingFromLibrary && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded animate-pulse">
              Dragging {draggedComponentType}... Drop on screen
            </div>
          )}
          
          {/* Cross-screen component drag indicator */}
          {isDraggingComponent && draggedComponent && (
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs px-2 py-1 rounded animate-pulse">
              Moving {draggedComponent.name} to another screen...
            </div>
          )}
          
          {/* Figma-style dot background */}
          <div />
          
          {/* Canvas Container - Clean Canvas like Logic Mode */}
          <div 
            className="absolute"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            {/* Clean Canvas Background like Logic Mode */}
            <div className="absolute inset-0 bg-gray-50" />
            
            {/* Debug Info */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 text-xs text-gray-700 px-2 py-1 rounded">
              Canvas: {canvasSize.width} × {canvasSize.height} • Screens: {screens.length} • Zoom: {Math.round(zoom * 100)}%
            </div>
            
            {/* Background element for pan events */}
            <div 
              className="absolute inset-0"
              onMouseDown={(e) => {
                if (activeTool === 'select') {
                  handleMouseDownPan(e)
                } else {
                  handleCanvasMouseDown(e)
                }
              }}
              onMouseMove={(e) => {
                if (activeTool === 'select') {
                  handleMouseMovePan(e)
                } else {
                  handleCanvasMouseMove(e)
                }
              }}
              onMouseUp={(e) => {
                if (activeTool === 'select') {
                  handleMouseUpPan()
                } else {
                  handleCanvasMouseUp()
                }
              }}
            />
            
            {/* Drawing Preview */}
            {isDrawing && currentDrawing && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                style={{
                  left: currentDrawing.x,
                  top: currentDrawing.y,
                  width: Math.max(currentDrawing.width, 1),
                  height: Math.max(currentDrawing.height, 1)
                }}
              />
            )}
            
            {/* Empty State */}
            {screens.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Add Your First Screen</h3>
                  <p className="text-sm text-gray-500 mb-4">Start designing your app by adding a screen</p>
                  <button 
                    onClick={() => setShowScreenSelector(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    Add Screen
                  </button>
                </div>
              </div>
            )}
            
            {/* Freely Positioned Screens like Logic Mode */}
              {screens.map((screen, index) => {
                const screenLayer = screen.layers.find(layer => layer.id === screen.activeLayer)
              const screenPosition = screenPositions[screen.id] || { x: 100 + index * 50, y: 100 + index * 50 }
                
                return (
                  <div
                    key={screen.id}
                    data-screen-id={screen.id}
                    className={`absolute bg-white shadow-lg rounded-lg overflow-hidden ${
                      activeScreen === screen.id ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'
                    } ${draggedScreen === screen.id ? 'z-50' : 'z-10'}`}
                    style={{ 
                      width: screen.width || 400, 
                      height: screen.height || 600,
                      cursor: draggedScreen === screen.id ? 'grabbing' : (isPanning ? 'grabbing' : 'grab'),
                    left: screenPosition.x,
                    top: screenPosition.y,
                      transform: draggedScreen === screen.id ? 'scale(1.02)' : 'scale(1)',
                      transition: draggedScreen === screen.id ? 'none' : 'transform 0.2s ease-out',
                    }}
                    onClick={() => {
                      if (!isPanning && !draggedScreen) {
                        setActiveScreen(screen.id)
                      }
                    }}
                    onMouseDown={(e) => handleScreenMouseDown(e, screen.id)}
                    onDrop={handleScreenDrop}
                    onDragOver={handleScreenDragOver}
                  >
                    {/* Screen Header */}
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          activeScreen === screen.id ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={screen.name}
                            onChange={(e) => updateScreen(screen.id, { name: e.target.value })}
                            className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white px-2 py-1 rounded min-w-0"
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-gray-500">({screen.width}x{screen.height})</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">{screen.type}</span>
                      </div>
                    </div>
                    
                    {/* Screen Content */}
                    <div 
                      className={`relative w-full h-full ${
                        isDraggingFromLibrary ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
                      }`}
                      style={{ height: `calc(100% - 40px)` }}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onDrop={handleScreenDrop}
                      onDragOver={handleScreenDragOver}
                      onClick={(e) => {
                        if (activeScreen === screen.id) {
                          handleCanvasClick(e)
                        }
                      }}
                    >
                      {screenLayer?.visible && screenLayer.components.map((component) => (
                        <div
                          key={component.id}
                          draggable={isDraggingComponent && draggedComponent?.id === component.id}
                          onDragStart={(e) => {
                            if (isDraggingComponent && draggedComponent?.id === component.id) {
                              e.dataTransfer.setData('draggedComponent', JSON.stringify(component))
                              e.dataTransfer.effectAllowed = 'move'
                              console.log('Starting cross-screen drag for component:', component.id)
                            }
                          }}
                          onMouseDown={(e) => {
                            if (activeScreen === screen.id) {
                              e.stopPropagation()
                              handleMouseDown(e, component)
                            }
                          }}
                          className={`absolute border-2 select-none ${
                            selectedComponent?.id === component.id && activeScreen === screen.id
                              ? 'border-blue-500 z-10' 
                              : 'border-gray-300 hover:border-gray-400'
                          } ${component.interactions?.hover ? 'hover:scale-105 transition-transform' : ''}`}
                          style={{
                            left: component.position.x,
                            top: component.position.y,
                            width: component.size.width,
                            height: component.size.height,
                            userSelect: 'none',
                            backgroundColor: component.backgroundColor,
                            zIndex: component.zIndex || 1,
                            cursor: isDragging && selectedComponent?.id === component.id ? 'grabbing' : 
                                   isResizing && selectedComponent?.id === component.id ? 'grabbing' : 'grab',
                            ...(component.interactions?.animation === 'fadeIn' && { animation: 'fadeIn 0.5s ease-in' }),
                            ...(component.interactions?.animation === 'slideUp' && { animation: 'slideUp 0.5s ease-out' }),
                            ...(component.interactions?.animation === 'bounce' && { animation: 'bounce 1s infinite' })
                          }}
                        >
                          <div 
                            className="w-full h-full pointer-events-none"
                            style={{ pointerEvents: 'none' }}
                          >
                            {renderComponent(component)}
                          </div>
                          
                          {/* Resize Handles - Only show when component is selected */}
                          {selectedComponent?.id === component.id && activeScreen === screen.id && (
                            <>
                              {/* Corner handles */}
                              <div
                                className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-nw-resize"
                                onMouseDown={(e) => handleResizeStart(e, component, 'nw')}
                              />
                              <div
                                className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-ne-resize"
                                onMouseDown={(e) => handleResizeStart(e, component, 'ne')}
                              />
                              <div
                                className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-sw-resize"
                                onMouseDown={(e) => handleResizeStart(e, component, 'sw')}
                              />
                              <div
                                className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-se-resize"
                                onMouseDown={(e) => handleResizeStart(e, component, 'se')}
                              />
                              
                              {/* Edge handles */}
                              <div
                              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-n-resize"
                              onMouseDown={(e) => handleResizeStart(e, component, 'n')}
                              />
                              <div
                              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-s-resize"
                              onMouseDown={(e) => handleResizeStart(e, component, 's')}
                              />
                              <div
                              className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-w-resize"
                              onMouseDown={(e) => handleResizeStart(e, component, 'w')}
                              />
                              <div
                              className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-e-resize"
                              onMouseDown={(e) => handleResizeStart(e, component, 'e')}
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className={`transition-all duration-300 ease-in-out ${
        selectedComponentData 
          ? 'w-80 opacity-100 translate-x-0' 
          : 'w-0 opacity-0 translate-x-full overflow-hidden'
      }`}>
        {selectedComponentData && (
          <div key={selectedComponentData.id} className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Properties</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedComponentData.name}</p>
                </div>
        <button
                  onClick={() => deleteSelectedComponent()}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete component (Delete key)"
        >
                  <Trash2 className="h-4 w-4" />
        </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Styling */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Styling</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Width</label>
                      <input
                        type="number"
                        value={selectedComponentData.size.width}
                        onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                          size: { ...selectedComponentData.size, width: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Height</label>
                      <input
                        type="number"
                        value={selectedComponentData.size.height}
                        onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                          size: { ...selectedComponentData.size, height: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Background Color</label>
                      <input
                        type="color"
                        value={selectedComponentData.backgroundColor || '#ffffff'}
                        onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                          backgroundColor: e.target.value
                        })}
                        className="w-full h-8 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Component Properties */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Properties</h4>
                  <div className="space-y-2">
                    {selectedComponentData.type === 'text' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-600">Heading</label>
                          <input
                            type="text"
                            value={selectedComponentData.props?.heading || ''}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, heading: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Enter heading text"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Content</label>
                          <textarea
                            value={selectedComponentData.props?.content || ''}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, content: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Enter content text"
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                    
                    {selectedComponentData.type === 'button' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-600">Button Text</label>
                          <input
                            type="text"
                            value={selectedComponentData.props?.text || ''}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, text: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Enter button text"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Button Color</label>
                          <input
                            type="color"
                            value={selectedComponentData.props?.color || '#3b82f6'}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, color: e.target.value }
                            })}
                            className="w-full h-8 border border-gray-300 rounded"
                          />
                        </div>
                      </>
                    )}
                    
                    {selectedComponentData.type === 'input' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-600">Placeholder</label>
                          <input
                            type="text"
                            value={selectedComponentData.props?.placeholder || ''}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, placeholder: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Enter placeholder text"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Input Type</label>
                          <select
                            value={selectedComponentData.props?.type || 'text'}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, type: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="password">Password</option>
                            <option value="number">Number</option>
                          </select>
                        </div>
                      </>
                    )}
                    
                    {selectedComponentData.type === 'image' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-600">Image URL</label>
                          <input
                            type="text"
                            value={selectedComponentData.props?.src || ''}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, src: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Enter image URL"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Alt Text</label>
                          <input
                            type="text"
                            value={selectedComponentData.props?.alt || ''}
                            onChange={(e) => updateComponentLocal(selectedComponentData.id, {
                              props: { ...selectedComponentData.props, alt: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Enter alt text"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Interactions */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Interactions</h4>
                  <div className="space-y-2">
                    {/* Current Interactions */}
                    {selectedComponentData.interactions && Object.keys(selectedComponentData.interactions).length > 0 && (
                      <div className="space-y-1 mb-3">
                        {selectedComponentData.interactions.click && (
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                            <span className="text-blue-700">Click: {selectedComponentData.interactions.click}</span>
        <button
                              onClick={() => removeInteraction(selectedComponentData.id, 'click')}
                              className="text-blue-500 hover:text-blue-700"
        >
                              ×
        </button>
                          </div>
                        )}
                        {selectedComponentData.interactions.hover && (
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded text-xs">
                            <span className="text-green-700">Hover: {selectedComponentData.interactions.hover}</span>
        <button
                              onClick={() => removeInteraction(selectedComponentData.id, 'hover')}
                              className="text-green-500 hover:text-green-700"
        >
                              ×
        </button>
      </div>
                        )}
                        {selectedComponentData.interactions.animation && (
                          <div className="flex items-center justify-between p-2 bg-purple-50 rounded text-xs">
                            <span className="text-purple-700">Animation: {selectedComponentData.interactions.animation}</span>
                            <button 
                              onClick={() => removeInteraction(selectedComponentData.id, 'animation')}
                              className="text-purple-500 hover:text-purple-700"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Add Interaction Buttons */}
              <button
                      onClick={() => addClickEvent(selectedComponentData.id)}
                      className="w-full text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
                    >
                      + Add Click Event
                    </button>
                    <button 
                      onClick={() => addHoverEffect(selectedComponentData.id)}
                      className="w-full text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100"
                    >
                      + Add Hover Effect
                    </button>
                    <button 
                      onClick={() => addAnimation(selectedComponentData.id)}
                      className="w-full text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1 hover:bg-purple-100"
                    >
                      + Add Animation
                    </button>
                  </div>
                </div>

                {/* Data Binding */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Data Binding</h4>
                  <div className="space-y-2">
                    {/* Current Data Bindings */}
                    {selectedComponentData.dataBinding && Object.keys(selectedComponentData.dataBinding).length > 0 && (
                      <div className="space-y-1 mb-3">
                        {selectedComponentData.dataBinding.variable && (
                          <div className="flex items-center justify-between p-2 bg-orange-50 rounded text-xs">
                            <span className="text-orange-700">Variable: {selectedComponentData.dataBinding.variable}</span>
                            <button 
                              onClick={() => removeDataBinding(selectedComponentData.id, 'variable')}
                              className="text-orange-500 hover:text-orange-700"
                            >
                              ×
                            </button>
                        </div>
                        )}
                        {selectedComponentData.dataBinding.api && (
                          <div className="flex items-center justify-between p-2 bg-indigo-50 rounded text-xs">
                            <span className="text-indigo-700">API: {selectedComponentData.dataBinding.api}</span>
                            <button 
                              onClick={() => removeDataBinding(selectedComponentData.id, 'api')}
                              className="text-indigo-500 hover:text-indigo-700"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Add Data Binding Buttons */}
                    <button 
                      onClick={() => bindToVariable(selectedComponentData.id)}
                      className="w-full text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-1 hover:bg-orange-100"
                    >
                      + Bind to Variable
                    </button>
                    <button 
                      onClick={() => connectToAPI(selectedComponentData.id)}
                      className="w-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-100"
                    >
                      + Connect to API
                    </button>
                  </div>
                </div>

                {/* Layer Management */}
                        <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Layer</h4>
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                    <button
                        onClick={() => bringToFront(selectedComponentData.id)}
                        className="flex-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                        title="Bring to Front"
                      >
                        Front
                    </button>
                    <button
                        onClick={() => bringForward(selectedComponentData.id)}
                        className="flex-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                        title="Bring Forward"
                      >
                        ↑
                    </button>
                    <button
                        onClick={() => sendBackward(selectedComponentData.id)}
                        className="flex-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                        title="Send Backward"
                      >
                        ↓
                    </button>
                    <button
                        onClick={() => sendToBack(selectedComponentData.id)}
                        className="flex-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                        title="Send to Back"
                      >
                        Back
                    </button>
                  </div>
                </div>
                        </div>
                      </div>
                        </div>
                        </div>
                    )}
                        </div>

      {/* Figma-like Toolbar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2 z-50">
        <div className="flex items-center space-x-2">
          {/* Select Tool */}
          <button
            onClick={() => handleToolSelect('select')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === 'select' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="Select (V)"
          >
            <MousePointer className="w-5 h-5" />
          </button>

          {/* Rectangle Tool */}
          <button
            onClick={() => handleToolSelect('rectangle')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === 'rectangle' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="Rectangle (R)"
          >
            <Square className="w-5 h-5" />
          </button>

          {/* Circle Tool */}
          <button
            onClick={() => handleToolSelect('circle')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === 'circle' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="Circle (O)"
          >
            <Circle className="w-5 h-5" />
          </button>

          {/* Triangle Tool */}
          <button
            onClick={() => handleToolSelect('triangle')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === 'triangle' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="Triangle"
          >
            <Triangle className="w-5 h-5" />
          </button>

          {/* Line Tool */}
          <button
            onClick={() => handleToolSelect('line')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === 'line' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="Line (L)"
          >
            <Minus className="w-5 h-5" />
          </button>

          {/* Text Tool */}
          <button
            onClick={() => handleToolSelect('text')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === 'text' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="Text (T)"
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Image Tool */}
          <button
            onClick={() => handleToolSelect('image')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === 'image' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="Image"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Pen Tool */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          <button
            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200"
            title="Pen Tool (P)"
          >
            <PenTool className="w-5 h-5" />
          </button>
                        </div>
      </div>

      {/* Interactive Mode Shortcut Buttons */}
      <div className="fixed bottom-4 right-4 flex space-x-2">
        <button
          onClick={() => navigateToMode('design')}
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
