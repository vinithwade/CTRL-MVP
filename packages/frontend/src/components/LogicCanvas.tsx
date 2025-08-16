/**
 * Enhanced Logic Canvas - Node-based Visual Programming (Unreal Blueprints style)
 * Features: node graph editing, connections, data flow, execution flow
 */

import React, { useCallback, useState, useRef, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowProvider,
  Panel,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Play,
  Square,
  Circle,
  Diamond,
  Database,
  Globe,
  Zap,
  GitBranch,
  Settings,
  Trash2,
  Copy,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import { useEnhancedDesign } from '../contexts/EnhancedDesignContext'
import { LogicNode as SharedLogicNode, LogicNodeType, DataType } from 'shared'

// Custom node types
const nodeTypes: NodeTypes = {
  eventNode: EventNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  variableNode: VariableNode,
  functionNode: FunctionNode,
  componentNode: ComponentNode,
  commentNode: CommentNode
}

// Custom edge types
const edgeTypes: EdgeTypes = {
  dataFlow: DataFlowEdge,
  executionFlow: ExecutionFlowEdge
}

interface LogicCanvasProps {
  width?: number
  height?: number
}

export function LogicCanvas({ width = 1920, height = 1080 }: LogicCanvasProps) {
  const {
    project,
    createLogicNode,
    updateLogicNode,
    deleteLogicNode,
    createConnection,
    deleteConnection
  } = useEnhancedDesign()

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [nodeSearchTerm, setNodeSearchTerm] = useState('')
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionPath, setExecutionPath] = useState<string[]>([])

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // Convert shared logic nodes to React Flow nodes
  useEffect(() => {
    if (project?.logicGraph.nodes) {
      const flowNodes = project.logicGraph.nodes.map(logicNode => ({
        id: logicNode.id,
        type: getNodeType(logicNode.type),
        position: { x: logicNode.position.x, y: logicNode.position.y },
        data: {
          ...logicNode.data,
          label: logicNode.name,
          description: logicNode.description,
          inputs: logicNode.inputs,
          outputs: logicNode.outputs,
          nodeType: logicNode.type,
          onUpdate: (updates: any) => updateLogicNode(logicNode.id, updates),
          onDelete: () => deleteLogicNode(logicNode.id)
        }
      }))
      setNodes(flowNodes)
    }
  }, [project?.logicGraph.nodes])

  // Convert shared connections to React Flow edges
  useEffect(() => {
    if (project?.logicGraph.connections) {
      const flowEdges = project.logicGraph.connections.map(connection => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromPortId,
        targetHandle: connection.toPortId,
        type: connection.type === 'execution' ? 'executionFlow' : 'dataFlow',
        animated: connection.animated || false,
        style: {
          stroke: getConnectionColor(connection.type),
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getConnectionColor(connection.type)
        }
      }))
      setEdges(flowEdges)
    }
  }, [project?.logicGraph.connections])

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      const newConnection = createConnection(params.source, params.target)
      const newEdge = {
        id: newConnection.id,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || 'output',
        targetHandle: params.targetHandle || 'input',
        type: 'dataFlow',
        animated: false,
        style: {
          stroke: '#3b82f6',
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6'
        }
      }
      setEdges((eds) => addEdge(newEdge, eds))
    }
  }, [createConnection])

  const onNodeDelete = useCallback((nodesToDelete: Node[]) => {
    nodesToDelete.forEach(node => {
      deleteLogicNode(node.id)
    })
  }, [deleteLogicNode])

  const onEdgeDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => {
      deleteConnection(edge.id)
    })
  }, [deleteConnection])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const nodeData = event.dataTransfer.getData('application/reactflow')

      if (nodeData && reactFlowBounds && reactFlowInstance) {
        const { nodeType, label } = JSON.parse(nodeData)
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top
        })

        const newLogicNode = createLogicNode(nodeType, position)
        
        const newNode = {
          id: newLogicNode.id,
          type: getNodeType(nodeType),
          position,
          data: {
            label: label || newLogicNode.name,
            nodeType,
            inputs: newLogicNode.inputs,
            outputs: newLogicNode.outputs,
            onUpdate: (updates: any) => updateLogicNode(newLogicNode.id, updates),
            onDelete: () => deleteLogicNode(newLogicNode.id)
          }
        }

        setNodes((nds) => nds.concat(newNode))
      }
    },
    [reactFlowInstance, createLogicNode, updateLogicNode, deleteLogicNode]
  )

  // Execute logic graph (simulation)
  const executeLogicGraph = async () => {
    setIsExecuting(true)
    setExecutionPath([])

    // Find entry points (event nodes)
    const entryNodes = nodes.filter(node => node.data.nodeType === 'event')
    
    for (const entryNode of entryNodes) {
      await simulateExecution(entryNode.id, [])
    }

    setIsExecuting(false)
  }

  const simulateExecution = async (nodeId: string, path: string[]): Promise<void> => {
    const newPath = [...path, nodeId]
    setExecutionPath(newPath)

    // Highlight current node
    setNodes(nds => nds.map(node => ({
      ...node,
      style: {
        ...node.style,
        border: node.id === nodeId ? '3px solid #10b981' : undefined,
        boxShadow: node.id === nodeId ? '0 0 10px rgba(16, 185, 129, 0.5)' : undefined
      }
    })))

    // Wait for visualization
    await new Promise(resolve => setTimeout(resolve, 500))

    // Find connected nodes
    const connectedEdges = edges.filter(edge => edge.source === nodeId)
    
    for (const edge of connectedEdges) {
      if (edge.type === 'executionFlow') {
        await simulateExecution(edge.target, newPath)
      }
    }

    // Remove highlight
    setNodes(nds => nds.map(node => ({
      ...node,
      style: {
        ...node.style,
        border: undefined,
        boxShadow: undefined
      }
    })))
  }

  const filteredNodeLibrary = getNodeLibrary().filter(category =>
    category.items.some(item =>
      item.label.toLowerCase().includes(nodeSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(nodeSearchTerm.toLowerCase())
    )
  )

  return (
    <div className="h-full flex bg-gray-100">
      {/* Node Library */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Node Library</h3>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={nodeSearchTerm}
              onChange={(e) => setNodeSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Execution Controls */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={executeLogicGraph}
              disabled={isExecuting}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Executing...' : 'Execute'}
            </button>
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Toggle MiniMap"
            >
              {showMiniMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Node Categories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {filteredNodeLibrary.map(category => (
            <NodeCategory key={category.name} category={category} />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodeDelete}
            onEdgesDelete={onEdgeDelete}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant="dots" gap={20} size={1} />
            <Controls />
            {showMiniMap && (
              <MiniMap
                nodeStrokeColor={(n) => {
                  switch (n.data.nodeType) {
                    case 'event': return '#ef4444'
                    case 'action': return '#10b981'
                    case 'condition': return '#f59e0b'
                    case 'variable': return '#8b5cf6'
                    case 'function': return '#3b82f6'
                    default: return '#6b7280'
                  }
                }}
                nodeColor={(n) => {
                  switch (n.data.nodeType) {
                    case 'event': return '#fecaca'
                    case 'action': return '#bbf7d0'
                    case 'condition': return '#fde68a'
                    case 'variable': return '#ddd6fe'
                    case 'function': return '#bfdbfe'
                    default: return '#f3f4f6'
                  }
                }}
                nodeBorderRadius={8}
              />
            )}
            
            {/* Execution Path Overlay */}
            {isExecuting && (
              <Panel position="top-center">
                <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-700">
                      Executing logic graph... ({executionPath.length} nodes)
                    </span>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}

// Node Category Component
function NodeCategory({ category }: { category: any }) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div>
      <button
        className="flex items-center justify-between w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-sm font-semibold text-gray-700">{category.name}</h4>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {category.items.map((item: any) => (
            <NodeLibraryItem key={item.type} {...item} />
          ))}
        </div>
      )}
    </div>
  )
}

// Node Library Item
function NodeLibraryItem({ type, label, description, icon: Icon, color }: any) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, label }))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-colors"
      draggable
      onDragStart={(event) => onDragStart(event, type)}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500 truncate">{description}</div>
        </div>
      </div>
    </div>
  )
}

