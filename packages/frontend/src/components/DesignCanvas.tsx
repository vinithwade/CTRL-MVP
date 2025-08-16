/**
 * Enhanced Design Canvas - Figma-like drag and drop interface
 * Features: multi-selection, guides, snapping, layers, responsive design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useHotkeys } from 'react-hotkeys-hook'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Square, 
  Type, 
  Image, 
  Video,
  Grid,
  Layers,
  Eye,
  Lock,
  Copy,
  Trash2,
  Move,
  MousePointer
} from 'lucide-react'
import { useEnhancedDesign } from '../contexts/EnhancedDesignContext'
import { UIComponent, ComponentType, Position } from 'shared'

interface DragItem {
  type: string
  componentType?: ComponentType
  id?: string
  component?: UIComponent
}

interface CanvasProps {
  width?: number
  height?: number
  showGrid?: boolean
  showRulers?: boolean
  snapToGrid?: boolean
  gridSize?: number
}

export function DesignCanvas({ 
  width = 1920, 
  height = 1080, 
  showGrid = true, 
  showRulers = true,
  snapToGrid = true,
  gridSize = 10
}: CanvasProps) {
  const {
    project,
    activeScreen,
    selectedComponent,
    zoom,
    pan,
    setZoom,
    setPan,
    createComponent,
    updateComponent,
    deleteComponent,
    selectComponent,
    duplicateComponent,
    broadcastCursor
  } = useEnhancedDesign()

  // Canvas state
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [selectionBox, setSelectionBox] = useState<{ start: Position; end: Position } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState<UIComponent | null>(null)
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })
  const [tool, setTool] = useState<'select' | 'pan' | 'text' | 'rectangle' | 'image'>('select')

  // Get components for active screen
  const screenComponents = project?.components.filter(c => c.screenId === activeScreen) || []

  // Keyboard shortcuts
  useHotkeys('ctrl+z, cmd+z', () => {
    // Undo handled by context
  })
  
  useHotkeys('ctrl+y, cmd+y', () => {
    // Redo handled by context
  })
  
  useHotkeys('delete, backspace', () => {
    selectedComponents.forEach(id => deleteComponent(id))
    setSelectedComponents([])
  })
  
  useHotkeys('ctrl+d, cmd+d', (e) => {
    e.preventDefault()
    if (selectedComponent) {
      duplicateComponent(selectedComponent.id)
    }
  })

  useHotkeys('ctrl+a, cmd+a', (e) => {
    e.preventDefault()
    setSelectedComponents(screenComponents.map(c => c.id))
  })

  // Canvas drag and drop
  const [{ isOver }, drop] = useDrop({
    accept: ['component', 'palette-item'],
    drop: (item: DragItem, monitor) => {
      if (!monitor.didDrop()) {
        const offset = monitor.getClientOffset()
        if (offset && canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect()
          const position: Position = {
            x: Math.round((offset.x - canvasRect.left - pan.x) / zoom),
            y: Math.round((offset.y - canvasRect.top - pan.y) / zoom),
            unit: 'px'
          }

          if (snapToGrid) {
            position.x = Math.round(position.x / gridSize) * gridSize
            position.y = Math.round(position.y / gridSize) * gridSize
          }

          if (item.type === 'palette-item' && item.componentType) {
            createComponent(item.componentType, position, activeScreen || undefined)
          } else if (item.type === 'component' && item.component) {
            updateComponent(item.component.id, { position })
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && tool === 'pan')) {
      // Middle mouse or pan tool
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      e.preventDefault()
    } else if (e.button === 0 && tool === 'select') {
      // Left mouse with select tool
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const startPos: Position = {
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
          unit: 'px'
        }
        setSelectionBox({ start: startPos, end: startPos })
        setIsSelecting(true)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Broadcast cursor position for collaboration
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const position: Position = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
        unit: 'px'
      }
      broadcastCursor(position)
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
        unit: 'px'
      })
    } else if (isSelecting && selectionBox) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const endPos: Position = {
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
          unit: 'px'
        }
        setSelectionBox({ ...selectionBox, end: endPos })
      }
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
    }
    
    if (isSelecting && selectionBox) {
      // Select components within selection box
      const { start, end } = selectionBox
      const minX = Math.min(start.x, end.x)
      const maxX = Math.max(start.x, end.x)
      const minY = Math.min(start.y, end.y)
      const maxY = Math.max(start.y, end.y)

      const selected = screenComponents.filter(component => {
        const { position, size } = component
        return (
          position.x >= minX &&
          position.x + size.width <= maxX &&
          position.y >= minY &&
          position.y + size.height <= maxY
        )
      }).map(c => c.id)

      setSelectedComponents(selected)
      setSelectionBox(null)
      setIsSelecting(false)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5)
      setZoom(newZoom)
    } else {
      setPan({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
        unit: 'px'
      })
    }
  }

  const handleComponentClick = (component: UIComponent, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      if (selectedComponents.includes(component.id)) {
        setSelectedComponents(prev => prev.filter(id => id !== component.id))
      } else {
        setSelectedComponents(prev => [...prev, component.id])
      }
    } else {
      selectComponent(component.id)
      setSelectedComponents([component.id])
    }
  }

  const generateSmartGuides = (movingComponent: UIComponent) => {
    const guides = { x: [] as number[], y: [] as number[] }
    
    screenComponents.forEach(component => {
      if (component.id === movingComponent.id) return
      
      // Vertical guides (alignment)
      guides.x.push(component.position.x) // Left edge
      guides.x.push(component.position.x + component.size.width) // Right edge
      guides.x.push(component.position.x + component.size.width / 2) // Center
      
      // Horizontal guides
      guides.y.push(component.position.y) // Top edge
      guides.y.push(component.position.y + component.size.height) // Bottom edge
      guides.y.push(component.position.y + component.size.height / 2) // Center
    })
    
    setGuides(guides)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full bg-gray-100">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Tools */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                className={`p-2 rounded ${tool === 'select' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setTool('select')}
                title="Select (V)"
              >
                <MousePointer className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${tool === 'pan' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setTool('pan')}
                title="Pan (H)"
              >
                <Move className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${tool === 'text' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setTool('text')}
                title="Text (T)"
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${tool === 'rectangle' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setTool('rectangle')}
                title="Rectangle (R)"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Component Library */}
            <ComponentPalette />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(zoom * 0.8, 0.1))}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(zoom * 1.2, 5))}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0, unit: 'px' })
              }}
              className="p-2 rounded hover:bg-gray-100"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Rulers */}
          {showRulers && (
            <>
              <div className="absolute top-0 left-0 w-full h-8 bg-gray-50 border-b border-gray-200 z-10">
                <HorizontalRuler zoom={zoom} pan={pan.x} width={width} />
              </div>
              <div className="absolute top-0 left-0 w-8 h-full bg-gray-50 border-r border-gray-200 z-10">
                <VerticalRuler zoom={zoom} pan={pan.y} height={height} />
              </div>
            </>
          )}

          {/* Canvas */}
          <div
            ref={(node) => {
              canvasRef.current = node
              drop(node)
            }}
            className={`relative w-full h-full ${
              isPanning ? 'cursor-grabbing' : tool === 'pan' ? 'cursor-grab' : 'cursor-default'
            } ${isOver ? 'bg-blue-50' : ''}`}
            style={{
              marginLeft: showRulers ? 32 : 0,
              marginTop: showRulers ? 32 : 0
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Viewport */}
            <div
              className="relative bg-white shadow-lg"
              style={{
                width: width * zoom,
                height: height * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: '0 0'
              }}
            >
              {/* Grid */}
              {showGrid && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #ccc 1px, transparent 1px),
                      linear-gradient(to bottom, #ccc 1px, transparent 1px)
                    `,
                    backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`
                  }}
                />
              )}

              {/* Smart Guides */}
              {guides.x.map((x, i) => (
                <div
                  key={`guide-x-${i}`}
                  className="absolute bg-blue-500 opacity-60"
                  style={{
                    left: x * zoom,
                    top: 0,
                    width: 1,
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                />
              ))}
              {guides.y.map((y, i) => (
                <div
                  key={`guide-y-${i}`}
                  className="absolute bg-blue-500 opacity-60"
                  style={{
                    left: 0,
                    top: y * zoom,
                    width: '100%',
                    height: 1,
                    pointerEvents: 'none'
                  }}
                />
              ))}

              {/* Components */}
              {screenComponents.map(component => (
                <ComponentRenderer
                  key={component.id}
                  component={component}
                  isSelected={selectedComponents.includes(component.id)}
                  zoom={zoom}
                  onSelect={(e) => handleComponentClick(component, e)}
                  onDragStart={() => {
                    setDraggedComponent(component)
                    generateSmartGuides(component)
                  }}
                  onDragEnd={() => {
                    setDraggedComponent(null)
                    setGuides({ x: [], y: [] })
                  }}
                  snapToGrid={snapToGrid}
                  gridSize={gridSize}
                />
              ))}

              {/* Selection Box */}
              {selectionBox && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
                  style={{
                    left: Math.min(selectionBox.start.x, selectionBox.end.x) * zoom,
                    top: Math.min(selectionBox.start.y, selectionBox.end.y) * zoom,
                    width: Math.abs(selectionBox.end.x - selectionBox.start.x) * zoom,
                    height: Math.abs(selectionBox.end.y - selectionBox.start.y) * zoom
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

// Component Palette for drag and drop
function ComponentPalette() {
  const components = [
    { type: 'container' as ComponentType, icon: Square, label: 'Container' },
    { type: 'text' as ComponentType, icon: Type, label: 'Text' },
    { type: 'button' as ComponentType, icon: Square, label: 'Button' },
    { type: 'input' as ComponentType, icon: Square, label: 'Input' },
    { type: 'image' as ComponentType, icon: Image, label: 'Image' },
    { type: 'video' as ComponentType, icon: Video, label: 'Video' }
  ]

  return (
    <div className="flex items-center space-x-1">
      {components.map(({ type, icon: Icon, label }) => (
        <PaletteItem key={type} componentType={type} icon={Icon} label={label} />
      ))}
    </div>
  )
}

// Draggable palette item
function PaletteItem({ 
  componentType, 
  icon: Icon, 
  label 
}: { 
  componentType: ComponentType
  icon: React.ComponentType<{ className?: string }>
  label: string 
}) {
  const [{ isDragging }, drag] = useDrag({
    type: 'palette-item',
    item: { type: 'palette-item', componentType },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  return (
    <button
      ref={drag}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

// Component renderer with drag and selection
function ComponentRenderer({ 
  component, 
  isSelected, 
  zoom, 
  onSelect, 
  onDragStart, 
  onDragEnd,
  snapToGrid,
  gridSize 
}: {
  component: UIComponent
  isSelected: boolean
  zoom: number
  onSelect: (e: React.MouseEvent) => void
  onDragStart: () => void
  onDragEnd: () => void
  snapToGrid: boolean
  gridSize: number
}) {
  const { updateComponent } = useEnhancedDesign()
  
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type: 'component', id: component.id, component },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      onDragEnd()
      if (monitor.didDrop()) {
        const offset = monitor.getDropResult()
        // Handle drop result if needed
      }
    }
  })

  useEffect(() => {
    if (isDragging) {
      onDragStart()
    }
  }, [isDragging, onDragStart])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(e)
  }

  return (
    <div
      ref={drag}
      className={`absolute cursor-move ${isDragging ? 'opacity-50' : ''} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        left: component.position.x * zoom,
        top: component.position.y * zoom,
        width: component.size.width * zoom,
        height: component.size.height * zoom,
        transform: `rotate(${component.transform?.rotation || 0}deg) scale(${
          component.transform?.scaleX || 1
        }, ${component.transform?.scaleY || 1})`,
        zIndex: component.zIndex
      }}
      onMouseDown={handleMouseDown}
    >
      <ComponentContent component={component} zoom={zoom} />
      
      {/* Selection handles */}
      {isSelected && (
        <SelectionHandles
          component={component}
          zoom={zoom}
          onUpdate={(updates) => updateComponent(component.id, updates)}
        />
      )}
    </div>
  )
}

