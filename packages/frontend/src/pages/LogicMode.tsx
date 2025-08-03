import React, { useState, useRef, useEffect } from 'react'
import { useNavigation } from '@/contexts/NavigationContext'
import { useDesign } from '@/contexts/DesignContext'
import { 
  Database, 
  GitBranch, 
  Palette,
  Navigation,
  Smartphone,
  Globe,
  Circle,
  Square,
  Layout,
  Code,
  X
} from 'lucide-react'

interface LogicNode {
  id: string
  type: 'component' | 'trigger' | 'condition' | 'action' | 'data' | 'navigation' | 'style' | 'api'
  name: string
  position: { x: number; y: number }
  data: any
  connections: string[]
  componentId?: string
  isDragging?: boolean
}

interface Connection {
  id: string
  from: string
  to: string
  type: 'data' | 'control' | 'style'
}

export function LogicMode() {
  const { navigateToMode } = useNavigation()
  const { 
    screens, 
    activeScreen,
    logicNodes, 
    connections, 
    addLogicNode, 
    updateLogicNode, 
    deleteLogicNode, 
    addConnection, 
    deleteConnection 
  } = useDesign()
  
  // Get components that are actually used in the design mode (from active screen)
  const getUsedComponents = () => {
    if (!activeScreen) return []
    const screen = screens.find(s => s.id === activeScreen)
    if (!screen) return []
    
    // Get all components from all layers in the active screen
    return screen.layers.flatMap(layer => layer.components)
  }
  
  const usedComponents = getUsedComponents()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<LogicNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true)

  // Logic node types with better visual representation
  const nodeTypes = {
    trigger: {
      icon: Circle,
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      label: 'Trigger',
      description: 'User interactions and events'
    },
    condition: {
      icon: Palette,
      color: 'bg-yellow-500',
      borderColor: 'border-yellow-500',
      label: 'Condition',
      description: 'Logic conditions and rules'
    },
    action: {
      icon: Square,
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      label: 'Action',
      description: 'Actions to perform'
    },
    data: {
      icon: Database,
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      label: 'Data',
      description: 'Data operations and variables'
    },
    navigation: {
      icon: Navigation,
      color: 'bg-indigo-500',
      borderColor: 'border-indigo-500',
      label: 'Navigation',
      description: 'Page navigation and routing'
    },
    style: {
      icon: Palette,
      color: 'bg-pink-500',
      borderColor: 'border-pink-500',
      label: 'Style',
      description: 'Component styling and appearance'
    },
    api: {
      icon: Globe,
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      label: 'API',
      description: 'API calls and external data'
    }
  }

  const addNode = (type: keyof typeof nodeTypes | 'component', position: { x: number; y: number }, data?: any, componentId?: string) => {
    const newNode: LogicNode = {
      id: Date.now().toString(),
      type,
      name: type === 'component' ? data?.name || 'Component' : `${nodeTypes[type as keyof typeof nodeTypes]?.label || type} ${logicNodes.filter(n => n.type === type).length + 1}`,
      position,
      data: data || {},
      connections: [],
      componentId
    }
    addLogicNode(newNode)
    return newNode
  }

  const createConnection = (from: string, to: string, type: 'data' | 'control' | 'style' = 'control') => {
    // Check if connection already exists
    const existingConnection = connections.find(conn => conn.from === from && conn.to === to)
    if (existingConnection) return

    const newConnection: Connection = {
      id: Date.now().toString(),
      from,
      to,
      type
    }
    addConnection(newConnection)
    
    // Update node connections
    const fromNode = logicNodes.find(n => n.id === from)
    if (fromNode) {
      updateLogicNode(from, { connections: [...fromNode.connections, newConnection.id] })
    }
  }

  const startConnection = (nodeId: string) => {
    setIsConnecting(true)
    setConnectionStart(nodeId)
  }

  const finishConnection = (nodeId: string) => {
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      createConnection(connectionStart, nodeId, 'control')
    }
    setIsConnecting(false)
    setConnectionStart(null)
  }

  const cancelConnection = () => {
    setIsConnecting(false)
    setConnectionStart(null)
  }

  const updateNode = (nodeId: string, updates: Partial<LogicNode>) => {
    updateLogicNode(nodeId, updates)
  }

  const deleteNode = (nodeId: string) => {
    deleteLogicNode(nodeId)
    // Delete all connections involving this node
    connections.forEach(conn => {
      if (conn.from === nodeId || conn.to === nodeId) {
        deleteConnection(conn.id)
      }
    })
  }

  const handleNodeDrag = (nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position })
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null)
      setSidebarVisible(false)
      cancelConnection()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    if (isDragging && selectedNode) {
      const mouseX = (e.clientX - rect!.left - pan.x) / zoom
      const mouseY = (e.clientY - rect!.top - pan.y) / zoom
      const newX = mouseX - dragStart.x
      const newY = mouseY - dragStart.y
      handleNodeDrag(selectedNode.id, { x: newX, y: newY })
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedNode) {
      deleteNode(selectedNode.id)
      setSelectedNode(null)
      setSidebarVisible(false)
    }
    if (e.key === 'Escape') {
      setSelectedNode(null)
      setSidebarVisible(false)
      cancelConnection()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Zoom and pan handlers
  useEffect(() => {
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
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
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

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel)
        element.removeEventListener('mousedown', handleMouseDown)
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isPanning, pan.x, pan.y, panStart.x, panStart.y])

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setZoom(prev => Math.max(prev * 0.8, 0.1))
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const renderNode = (node: LogicNode) => {
    if (node.type === 'component') {
      return (
        <div
          key={node.id}
          className={`absolute bg-white border border-gray-200 rounded-lg shadow-sm cursor-move min-w-[200px] z-20 ${
            selectedNode?.id === node.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
          }`}
          style={{
            left: node.position.x,
            top: node.position.y,
          }}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedNode(node)
            setSidebarVisible(true)
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsDragging(true)
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect) {
              const mouseX = (e.clientX - rect.left - pan.x) / zoom
              const mouseY = (e.clientY - rect.top - pan.y) / zoom
              const offsetX = mouseX - node.position.x
              const offsetY = mouseY - node.position.y
              setDragStart({ x: offsetX, y: offsetY })
            }
            setSelectedNode(node)
          }}
        >
          {/* Node Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 text-xs">
                  {node.data?.type === 'button' ? '🔘' : 
                   node.data?.type === 'input' ? '📝' : 
                   node.data?.type === 'image' ? '🖼️' : '📄'}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{node.name}</div>
                <div className="text-xs text-gray-500">{node.data?.type || 'Component'}</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteNode(node.id)
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3">
            <div className="text-xs text-gray-600">Component from Design Mode</div>
          </div>
          
          {/* Connection Points */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-30">
            <button
              className={`w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-200 hover:scale-125 ${
                isConnecting && connectionStart === node.id 
                  ? 'bg-red-500 hover:bg-red-600 ring-2 ring-red-200 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                if (isConnecting && connectionStart && connectionStart !== node.id) {
                  finishConnection(node.id)
                } else if (!isConnecting) {
                  startConnection(node.id)
                } else if (connectionStart === node.id) {
                  cancelConnection()
                }
              }}
              title={isConnecting && connectionStart === node.id ? 'Cancel connection' : 'Start connection'}
            />
          </div>
          
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-30">
            <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        </div>
      )
    }

    const nodeType = nodeTypes[node.type as keyof typeof nodeTypes]
    if (!nodeType) return null
    
    const Icon = nodeType.icon

    return (
      <div
        key={node.id}
        className={`absolute bg-white border border-gray-200 rounded-lg shadow-sm cursor-move min-w-[200px] z-20 ${
          selectedNode?.id === node.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedNode(node)
          setSidebarVisible(true)
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          setIsDragging(true)
          const rect = canvasRef.current?.getBoundingClientRect()
          if (rect) {
            const mouseX = (e.clientX - rect.left - pan.x) / zoom
            const mouseY = (e.clientY - rect.top - pan.y) / zoom
            const offsetX = mouseX - node.position.x
            const offsetY = mouseY - node.position.y
            setDragStart({ x: offsetX, y: offsetY })
          }
          setSelectedNode(node)
          setSidebarVisible(true)
        }}
      >
        {/* Node Header */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-100 rounded-t-lg ${nodeType.color.replace('bg-', 'bg-').replace('500', '50')}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 ${nodeType.color} rounded flex items-center justify-center`}>
              <Icon className="w-3 h-3 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{node.name}</div>
              <div className="text-xs text-gray-500">{nodeType.label}</div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteNode(node.id)
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Node Content */}
        <div className="p-3">
          {node.type === 'navigation' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Page</label>
              <select 
                className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                value={node.data?.target || ''}
                onChange={(e) => updateNode(node.id, { data: { ...node.data, target: e.target.value } })}
              >
                <option value="">Select page...</option>
                {screens.map(screen => (
                  <option key={screen.id} value={screen.id}>{screen.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {node.type === 'api' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">API URL</label>
                <input 
                  type="text"
                  placeholder="https://api.example.com/endpoint"
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  value={node.data?.url || ''}
                  onChange={(e) => updateNode(node.id, { data: { ...node.data, url: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
                <select 
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  value={node.data?.method || 'GET'}
                  onChange={(e) => updateNode(node.id, { data: { ...node.data, method: e.target.value } })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
          )}
          
          {node.type === 'style' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                <input 
                  type="text"
                  placeholder="#ffffff"
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  value={node.data?.backgroundColor || ''}
                  onChange={(e) => updateNode(node.id, { data: { ...node.data, backgroundColor: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                <input 
                  type="text"
                  placeholder="#000000"
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                  value={node.data?.color || ''}
                  onChange={(e) => updateNode(node.id, { data: { ...node.data, color: e.target.value } })}
                />
              </div>
            </div>
          )}
          
          {!['navigation', 'api', 'style'].includes(node.type) && (
            <div className="text-xs text-gray-600">{nodeType.description}</div>
          )}
        </div>

        {/* Connection Points */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 z-30">
          <button
            className={`w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-200 hover:scale-125 ${
              isConnecting && connectionStart === node.id 
                ? 'bg-red-500 hover:bg-red-600 ring-2 ring-red-200 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (isConnecting && connectionStart && connectionStart !== node.id) {
                finishConnection(node.id)
              } else if (!isConnecting) {
                startConnection(node.id)
              } else if (connectionStart === node.id) {
                cancelConnection()
              }
            }}
            title={isConnecting && connectionStart === node.id ? 'Cancel connection' : 'Start connection'}
          />
        </div>
        
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-30">
          <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50 font-['Inter'] font-semibold">
      {/* Left Panel - Hidden by default */}
      {leftSidebarVisible && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Logic Tools</h2>
            <button
              onClick={() => setLeftSidebarVisible(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Design Components */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Design Components</h3>
              <p className="text-xs text-gray-500 mb-3">Drag components to canvas</p>
              {usedComponents.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No components in current screen</p>
                  <p className="text-xs">Add components to the active screen in Design Mode</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usedComponents.map(component => (
                    <div 
                      key={component.id} 
                      className="bg-gray-50 rounded-lg p-3 cursor-move hover:bg-gray-100 transition-colors"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'component',
                          component
                        }))
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600 text-xs">
                              {component.type === 'button' ? '🔘' : 
                               component.type === 'input' ? '📝' : 
                               component.type === 'image' ? '🖼️' : '📄'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{component.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{component.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logic Nodes */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Logic Nodes</h3>
              <p className="text-xs text-gray-500 mb-3">Drag nodes to canvas</p>
              <div className="space-y-2">
                {Object.entries(nodeTypes).map(([type, config]) => (
                  <div 
                    key={type}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-move"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'logic',
                        nodeType: type,
                        config
                      }))
                    }}
                  >
                    <div className={`w-6 h-6 ${config.color} rounded-full flex items-center justify-center`}>
                      <config.icon className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">{config.label}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API Templates */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">API Templates</h3>
              <p className="text-xs text-gray-500 mb-3">Drag APIs to canvas</p>
              <div className="space-y-2">
                {[
                  { name: 'GET Users', endpoint: '/api/users', method: 'GET' },
                  { name: 'POST User', endpoint: '/api/users', method: 'POST' },
                  { name: 'PUT User', endpoint: '/api/users/:id', method: 'PUT' },
                  { name: 'DELETE User', endpoint: '/api/users/:id', method: 'DELETE' },
                  { name: 'GET Products', endpoint: '/api/products', method: 'GET' },
                  { name: 'POST Product', endpoint: '/api/products', method: 'POST' },
                  { name: 'GET Orders', endpoint: '/api/orders', method: 'GET' },
                  { name: 'POST Order', endpoint: '/api/orders', method: 'POST' }
                ].map((api, index) => (
                  <div 
                    key={index}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-move"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'api',
                        api
                      }))
                    }}
                  >
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">{api.name}</div>
                      <div className="text-xs text-gray-500">{api.method} {api.endpoint}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas - Full Screen */}
      <div className={`flex-1 relative overflow-hidden ${leftSidebarVisible ? '' : 'w-full'}`} ref={containerRef}>
        {/* Top Toolbar */}
        <div className="absolute top-4 left-4 z-50 flex items-center space-x-2">
          {/* Toggle Right Sidebar Button */}
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="w-8 h-8 bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center hover:bg-gray-50"
            title={sidebarVisible ? "Hide Properties" : "Show Properties"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
        </div>

        {/* Right Sidebar Toggle Button - Pill Style (when sidebar is closed) */}
        {!leftSidebarVisible && (
          <div className="absolute top-4 left-4 z-50">
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
              <span className="text-sm font-medium">Logic Tools</span>
            </button>
          </div>
        )}

        {/* Zoom Controls and Level Indicator - Top Right */}
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
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
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div className="absolute top-16 left-4 bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 text-blue-800 text-sm z-50">
            Connecting nodes... Click another node or press Esc to cancel
          </div>
        )}

        <div
          ref={canvasRef}
          className={`w-full h-full relative ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: '0 0'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return

            const data = JSON.parse(e.dataTransfer.getData('application/json'))
            const position = {
              x: (e.clientX - rect.left - pan.x) / zoom - 100,
              y: (e.clientY - rect.top - pan.y) / zoom - 40
            }

            if (data.type === 'component') {
              addNode('component', position, data.component, data.component.id)
            } else if (data.type === 'logic') {
              addNode(data.nodeType as keyof typeof nodeTypes, position, {}, undefined)
            } else if (data.type === 'api') {
              addNode('api', position, data.api, undefined)
            }
          }}
        >
          {/* Clean Canvas Background */}
          <div className="absolute inset-0 bg-gray-50" />
          
          {/* Background element for pan events */}
          <div 
            className="absolute inset-0"
            style={{ 
              width: '100%', 
              height: '100%'
            }}
            onClick={(e) => {
              // Only handle clicks on the background itself, not on nodes
              if (e.target === e.currentTarget) {
                setSelectedNode(null)
                setSidebarVisible(false)
                cancelConnection()
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 1 || (e.button === 0 && e.altKey)) {
                e.preventDefault()
                setIsPanning(true)
                setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
                document.body.style.cursor = 'grabbing'
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                e.preventDefault()
                setPan({
                  x: e.clientX - panStart.x,
                  y: e.clientY - panStart.y
                })
              }
            }}
            onMouseUp={() => {
              if (isPanning) {
                setIsPanning(false)
                document.body.style.cursor = 'default'
              }
            }}
            onMouseEnter={() => {
              if (isPanning) {
                document.body.style.cursor = 'grabbing'
              }
            }}
            onMouseLeave={() => {
              if (isPanning) {
                setIsPanning(false)
                document.body.style.cursor = 'default'
              }
            }}
          />

          {/* Nodes */}
          {logicNodes.map(renderNode)}
        </div>

        {/* Connections - Rendered outside transformed container */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {connections.map(connection => {
            const fromNode = logicNodes.find(n => n.id === connection.from)
            const toNode = logicNodes.find(n => n.id === connection.to)
            
            if (!fromNode || !toNode) return null

            // Calculate connection points in canvas coordinates
            let fromX, fromY, toX, toY

            if (fromNode.type === 'component') {
              fromX = fromNode.position.x + 100
              fromY = fromNode.position.y + 80 + 2
            } else {
              fromX = fromNode.position.x + 200 + 2
              fromY = fromNode.position.y + 40
            }

            if (toNode.type === 'component') {
              toX = toNode.position.x + 100
              toY = toNode.position.y - 2
            } else {
              toX = toNode.position.x - 2
              toY = toNode.position.y + 40
            }

            // Apply zoom and pan transformations
            const transformedFromX = fromX * zoom + pan.x
            const transformedFromY = fromY * zoom + pan.y
            const transformedToX = toX * zoom + pan.x
            const transformedToY = toY * zoom + pan.y

            // Calculate control points for smooth curve
            const distance = Math.abs(transformedToX - transformedFromX)
            const controlPoint1 = { x: transformedFromX + distance * 0.5, y: transformedFromY }
            const controlPoint2 = { x: transformedToX - distance * 0.5, y: transformedToY }

            return (
              <svg
                key={connection.id}
                className="absolute pointer-events-none"
                style={{ 
                  left: 0, 
                  top: 0, 
                  width: '100%', 
                  height: '100%'
                }}
              >
                {/* Connection line */}
                <path
                  d={`M ${transformedFromX} ${transformedFromY} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${transformedToX} ${transformedToY}`}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Arrow */}
                <path
                  d={`M ${transformedToX - 6} ${transformedToY - 3} L ${transformedToX} ${transformedToY} L ${transformedToX - 6} ${transformedToY + 3}`}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            )
          })}
        </div>

        {/* Temporary Connection Line - Also outside transformed container */}
        {isConnecting && connectionStart && (() => {
          const fromNode = logicNodes.find(n => n.id === connectionStart)
          if (!fromNode) return null

          let fromX, fromY
          if (fromNode.type === 'component') {
            fromX = fromNode.position.x + 100
            fromY = fromNode.position.y + 80 + 2
          } else {
            fromX = fromNode.position.x + 200 + 2
            fromY = fromNode.position.y + 40
          }

          const transformedFromX = fromX * zoom + pan.x
          const transformedFromY = fromY * zoom + pan.y

          const distance = Math.abs(mousePos.x - transformedFromX)
          const controlPoint1 = { x: transformedFromX + distance * 0.5, y: transformedFromY }

          return (
            <div className="absolute inset-0 pointer-events-none z-10">
              <svg
                className="absolute pointer-events-none"
                style={{ 
                  left: 0, 
                  top: 0, 
                  width: '100%', 
                  height: '100%'
                }}
              >
                <path
                  d={`M ${transformedFromX} ${transformedFromY} Q ${controlPoint1.x} ${controlPoint1.y} ${mousePos.x} ${mousePos.y}`}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  fill="none"
                />
              </svg>
            </div>
          )
        })()}
      </div>

      {/* Right Sidebar - Overlay */}
      {sidebarVisible && selectedNode && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-40 shadow-lg">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Node Properties</h3>
                <button
                  onClick={() => {
                    setSelectedNode(null)
                    setSidebarVisible(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedNode.name || ''}
                    onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <div className="text-sm text-gray-900">
                    {selectedNode.type === 'component' ? 'Component' : nodeTypes[selectedNode.type as keyof typeof nodeTypes]?.label || selectedNode.type}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Connections</label>
                  <div className="text-sm text-gray-900">
                    {selectedNode.connections.length} outgoing connections
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    deleteNode(selectedNode.id)
                    setSelectedNode(null)
                    setSidebarVisible(false)
                  }}
                  className="w-full text-sm bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Delete Node
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Navigation Buttons - Pill Style */}
      <div className="fixed bottom-4 right-4 flex space-x-2 z-50">
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