// Custom Node Components
function EventNode({ data }: { data: any }) {
  return (
    <div className="bg-red-500 text-white rounded-lg shadow-lg min-w-[200px]">
      <div className="px-4 py-2 border-b border-red-400">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs opacity-90">{data.description || 'Event trigger'}</div>
        {/* Output handle */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-red-500 rounded-full"></div>
      </div>
    </div>
  )
}

function ActionNode({ data }: { data: any }) {
  return (
    <div className="bg-green-500 text-white rounded-lg shadow-lg min-w-[200px]">
      <div className="px-4 py-2 border-b border-green-400">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs opacity-90">{data.description || 'Action to perform'}</div>
        {/* Input handle */}
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-green-500 rounded-full"></div>
        {/* Output handle */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-green-500 rounded-full"></div>
      </div>
    </div>
  )
}

function ConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-yellow-500 text-white rounded-lg shadow-lg min-w-[200px]">
      <div className="px-4 py-2 border-b border-yellow-400">
        <div className="flex items-center space-x-2">
          <Diamond className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs opacity-90">{data.description || 'Conditional logic'}</div>
        {/* Input handle */}
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-yellow-500 rounded-full"></div>
        {/* True output */}
        <div className="absolute -right-2 top-1/3 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-yellow-500 rounded-full"></div>
        {/* False output */}
        <div className="absolute -right-2 bottom-1/3 transform translate-y-1/2 w-4 h-4 bg-white border-2 border-yellow-500 rounded-full"></div>
      </div>
    </div>
  )
}

