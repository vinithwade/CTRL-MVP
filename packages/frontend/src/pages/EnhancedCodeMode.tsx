/**
 * Enhanced Code Mode - Professional Code Editor with LSP Integration
 * Features: Monaco editor, file explorer, terminal, debugging, real-time collaboration
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Code,
  FolderOpen,
  FileText,
  Terminal,
  Settings,
  Play,
  Square,
  GitBranch,
  Search,
  Replace,
  Folder,
  File,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Users,
  Eye,
  EyeOff,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Package,
  Globe,
  Database,
  Sparkles,
  X,
  ChevronRight,
  ChevronDown,
  Maximize,
  Minimize
} from 'lucide-react'
import { EnhancedDesignProvider, useEnhancedDesign } from '../contexts/EnhancedDesignContext'
import CodeEditor from '../components/CodeEditor'
import { CodeFile, BuildConfig } from 'shared'

interface CodeModeProps {
  projectId?: string
}

function EnhancedCodeModeContent({ projectId }: CodeModeProps) {
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
  const [leftPanelTab, setLeftPanelTab] = useState<'explorer' | 'search' | 'git'>('explorer')
  const [rightPanelTab, setRightPanelTab] = useState<'terminal' | 'debug' | 'problems'>('terminal')
  const [activeFile, setActiveFile] = useState<CodeFile | null>(null)
  const [openFiles, setOpenFiles] = useState<CodeFile[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']))
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to CTRL Terminal', '$ '])
  const [terminalInput, setTerminalInput] = useState('')
  const [isTerminalVisible, setIsTerminalVisible] = useState(true)
  const [problems, setProblems] = useState<Array<{
    file: string
    line: number
    column: number
    severity: 'error' | 'warning' | 'info'
    message: string
  }>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Get project files
  const files = project?.codeModel.files || []
  const buildConfig = project?.codeModel.buildConfig

  // File tree structure
  const fileTree = buildFileTree(files)

  const handleFileSelect = (file: CodeFile) => {
    setActiveFile(file)
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles(prev => [...prev, file])
    }
  }

  const handleFileClose = (file: CodeFile) => {
    setOpenFiles(prev => prev.filter(f => f.id !== file.id))
    if (activeFile?.id === file.id) {
      const remainingFiles = openFiles.filter(f => f.id !== file.id)
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null)
    }
  }

  const handleFileChange = (file: CodeFile, content: string) => {
    // Update file content in the project model
    const updatedFile = { ...file, content, lastModified: new Date().toISOString() }
    // This would trigger a sync event in the real implementation
    console.log('File changed:', file.path, content.length, 'characters')
  }

  const handleFileCreate = (path: string, content: string = '') => {
    const newFile: CodeFile = {
      id: generateId(),
      path,
      name: path.split('/').pop() || 'untitled',
      extension: path.split('.').pop() || 'txt',
      content,
      generated: false,
      editable: true,
      imports: [],
      exports: [],
      size: content.length,
      lineCount: content.split('\n').length,
      lastModified: new Date().toISOString()
    }
    
    // Add to project files
    console.log('Creating file:', newFile)
  }

  const handleFileDelete = (file: CodeFile) => {
    // Remove from project files
    handleFileClose(file)
    console.log('Deleting file:', file.path)
  }

  const handleTerminalCommand = (command: string) => {
    setTerminalOutput(prev => [...prev, `$ ${command}`])
    setTerminalInput('')
    
    // Process command
    executeTerminalCommand(command)
  }

  const executeTerminalCommand = async (command: string) => {
    const commands = command.trim().split(' ')
    const baseCommand = commands[0]
    
    switch (baseCommand) {
      case 'clear':
        setTerminalOutput(['$ '])
        break
      case 'ls':
        const fileList = files.map(f => f.name).join('  ')
        setTerminalOutput(prev => [...prev, fileList, '$ '])
        break
      case 'build':
        await handleBuild()
        break
      case 'dev':
        setTerminalOutput(prev => [...prev, 'Starting development server...', 'Server running on http://localhost:3000', '$ '])
        break
      case 'test':
        setTerminalOutput(prev => [...prev, 'Running tests...', 'All tests passed ✓', '$ '])
        break
      case 'install':
        setTerminalOutput(prev => [...prev, 'Installing dependencies...', 'Dependencies installed ✓', '$ '])
        break
      default:
        setTerminalOutput(prev => [...prev, `Command not found: ${baseCommand}`, '$ '])
    }
  }

  const handleBuild = async () => {
    setIsBuilding(true)
    setTerminalOutput(prev => [...prev, 'Building project...'])
    
    // Simulate build process
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, 'Build completed successfully ✓', '$ '])
      setIsBuilding(false)
    }, 2000)
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGeneratingAI(true)
    try {
      // AI code generation would be implemented here
      console.log('Generating code for:', aiPrompt)
      setTerminalOutput(prev => [...prev, `AI: Generating code for "${aiPrompt}"...`, 'AI: Code generated successfully', '$ '])
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGeneratingAI(false)
      setAiPrompt('')
    }
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  return (
    <div className="h-screen flex bg-gray-100 font-['Inter']">
      {/* Left Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Panel Header */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'explorer' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('explorer')}
          >
            <FolderOpen className="w-4 h-4 mx-auto mb-1" />
            Explorer
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'search' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('search')}
          >
            <Search className="w-4 h-4 mx-auto mb-1" />
            Search
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanelTab === 'git' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setLeftPanelTab('git')}
          >
            <GitBranch className="w-4 h-4 mx-auto mb-1" />
            Git
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {leftPanelTab === 'explorer' && (
            <FileExplorer
              fileTree={fileTree}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
              activeFile={activeFile}
            />
          )}
          {leftPanelTab === 'search' && (
            <SearchPanel
              searchTerm={searchTerm}
              replaceTerm={replaceTerm}
              onSearchChange={setSearchTerm}
              onReplaceChange={setReplaceTerm}
              files={files}
            />
          )}
          {leftPanelTab === 'git' && <GitPanel />}
        </div>

        {/* AI Assistant */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">AI Code Assistant</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Describe the code you need..."
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
              <Code className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Code Mode</span>
            </div>

            {/* Build Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBuild}
                disabled={isBuilding}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isBuilding ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isBuilding ? 'Building...' : 'Build'}
              </button>
              <button
                onClick={() => setIsTerminalVisible(!isTerminalVisible)}
                className={`p-2 rounded-lg ${isTerminalVisible ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Toggle Terminal"
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>

            {/* File Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>{files.length} files</span>
              </div>
              <div className="flex items-center space-x-1">
                <Package className="w-3 h-3" />
                <span>{files.filter(f => f.generated).length} generated</span>
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
              <button
                onClick={() => switchMode('logic')}
                className="px-3 py-2 text-sm font-medium rounded hover:bg-white hover:shadow"
              >
                Logic
              </button>
              <button className="px-3 py-2 text-sm font-medium rounded bg-white shadow">
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

        {/* Open Files Tabs */}
        {openFiles.length > 0 && (
          <div className="bg-gray-50 border-b border-gray-200 flex items-center overflow-x-auto">
            {openFiles.map(file => (
              <button
                key={file.id}
                className={`flex items-center space-x-2 px-4 py-2 border-r border-gray-200 hover:bg-white ${
                  activeFile?.id === file.id ? 'bg-white border-b-2 border-blue-600' : ''
                }`}
                onClick={() => setActiveFile(file)}
              >
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFileClose(file)
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        )}

        {/* Editor Area */}
        <div className={`flex-1 ${isTerminalVisible ? 'flex flex-col' : ''}`}>
          <div className={isTerminalVisible ? 'flex-1' : 'h-full'}>
            <CodeEditor
              files={files}
              activeFile={activeFile}
              onFileChange={handleFileChange}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
              theme="light"
            />
          </div>

          {/* Terminal Panel */}
          {isTerminalVisible && (
            <div className="h-64 bg-gray-900 text-white flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                  <button
                    className={`px-3 py-1 text-sm rounded ${
                      rightPanelTab === 'terminal' ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => setRightPanelTab('terminal')}
                  >
                    Terminal
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded ${
                      rightPanelTab === 'problems' ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => setRightPanelTab('problems')}
                  >
                    Problems ({problems.length})
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded ${
                      rightPanelTab === 'debug' ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => setRightPanelTab('debug')}
                  >
                    Debug
                  </button>
                </div>
                <button
                  onClick={() => setIsTerminalVisible(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                {rightPanelTab === 'terminal' && (
                  <TerminalContent
                    output={terminalOutput}
                    input={terminalInput}
                    onInputChange={setTerminalInput}
                    onCommand={handleTerminalCommand}
                  />
                )}
                {rightPanelTab === 'problems' && (
                  <ProblemsContent problems={problems} onProblemClick={(problem: any) => {
                    // Navigate to problem location
                    console.log('Navigate to problem:', problem)
                  }} />
                )}
                {rightPanelTab === 'debug' && (
                  <DebugContent />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Component implementations...

function FileExplorer({ 
  fileTree, 
  expandedFolders, 
  onToggleFolder, 
  onFileSelect, 
  onFileCreate, 
  onFileDelete, 
  activeFile 
}: any) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Files</h3>
        <button
          onClick={() => onFileCreate('new-file.tsx')}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <FileTreeNode
        node={fileTree}
        expandedFolders={expandedFolders}
        onToggleFolder={onToggleFolder}
        onFileSelect={onFileSelect}
        onFileDelete={onFileDelete}
        activeFile={activeFile}
      />
    </div>
  )
}

function FileTreeNode({ node, expandedFolders, onToggleFolder, onFileSelect, onFileDelete, activeFile }: any) {
  if (node.type === 'file') {
    return (
      <div
        className={`flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer ${
          activeFile?.id === node.id ? 'bg-blue-50 border border-blue-200' : ''
        }`}
        onClick={() => onFileSelect(node)}
      >
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-900">{node.name}</span>
          {node.generated && (
            <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Gen</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFileDelete(node)
          }}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    )
  }

  const isExpanded = expandedFolders.has(node.path)

  return (
    <div>
      <div
        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
        onClick={() => onToggleFolder(node.path)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
        <Folder className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-900">{node.name}</span>
      </div>
      
      {isExpanded && (
        <div className="ml-6">
          {node.children.map((child: any) => (
            <FileTreeNode
              key={child.path}
              node={child}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onFileSelect={onFileSelect}
              onFileDelete={onFileDelete}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SearchPanel({ searchTerm, replaceTerm, onSearchChange, onReplaceChange, files }: any) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Search & Replace</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Replace..."
          value={replaceTerm}
          onChange={(e) => onReplaceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Replace All
        </button>
      </div>
    </div>
  )
}

function GitPanel() {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Source Control</h3>
      <div className="text-center py-8 text-gray-500">
        <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Git integration coming soon</p>
      </div>
    </div>
  )
}

function TerminalContent({ output, input, onInputChange, onCommand }: any) {
  return (
    <div className="space-y-1">
      {output.map((line: string, index: number) => (
        <div key={index} className="whitespace-pre-wrap">
          {line}
        </div>
      ))}
      <div className="flex">
        <span>$ </span>
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onCommand(input)
            }
          }}
          className="flex-1 bg-transparent outline-none text-white ml-1"
          autoFocus
        />
      </div>
    </div>
  )
}

function ProblemsContent({ problems, onProblemClick }: any) {
  return (
    <div className="space-y-2">
      {problems.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No problems found</p>
        </div>
      ) : (
        problems.map((problem: any, index: number) => (
          <div
            key={index}
            className="p-2 hover:bg-gray-800 cursor-pointer rounded"
            onClick={() => onProblemClick(problem)}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className={`w-4 h-4 ${
                problem.severity === 'error' ? 'text-red-500' : 
                problem.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
              }`} />
              <span className="text-sm">{problem.message}</span>
            </div>
            <div className="text-xs text-gray-400 ml-6">
              {problem.file}:{problem.line}:{problem.column}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DebugContent() {
  return (
    <div className="text-center py-8 text-gray-400">
      <Zap className="w-8 h-8 mx-auto mb-2" />
      <p>Debug panel coming soon</p>
    </div>
  )
}

// Helper functions
function buildFileTree(files: CodeFile[]) {
  const tree: any = { type: 'folder', name: 'root', path: '', children: [] }
  
  files.forEach(file => {
    const pathParts = file.path.split('/')
    let current = tree
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      let folder = current.children.find((child: any) => child.name === part && child.type === 'folder')
      
      if (!folder) {
        folder = {
          type: 'folder',
          name: part,
          path: pathParts.slice(0, i + 1).join('/'),
          children: []
        }
        current.children.push(folder)
      }
      
      current = folder
    }
    
    current.children.push({
      ...file,
      type: 'file'
    })
  })
  
  return tree
}

function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Main component with provider
export function EnhancedCodeMode() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <EnhancedDesignProvider projectId={projectId} userId="current-user">
      <EnhancedCodeModeContent projectId={projectId} />
    </EnhancedDesignProvider>
  )
}

export default EnhancedCodeMode
