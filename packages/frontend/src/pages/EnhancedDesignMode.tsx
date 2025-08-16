/**
 * Enhanced Design Mode - Professional UI Builder
 * Features: Figma-like interface, component library, properties panel, layers
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Layers,
  Settings,
  Palette,
  Code,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Plus,
  Grid,
  Ruler,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  Download,
  Undo,
  Redo,
  Play,
  Sparkles,
  Users
} from 'lucide-react'
import { EnhancedDesignProvider, useEnhancedDesign } from '../contexts/EnhancedDesignContext'
import { DesignCanvas } from '../components/DesignCanvas'
import { UIComponent, ComponentType } from 'shared'

interface DesignModeProps {
  projectId?: string
}

function EnhancedDesignModeContent({ projectId }: DesignModeProps) {
  const {
    project,
    isConnected,
    activeUsers,
    activeScreen,
    selectedComponent,
    zoom,
    createScreen,
    setActiveScreen,
    updateComponent,
    deleteComponent,
    selectComponent,
    duplicateComponent,
    saveProject,
    exportProject,
    undo,
    redo,
    canUndo,
    canRedo,
    generateComponent,
    generateLayout
  } = useEnhancedDesign()

  // UI State
  const [leftPanelTab, setLeftPanelTab] = useState<'components' | 'layers' | 'assets'>('components')
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'style' | 'data'>('properties')
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Get screen components
  const screenComponents = project?.components.filter(c => c.screenId === activeScreen) || []

  // Device sizes
  const deviceSizes = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 1024, height: 768 },
    mobile: { width: 375, height: 812 }
  }

  const currentDeviceSize = deviceSizes[devicePreview]

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGeneratingAI(true)
    try {
      const component = await generateComponent(aiPrompt)
      if (component) {
        selectComponent(component.id)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGeneratingAI(false)
      setAiPrompt('')
    }
  }

  return (
    <div className="h-screen flex bg-gray-100 font-['Inter']">
      {/* Left Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Panel Header */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'components' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('components')}
          >
            <Palette className="w-4 h-4 mx-auto mb-1" />
            Components
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'layers' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('layers')}
          >
            <Layers className="w-4 h-4 mx-auto mb-1" />
            Layers
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'assets' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('assets')}
          >
            <Grid className="w-4 h-4 mx-auto mb-1" />
            Assets
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {leftPanelTab === 'components' && <ComponentLibrary />}
          {leftPanelTab === 'layers' && <LayersPanel components={screenComponents} />}
          {leftPanelTab === 'assets' && <AssetsPanel />}
        </div>

        {/* AI Assistant */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">AI Assistant</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Describe what you want to create..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAIGenerate()}
            />
            <button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || isGeneratingAI}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingAI ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Screen Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Screen:</span>
              <select
                value={activeScreen || ''}
                onChange={(e) => setActiveScreen(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {project?.screens.map(screen => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => createScreen('New Screen', 'page')}
                className="p-1 text-gray-600 hover:text-gray-900"
                title="Add Screen"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Device Preview */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                className={`p-2 rounded ${devicePreview === 'desktop' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setDevicePreview('desktop')}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${devicePreview === 'tablet' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setDevicePreview('tablet')}
                title="Tablet"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${devicePreview === 'mobile' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setDevicePreview('mobile')}
                title="Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* View Options */}
            <div className="flex items-center space-x-2">
              <button
                className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${showRulers ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                onClick={() => setShowRulers(!showRulers)}
                title="Toggle Rulers"
              >
                <Ruler className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Section - Collaboration */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {activeUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">{activeUsers.length} users</span>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>

            {/* Actions */}
            <button
              onClick={() => saveProject()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
            <button
              onClick={() => exportProject('code')}
              className="p-2 rounded hover:bg-gray-100"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded hover:bg-gray-100"
              title="Preview"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <DesignCanvas
            width={currentDeviceSize.width}
            height={currentDeviceSize.height}
            showGrid={showGrid}
            showRulers={showRulers}
            snapToGrid={snapToGrid}
          />
        </div>
      </div>

      {/* Right Panel */}
      {selectedComponent && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Panel Header */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                rightPanelTab === 'properties' 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightPanelTab('properties')}
            >
              <Settings className="w-4 h-4 mx-auto mb-1" />
              Properties
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                rightPanelTab === 'style' 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightPanelTab('style')}
            >
              <Palette className="w-4 h-4 mx-auto mb-1" />
              Style
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                rightPanelTab === 'data' 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightPanelTab('data')}
            >
              <Code className="w-4 h-4 mx-auto mb-1" />
              Data
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'properties' && <PropertiesPanel component={selectedComponent} />}
            {rightPanelTab === 'style' && <StylePanel component={selectedComponent} />}
            {rightPanelTab === 'data' && <DataPanel component={selectedComponent} />}
          </div>
        </div>
      )}
    </div>
  )
}

// Component Library
function ComponentLibrary() {
  const componentCategories = [
    {
      name: 'Layout',
      items: [
        { type: 'container' as ComponentType, name: 'Container', icon: '📦' },
        { type: 'grid' as ComponentType, name: 'Grid', icon: '⊞' },
      ]
    },
    {
      name: 'Content',
      items: [
        { type: 'text' as ComponentType, name: 'Text', icon: '📝' },
        { type: 'image' as ComponentType, name: 'Image', icon: '🖼️' },
        { type: 'video' as ComponentType, name: 'Video', icon: '🎥' },
      ]
    },
    {
      name: 'Forms',
      items: [
        { type: 'button' as ComponentType, name: 'Button', icon: '🔘' },
        { type: 'input' as ComponentType, name: 'Input', icon: '📄' },
        { type: 'form' as ComponentType, name: 'Form', icon: '📋' },
      ]
    },
    {
      name: 'Data',
      items: [
        { type: 'list' as ComponentType, name: 'List', icon: '📋' },
        { type: 'table' as ComponentType, name: 'Table', icon: '📊' },
        { type: 'chart' as ComponentType, name: 'Chart', icon: '📈' },
      ]
    }
  ]

  return (
    <div className="p-4 space-y-6">
      {componentCategories.map(category => (
        <div key={category.name}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{category.name}</h3>
          <div className="grid grid-cols-2 gap-2">
            {category.items.map(item => (
              <ComponentLibraryItem key={item.type} {...item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Component Library Item
function ComponentLibraryItem({ type, name, icon }: { type: ComponentType; name: string; icon: string }) {
  return (
    <div
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'palette-item',
          componentType: type
        }))
      }}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-xs font-medium text-gray-700">{name}</div>
      </div>
    </div>
  )
}

// Layers Panel
function LayersPanel({ components }: { components: UIComponent[] }) {
  const { selectComponent, selectedComponent, updateComponent, deleteComponent } = useEnhancedDesign()

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Layers</h3>
        <button className="p-1 text-gray-600 hover:text-gray-900">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-1">
        {components.map(component => (
          <div
            key={component.id}
            className={`flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer ${
              selectedComponent?.id === component.id ? 'bg-blue-50 border border-blue-200' : ''
            }`}
            onClick={() => selectComponent(component.id)}
          >
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  updateComponent(component.id, { visible: !component.visible })
                }}
                className="p-1"
              >
                {component.visible ? (
                  <Eye className="w-3 h-3 text-gray-600" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
              </button>
              <span className="text-sm text-gray-900">{component.name}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  updateComponent(component.id, { locked: !component.locked })
                }}
                className="p-1"
              >
                {component.locked ? (
                  <Lock className="w-3 h-3 text-gray-600" />
                ) : (
                  <Unlock className="w-3 h-3 text-gray-400" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteComponent(component.id)
                }}
                className="p-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        
        {components.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No components yet</p>
            <p className="text-xs">Drag components from the library</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Assets Panel
function AssetsPanel() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Assets</h3>
        <button className="p-1 text-gray-600 hover:text-gray-900">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        <Grid className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No assets yet</p>
        <p className="text-xs">Upload images, icons, and more</p>
      </div>
    </div>
  )
}

// Properties Panel
function PropertiesPanel({ component }: { component: UIComponent }) {
  const { updateComponent } = useEnhancedDesign()

  const handleUpdate = (updates: Partial<UIComponent>) => {
    updateComponent(component.id, updates)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Basic Properties */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={component.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
              <input
                type="number"
                value={component.position.x}
                onChange={(e) => handleUpdate({ 
                  position: { ...component.position, x: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Y</label>
              <input
                type="number"
                value={component.position.y}
                onChange={(e) => handleUpdate({ 
                  position: { ...component.position, y: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
              <input
                type="number"
                value={component.size.width}
                onChange={(e) => handleUpdate({ 
                  size: { ...component.size, width: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
              <input
                type="number"
                value={component.size.height}
                onChange={(e) => handleUpdate({ 
                  size: { ...component.size, height: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Component-specific Properties */}
      {component.type === 'text' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Text</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
            <textarea
              value={component.props.content || ''}
              onChange={(e) => handleUpdate({ 
                props: { ...component.props, content: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>
      )}

      {component.type === 'button' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Button</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Text</label>
            <input
              type="text"
              value={component.props.text || ''}
              onChange={(e) => handleUpdate({ 
                props: { ...component.props, text: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {component.type === 'image' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Image</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source URL</label>
              <input
                type="url"
                value={component.props.src || ''}
                onChange={(e) => handleUpdate({ 
                  props: { ...component.props, src: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
              <input
                type="text"
                value={component.props.alt || ''}
                onChange={(e) => handleUpdate({ 
                  props: { ...component.props, alt: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Style Panel
function StylePanel({ component }: { component: UIComponent }) {
  const { updateComponent } = useEnhancedDesign()

  const handleStyleUpdate = (updates: Partial<UIComponent['styling']>) => {
    updateComponent(component.id, {
      styling: { ...component.styling, ...updates }
    })
  }

  return (
    <div className="p-4 space-y-6">
      {/* Colors */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Background</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={component.styling.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                className="w-10 h-8 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={component.styling.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Layout</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
            <input
              type="number"
              value={component.styling.borderRadius || 0}
              onChange={(e) => handleStyleUpdate({ borderRadius: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={component.styling.opacity || 1}
              onChange={(e) => handleStyleUpdate({ opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Data Panel
function DataPanel({ component }: { component: UIComponent }) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Binding</h3>
      <div className="text-center py-8 text-gray-500">
        <Code className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Data binding coming soon</p>
        <p className="text-xs">Connect to APIs and variables</p>
      </div>
    </div>
  )
}

// Main component with provider
export function EnhancedDesignMode() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <EnhancedDesignProvider projectId={projectId} userId="current-user">
      <EnhancedDesignModeContent projectId={projectId} />
    </EnhancedDesignProvider>
  )
}

export default EnhancedDesignMode