function VariableNode({ data }: { data: any }) {
  return (
    <div className="bg-purple-500 text-white rounded-lg shadow-lg min-w-[200px]">
      <div className="px-4 py-2 border-b border-purple-400">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs opacity-90">{data.description || 'Variable storage'}</div>
        <div className="text-xs opacity-75 mt-1">{data.dataType || 'any'}</div>
        {/* Output handle */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-purple-500 rounded-full"></div>
      </div>
    </div>
  )
}

function FunctionNode({ data }: { data: any }) {
  return (
    <div className="bg-blue-500 text-white rounded-lg shadow-lg min-w-[200px]">
      <div className="px-4 py-2 border-b border-blue-400">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs opacity-90">{data.description || 'Function call'}</div>
        {/* Input handle */}
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full"></div>
        {/* Output handle */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full"></div>
      </div>
    </div>
  )
}

function ComponentNode({ data }: { data: any }) {
  return (
    <div className="bg-indigo-500 text-white rounded-lg shadow-lg min-w-[200px]">
      <div className="px-4 py-2 border-b border-indigo-400">
        <div className="flex items-center space-x-2">
          <Square className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs opacity-90">{data.description || 'UI Component'}</div>
        {/* Multiple input/output handles for component events */}
        <div className="absolute -left-2 top-1/4 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full"></div>
        <div className="absolute -left-2 bottom-1/4 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full"></div>
        <div className="absolute -right-2 top-1/4 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full"></div>
        <div className="absolute -right-2 bottom-1/4 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full"></div>
      </div>
    </div>
  )
}

function CommentNode({ data }: { data: any }) {
  return (
    <div className="bg-gray-200 text-gray-800 rounded-lg shadow-lg min-w-[200px] border-2 border-dashed border-gray-400">
      <div className="p-3">
        <div className="text-sm">{data.label || 'Comment'}</div>
        <div className="text-xs text-gray-600 mt-1">{data.description || 'Add your notes here'}</div>
      </div>
    </div>
  )
}

// Custom Edge Components
function DataFlowEdge({ id, sourceX, sourceY, targetX, targetY, style }: any) {
  return (
    <path
      id={id}
      style={{ ...style, stroke: '#3b82f6', strokeWidth: 2 }}
      className="react-flow__edge-path"
      d={`M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`}
      markerEnd="url(#data-arrow)"
    />
  )
}

function ExecutionFlowEdge({ id, sourceX, sourceY, targetX, targetY, style }: any) {
  return (
    <path
      id={id}
      style={{ ...style, stroke: '#ef4444', strokeWidth: 3 }}
      className="react-flow__edge-path"
      d={`M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`}
      markerEnd="url(#execution-arrow)"
    />
  )
}

// Helper functions
function getNodeType(logicNodeType: LogicNodeType): string {
  const mapping: Record<LogicNodeType, string> = {
    event: 'eventNode',
    action: 'actionNode',
    condition: 'conditionNode',
    variable: 'variableNode',
    function: 'functionNode',
    apiCall: 'actionNode',
    navigation: 'actionNode',
    stateChange: 'actionNode',
    timer: 'eventNode',
    mathOperation: 'functionNode',
    stringOperation: 'functionNode',
    arrayOperation: 'functionNode',
    conditional: 'conditionNode',
    loop: 'conditionNode',
    switch: 'conditionNode',
    sequence: 'actionNode',
    comment: 'commentNode',
    group: 'commentNode',
    subgraph: 'functionNode'
  }
  return mapping[logicNodeType] || 'functionNode'
}

function getConnectionColor(type: string): string {
  switch (type) {
    case 'execution': return '#ef4444'
    case 'data': return '#3b82f6'
    case 'event': return '#f59e0b'
    default: return '#6b7280'
  }
}

function getNodeLibrary() {
  return [
    {
      name: 'Events',
      items: [
        { type: 'event', label: 'On Start', description: 'Triggered when app starts', icon: Zap, color: 'bg-red-500' },
        { type: 'event', label: 'On Click', description: 'Triggered when clicked', icon: Zap, color: 'bg-red-500' },
        { type: 'event', label: 'On Timer', description: 'Triggered after delay', icon: Zap, color: 'bg-red-500' },
        { type: 'event', label: 'On Data Change', description: 'Triggered when data changes', icon: Zap, color: 'bg-red-500' }
      ]
    },
    {
      name: 'Actions',
      items: [
        { type: 'action', label: 'Set Variable', description: 'Set a variable value', icon: Play, color: 'bg-green-500' },
        { type: 'action', label: 'Navigate', description: 'Navigate to screen', icon: Play, color: 'bg-green-500' },
        { type: 'action', label: 'Show Modal', description: 'Display modal dialog', icon: Play, color: 'bg-green-500' },
        { type: 'action', label: 'API Call', description: 'Make HTTP request', icon: Globe, color: 'bg-green-500' }
      ]
    },
    {
      name: 'Logic',
      items: [
        { type: 'condition', label: 'If/Else', description: 'Conditional branching', icon: Diamond, color: 'bg-yellow-500' },
        { type: 'condition', label: 'Switch', description: 'Multiple conditions', icon: Diamond, color: 'bg-yellow-500' },
        { type: 'condition', label: 'Loop', description: 'Repeat actions', icon: GitBranch, color: 'bg-yellow-500' },
        { type: 'condition', label: 'Compare', description: 'Compare values', icon: Diamond, color: 'bg-yellow-500' }
      ]
    },
    {
      name: 'Data',
      items: [
        { type: 'variable', label: 'Variable', description: 'Store data', icon: Database, color: 'bg-purple-500' },
        { type: 'variable', label: 'Array', description: 'List of items', icon: Database, color: 'bg-purple-500' },
        { type: 'variable', label: 'Object', description: 'Key-value pairs', icon: Database, color: 'bg-purple-500' },
        { type: 'function', label: 'Transform', description: 'Transform data', icon: Settings, color: 'bg-blue-500' }
      ]
    },
    {
      name: 'Math',
      items: [
        { type: 'function', label: 'Add', description: 'Add numbers', icon: Plus, color: 'bg-blue-500' },
        { type: 'function', label: 'Subtract', description: 'Subtract numbers', icon: Settings, color: 'bg-blue-500' },
        { type: 'function', label: 'Multiply', description: 'Multiply numbers', icon: Settings, color: 'bg-blue-500' },
        { type: 'function', label: 'Divide', description: 'Divide numbers', icon: Settings, color: 'bg-blue-500' }
      ]
    },
    {
      name: 'Utilities',
      items: [
        { type: 'comment', label: 'Comment', description: 'Add notes', icon: Circle, color: 'bg-gray-500' },
        { type: 'function', label: 'Debug Log', description: 'Print to console', icon: Settings, color: 'bg-blue-500' },
        { type: 'function', label: 'Delay', description: 'Wait for time', icon: Settings, color: 'bg-blue-500' }
      ]
    }
  ]
}

export default LogicCanvas