// Render component content based on type
function ComponentContent({ component, zoom }: { component: UIComponent; zoom: number }) {
  const style = {
    width: '100%',
    height: '100%',
    backgroundColor: component.styling.backgroundColor,
    borderRadius: component.styling.borderRadius,
    border: component.styling.border,
    padding: component.styling.padding ? 
      `${component.styling.padding.top}px ${component.styling.padding.right}px ${component.styling.padding.bottom}px ${component.styling.padding.left}px` : 
      '0',
    opacity: component.styling.opacity,
    overflow: component.styling.overflow || 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.max(12, 14 * zoom),
    color: component.styling.typography?.color || '#000'
  }

  switch (component.type) {
    case 'text':
      return (
        <div style={style}>
          {component.props.content || 'Text'}
        </div>
      )
    
    case 'button':
      return (
        <button style={style} disabled>
          {component.props.text || 'Button'}
        </button>
      )
    
    case 'input':
      return (
        <input
          style={style}
          placeholder={component.props.placeholder || 'Input'}
          type={component.props.type || 'text'}
          disabled
        />
      )
    
    case 'image':
      return (
        <div style={style}>
          {component.props.src ? (
            <img 
              src={component.props.src} 
              alt={component.props.alt || 'Image'} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
              <Image className="w-8 h-8" />
            </div>
          )}
        </div>
      )
    
    case 'container':
      return <div style={style} />
    
    default:
      return (
        <div style={style}>
          {component.type}
        </div>
      )
  }
}

