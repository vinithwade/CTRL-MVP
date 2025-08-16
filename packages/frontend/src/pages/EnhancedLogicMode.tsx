/**
 * Enhanced Logic Mode - Visual Programming Interface
 * Features: Node-based visual scripting, execution simulation, real-time collaboration
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  GitBranch,
  Play,
  Square,
  Settings,
  Database,
  Zap,
  Eye,
  EyeOff,
  Save,
  Download,
  Undo,
  Redo,
  Users,
  Code,
  Layers,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Grid,
  Maximize,
  Minimize,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import { EnhancedDesignProvider, useEnhancedDesign } from '../contexts/EnhancedDesignContext'
import LogicCanvas from '../components/LogicCanvas'
import { LogicNode, LogicConnection, LogicVariable, LogicFunction } from 'shared'

interface LogicModeProps {
  projectId?: string
}

function EnhancedLogicModeContent({ projectId }: LogicModeProps) {
  const {
    project,
    isConnected,
    activeUsers,
    saveProject,
    exportProject,
    undo,
    redo,
    canUndo,
    canRedo,
    switchMode
  } = useEnhancedDesign()

  // UI State
  const [leftPanelTab, setLeftPanelTab] = useState<'nodes' | 'variables' | 'functions'>('nodes')
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'debug' | 'history'>('properties')
  const [selectedNode, setSelectedNode] = useState<LogicNode | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionLog, setExecutionLog] = useState<Array<{ 
    timestamp: string
    nodeId: string
    nodeName: string
    action: string
    data?: any
  }>>([])
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Logic state
  const logicNodes = project?.logicGraph.nodes || []
  const logicConnections = project?.logicGraph.connections || []
  const logicVariables = project?.logicGraph.variables || []
  const logicFunctions = project?.logicGraph.functions || []

  // Statistics
  const stats = {
    totalNodes: logicNodes.length,
    eventNodes: logicNodes.filter(n => n.type === 'event').length,
    actionNodes: logicNodes.filter(n => n.type === 'action').length,
    conditionNodes: logicNodes.filter(n => n.type === 'condition').length,
    connections: logicConnections.length,
    variables: logicVariables.length,
    functions: logicFunctions.length
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGeneratingAI(true)
    try {
      // AI logic generation would be implemented here
      console.log('Generating logic for:', aiPrompt)
      // const logicFlow = await generateLogicFlow(aiPrompt)
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGeneratingAI(false)
      setAiPrompt('')
    }
  }

  const simulateExecution = async () => {
    setIsExecuting(true)
    setExecutionLog([])
    
    // Find entry points (event nodes)
    const entryNodes = logicNodes.filter(node => node.type === 'event')
    
    for (const entryNode of entryNodes) {
      await executeNode(entryNode, [])
    }
    
    setIsExecuting(false)
  }

  const executeNode = async (node: LogicNode, context: any[]): Promise<void> => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      nodeId: node.id,
      nodeName: node.name,
      action: 'execute',
      data: node.data
    }
    
    setExecutionLog(prev => [...prev, logEntry])
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Find connected nodes
    const outgoingConnections = logicConnections.filter(conn => conn.fromNodeId === node.id)
    
    for (const connection of outgoingConnections) {
      const targetNode = logicNodes.find(n => n.id === connection.toNodeId)
      if (targetNode) {
        await executeNode(targetNode, [...context, node.data])
      }
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
              leftPanelTab === 'nodes' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('nodes')}
          >
            <GitBranch className="w-4 h-4 mx-auto mb-1" />
            Nodes
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'variables' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('variables')}
          >
            <Database className="w-4 h-4 mx-auto mb-1" />
            Variables
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'functions' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('functions')}
          >
            <Settings className="w-4 h-4 mx-auto mb-1" />
            Functions
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {leftPanelTab === 'nodes' && <NodesPanel nodes={logicNodes} />}
          {leftPanelTab === 'variables' && <VariablesPanel variables={logicVariables} />}
          {leftPanelTab === 'functions' && <FunctionsPanel functions={logicFunctions} />}
        </div>

        {/* AI Assistant */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">AI Logic Assistant</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Describe the logic flow you want..."
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
            {/* Project Info */}
            <div className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Logic Mode</span>
            </div>

            {/* Execution Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={simulateExecution}
                disabled={isExecuting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className={`p-2 rounded-lg ${showDebugPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Toggle Debug Panel"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Circle className="w-3 h-3 text-red-500" />
                <span>{stats.eventNodes} Events</span>
              </div>
              <div className="flex items-center space-x-1">
                <Square className="w-3 h-3 text-green-500" />
                <span>{stats.actionNodes} Actions</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 transform rotate-45" />
                <span>{stats.conditionNodes} Conditions</span>
              </div>
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
            {/* Mode Switcher */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => switchMode('design')}
                className="px-3 py-2 text-sm font-medium rounded hover:bg-white hover:shadow"
              >
                Design
              </button>
              <button className="px-3 py-2 text-sm font-medium rounded bg-white shadow">
                Logic
              </button>
              <button
                onClick={() => switchMode('code')}
                className="px-3 py-2 text-sm font-medium rounded hover:bg-white hover:shadow"
              >
                Code
              </button>
            </div>

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
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <LogicCanvas />
          
          {/* Debug Panel Overlay */}
          {showDebugPanel && (
            <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Debug Console</h3>
                  <button
                    onClick={() => setShowDebugPanel(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {executionLog.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No execution logs yet</p>
                    <p className="text-xs">Click Execute to see debug output</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executionLog.map((log, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{log.nodeName}</span>
                          <span className="text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-gray-600">{log.action}</div>
                        {log.data && (
                          <div className="mt-1 p-1 bg-gray-100 rounded">
                            <pre className="text-xs">{JSON.stringify(log.data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      {selectedNode && (
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
                rightPanelTab === 'debug' 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightPanelTab('debug')}
            >
              <AlertCircle className="w-4 h-4 mx-auto mb-1" />
              Debug
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                rightPanelTab === 'history' 
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightPanelTab('history')}
            >
              <Clock className="w-4 h-4 mx-auto mb-1" />
              History
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'properties' && <NodePropertiesPanel node={selectedNode} />}
            {rightPanelTab === 'debug' && <NodeDebugPanel node={selectedNode} />}
            {rightPanelTab === 'history' && <NodeHistoryPanel node={selectedNode} />}
          </div>
        </div>
      )}
    </div>
  )
}

// Panel Components
function NodesPanel({ nodes }: { nodes: LogicNode[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || node.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Logic Nodes</h3>
        <button className="p-1 text-gray-600 hover:text-gray-900">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="event">Events</option>
          <option value="action">Actions</option>
          <option value="condition">Conditions</option>
          <option value="variable">Variables</option>
          <option value="function">Functions</option>
        </select>
      </div>

      {/* Nodes List */}
      <div className="space-y-2">
        {filteredNodes.map(node => (
          <NodeListItem key={node.id} node={node} />
        ))}
        
        {filteredNodes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No nodes found</p>
            {searchTerm && <p className="text-xs">Try adjusting your search</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function NodeListItem({ node }: { node: LogicNode }) {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'event': return <Zap className="w-4 h-4 text-red-500" />
      case 'action': return <Play className="w-4 h-4 text-green-500" />
      case 'condition': return <div className="w-4 h-4 bg-yellow-500 transform rotate-45" />
      case 'variable': return <Database className="w-4 h-4 text-purple-500" />
      case 'function': return <Settings className="w-4 h-4 text-blue-500" />
      default: return <Square className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors">
      <div className="flex items-center space-x-3">
        {getNodeIcon(node.type)}
        <div>
          <div className="text-sm font-medium text-gray-900">{node.name}</div>
          <div className="text-xs text-gray-500">{node.type}</div>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <Copy className="w-3 h-3" />
        </button>
        <button className="p-1 text-gray-400 hover:text-red-600">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function VariablesPanel({ variables }: { variables: LogicVariable[] }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Variables</h3>
        <button className="p-1 text-gray-600 hover:text-gray-900">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {variables.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No variables yet</p>
          <p className="text-xs">Create variables to store data</p>
        </div>
      ) : (
        <div className="space-y-2">
          {variables.map(variable => (
            <div key={variable.id} className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{variable.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {variable.type}
                </span>
              </div>
              <div className="text-xs text-gray-600">{variable.description || 'No description'}</div>
              {variable.initialValue && (
                <div className="text-xs text-gray-500 mt-1">
                  Initial: {JSON.stringify(variable.initialValue)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FunctionsPanel({ functions }: { functions: LogicFunction[] }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Functions</h3>
        <button className="p-1 text-gray-600 hover:text-gray-900">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {functions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No functions yet</p>
          <p className="text-xs">Create reusable logic functions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {functions.map(func => (
            <div key={func.id} className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{func.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {func.returnType}
                </span>
              </div>
              <div className="text-xs text-gray-600">{func.description || 'No description'}</div>
              <div className="text-xs text-gray-500 mt-1">
                {func.parameters.length} parameters
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NodePropertiesPanel({ node }: { node: LogicNode }) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Node Properties</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input
            type="text"
            value={node.name}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {node.type}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={node.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

function NodeDebugPanel({ node }: { node: LogicNode }) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Debug Info</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Node ID</label>
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded font-mono">
            {node.id}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Inputs</label>
          <div className="text-xs text-gray-500">
            {node.inputs.length} input(s)
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Outputs</label>
          <div className="text-xs text-gray-500">
            {node.outputs.length} output(s)
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
          <pre className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded overflow-auto max-h-32">
            {JSON.stringify(node.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

function NodeHistoryPanel({ node }: { node: LogicNode }) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Change History</h3>
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No history yet</p>
        <p className="text-xs">Changes will appear here</p>
      </div>
    </div>
  )
}

// Main component with provider
export function EnhancedLogicMode() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <EnhancedDesignProvider projectId={projectId} userId="current-user">
      <EnhancedLogicModeContent projectId={projectId} />
    </EnhancedDesignProvider>
  )
}

export default EnhancedLogicMode