// Selection handles for resizing
function SelectionHandles({ 
  component, 
  zoom, 
  onUpdate 
}: { 
  component: UIComponent
  zoom: number
  onUpdate: (updates: Partial<UIComponent>) => void 
}) {
  const handleSize = 8

  const handles = [
    { position: 'nw', cursor: 'nw-resize', x: -handleSize/2, y: -handleSize/2 },
    { position: 'n', cursor: 'n-resize', x: component.size.width * zoom / 2 - handleSize/2, y: -handleSize/2 },
    { position: 'ne', cursor: 'ne-resize', x: component.size.width * zoom - handleSize/2, y: -handleSize/2 },
    { position: 'e', cursor: 'e-resize', x: component.size.width * zoom - handleSize/2, y: component.size.height * zoom / 2 - handleSize/2 },
    { position: 'se', cursor: 'se-resize', x: component.size.width * zoom - handleSize/2, y: component.size.height * zoom - handleSize/2 },
    { position: 's', cursor: 's-resize', x: component.size.width * zoom / 2 - handleSize/2, y: component.size.height * zoom - handleSize/2 },
    { position: 'sw', cursor: 'sw-resize', x: -handleSize/2, y: component.size.height * zoom - handleSize/2 },
    { position: 'w', cursor: 'w-resize', x: -handleSize/2, y: component.size.height * zoom / 2 - handleSize/2 }
  ]

  return (
    <>
      {handles.map(handle => (
        <div
          key={handle.position}
          className="absolute bg-blue-500 border border-white shadow-sm"
          style={{
            left: handle.x,
            top: handle.y,
            width: handleSize,
            height: handleSize,
            cursor: handle.cursor
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            // Handle resize logic here
          }}
        />
      ))}
    </>
  )
}

// Ruler components
function HorizontalRuler({ zoom, pan, width }: { zoom: number; pan: number; width: number }) {
  const marks = []
  const step = 50 // pixels between major marks
  const start = Math.floor(-pan / (step * zoom)) * step
  const end = start + width + step * 10

  for (let i = start; i <= end; i += step) {
    const position = i * zoom + pan
    if (position >= 0 && position <= width * zoom) {
      marks.push(
        <div key={i} className="absolute" style={{ left: position }}>
          <div className="w-px h-4 bg-gray-400" />
          <div className="text-xs text-gray-600 mt-1">{i}</div>
        </div>
      )
    }
  }

  return <div className="relative h-full">{marks}</div>
}

function VerticalRuler({ zoom, pan, height }: { zoom: number; pan: number; height: number }) {
  const marks = []
  const step = 50
  const start = Math.floor(-pan / (step * zoom)) * step
  const end = start + height + step * 10

  for (let i = start; i <= end; i += step) {
    const position = i * zoom + pan
    if (position >= 0 && position <= height * zoom) {
      marks.push(
        <div key={i} className="absolute" style={{ top: position }}>
          <div className="h-px w-4 bg-gray-400" />
          <div className="text-xs text-gray-600 ml-1 transform -rotate-90 origin-left">{i}</div>
        </div>
      )
    }
  }

  return <div className="relative h-full">{marks}</div>
}

export default DesignCanvas
