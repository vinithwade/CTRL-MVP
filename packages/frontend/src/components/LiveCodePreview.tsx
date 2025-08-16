import { useState, useEffect, useRef } from 'react'
import { useDesign } from '@/contexts/DesignContext'
import { CodeGenerator, Framework } from '@/services/codeGenerator'
import { BackendGenerator, BackendFramework } from '@/services/backendGenerator'
import { TestGenerator } from '@/services/testGenerator'
import { 
  Code, 
  Eye, 
  EyeOff, 
  Download, 
  
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  FileCode,
  Database,
  TestTube
} from 'lucide-react'

interface LiveCodePreviewProps {
  isVisible: boolean
  onToggle: () => void
}

interface CodePreviewState {
  frontendCode: string
  backendCode: string
  testCode: string
  errors: string[]
  warnings: string[]
  isGenerating: boolean
  lastGenerated: Date | null
}

export function LiveCodePreview({ isVisible, onToggle }: LiveCodePreviewProps) {
  const { components, screens } = useDesign()
  const [state, setState] = useState<CodePreviewState>({
    frontendCode: '',
    backendCode: '',
    testCode: '',
    errors: [],
    warnings: [],
    isGenerating: false,
    lastGenerated: null
  })

  const [settings, setSettings] = useState({
    framework: 'react' as Framework,
    backendFramework: 'express' as BackendFramework,
    language: 'typescript' as 'typescript' | 'javascript',
    styling: 'tailwind' as 'css' | 'tailwind' | 'styled-components',
    database: 'postgresql' as 'postgresql' | 'mysql' | 'mongodb',
    testing: 'jest' as 'jest' | 'vitest' | 'cypress',
    autoGenerate: true,
    showBackend: true,
    showTests: true
  })

  const [activeTab, setActiveTab] = useState<'frontend' | 'backend' | 'tests' | 'preview'>('frontend')
  const [copied, setCopied] = useState<string | null>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const codeGeneratorRef = useRef<CodeGenerator>()
  const backendGeneratorRef = useRef<BackendGenerator>()
  const testGeneratorRef = useRef<TestGenerator>()

  // Initialize generators
  useEffect(() => {
    codeGeneratorRef.current = new CodeGenerator({
      framework: settings.framework,
      language: settings.language,
      styling: settings.styling,
      bundler: 'vite',
      features: {
        typescript: settings.language === 'typescript',
        testing: true,
        linting: true,
        formatting: true
      }
    })

    backendGeneratorRef.current = new BackendGenerator({
      framework: settings.backendFramework,
      language: settings.language,
      database: settings.database,
      features: {
        authentication: true,
        authorization: true,
        validation: true,
        testing: true,
        documentation: true,
        caching: false
      }
    })

    testGeneratorRef.current = new TestGenerator({
      framework: settings.framework,
      testingLibrary: settings.testing as any,
      coverage: true,
      typescript: settings.language === 'typescript'
    })
  }, [settings])

  // Auto-generate code when components change
  useEffect(() => {
    if (settings.autoGenerate && components.length > 0) {
      const timeoutId = setTimeout(() => {
        generateCode()
      }, 1000) // Debounce generation

      return () => clearTimeout(timeoutId)
    }
  }, [components, screens, settings.autoGenerate])

  const generateCode = async () => {
    if (!codeGeneratorRef.current || !backendGeneratorRef.current || !testGeneratorRef.current) return

    setState(prev => ({ ...prev, isGenerating: true, errors: [], warnings: [] }))

    try {
      // Generate frontend code
      const frontendResult = codeGeneratorRef.current.generateProject(components, screens)
      const frontendCode = frontendResult.files.map(file => `// ${file.path}\n${file.content}`).join('\n\n')

      // Generate backend code
      const backendResult = backendGeneratorRef.current.generateBackend(components, screens)
      const backendCode = backendResult.files.map(file => `// ${file.path}\n${file.content}`).join('\n\n')

      // Generate test code
      const testResult = testGeneratorRef.current.generateTests(components, screens)
      const testCode = testResult.files.map(file => `// ${file.path}\n${file.content}`).join('\n\n')

      // Validate generated code
      const { errors, warnings } = validateGeneratedCode()

      setState(prev => ({
        ...prev,
        frontendCode,
        backendCode,
        testCode,
        errors,
        warnings,
        isGenerating: false,
        lastGenerated: new Date()
      }))

      // Update preview iframe
      updatePreview(frontendResult)
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, `Generation failed: ${error}`],
        isGenerating: false
      }))
    }
  }

  const validateGeneratedCode = () => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for missing components
    if (components.length === 0) {
      warnings.push('No components detected in design')
    }

    // Check for components without interactions
    const interactiveComponents = components.filter(c => c.type === 'button' || c.type === 'input' || c.type === 'form')
    if (interactiveComponents.length > 0) {
      warnings.push(`${interactiveComponents.length} interactive components found - consider adding event handlers`)
    }

    // Check for accessibility issues
    const imageComponents = components.filter(c => c.type === 'image')
    imageComponents.forEach(img => {
      if (!img.props?.alt) {
        errors.push(`Image component "${img.name}" missing alt text`)
      }
    })

    // Check for responsive design issues
    const hasMobileComponents = components.some(c => c.size && c.size.width > 400)
    if (hasMobileComponents) {
      warnings.push('Some components may be too wide for mobile devices')
    }

    return { errors, warnings }
  }

  const updatePreview = (frontendResult: any) => {
    if (!previewRef.current) return

    try {
      // Create a simple HTML preview
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Live Preview</title>
          <style>
            ${frontendResult.files.find((f: any) => f.name === 'styles.css')?.content || ''}
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .preview-container { max-width: 1200px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="app">
              <div class="screen-container">
                ${components.map(component => `
                  <div class="${component.type}-component" 
                       style="position: absolute; left: ${component.position?.x || 0}px; top: ${component.position?.y || 0}px; width: ${component.size?.width || 100}px; height: ${component.size?.height || 100}px; background-color: ${component.backgroundColor || 'transparent'}; z-index: ${component.zIndex || 1};">
                    ${generateComponentPreview(component)}
                  </div>
                `).join('\n')}
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      previewRef.current.src = url
    } catch (error) {
      console.error('Failed to update preview:', error)
    }
  }

  const generateComponentPreview = (component: any) => {
    switch (component.type) {
      case 'button':
        return `<button class="btn" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">${component.name}</button>`
      case 'input':
        return `<input type="text" placeholder="${component.name}" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%;" />`
      case 'text':
        return `<h3 style="margin: 0 0 8px 0;">${component.name}</h3><p style="margin: 0; color: #666;">${component.props?.content || 'Text content'}</p>`
      case 'image':
        return `<img src="https://via.placeholder.com/150/3b82f6/ffffff?text=${component.name}" alt="${component.name}" style="width: 100%; height: 100%; object-fit: cover;" />`
      case 'form':
        return `<form style="display: flex; flex-direction: column; gap: 8px;"><input type="text" placeholder="Name" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" /><input type="email" placeholder="Email" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" /><button type="submit" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button></form>`
      default:
        return `<div style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">${component.name}</div>`
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const exportProject = () => {
    const projectData = {
      components,
      screens,
      settings,
      generatedCode: {
        frontend: state.frontendCode,
        backend: state.backendCode,
        tests: state.testCode
      },
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ctrl-project.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Live Code Preview</h2>
            {state.isGenerating && <RefreshCw className="w-4 h-4 animate-spin" />}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={generateCode}
              disabled={state.isGenerating}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {state.isGenerating ? 'Generating...' : 'Generate'}
            </button>
            <button
              onClick={exportProject}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Settings</h3>
                <div className="space-y-2">
                  <label className="block text-sm">
                    Framework:
                    <select
                      value={settings.framework}
                      onChange={(e) => setSettings(prev => ({ ...prev, framework: e.target.value as Framework }))}
                      className="w-full mt-1 p-1 border rounded text-sm"
                    >
                      <option value="react">React</option>
                      <option value="vue">Vue</option>
                      <option value="angular">Angular</option>
                      <option value="svelte">Svelte</option>
                      <option value="vanilla">Vanilla JS</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    Backend:
                    <select
                      value={settings.backendFramework}
                      onChange={(e) => setSettings(prev => ({ ...prev, backendFramework: e.target.value as BackendFramework }))}
                      className="w-full mt-1 p-1 border rounded text-sm"
                    >
                      <option value="express">Express</option>
                      <option value="fastify">Fastify</option>
                      <option value="nest">NestJS</option>
                      <option value="django">Django</option>
                      <option value="spring">Spring Boot</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    Database:
                    <select
                      value={settings.database}
                      onChange={(e) => setSettings(prev => ({ ...prev, database: e.target.value as any }))}
                      className="w-full mt-1 p-1 border rounded text-sm"
                    >
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mysql">MySQL</option>
                      <option value="mongodb">MongoDB</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Components:</span>
                    <span className="font-mono">{components.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Screens:</span>
                    <span className="font-mono">{screens.length}</span>
                  </div>
                  {state.lastGenerated && (
                    <div className="text-xs text-gray-500">
                      Last generated: {state.lastGenerated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {state.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Errors</h3>
                  <div className="space-y-1">
                    {state.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 flex items-start">
                        <AlertCircle className="w-3 h-3 mt-0.5 mr-1 flex-shrink-0" />
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.warnings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-yellow-600">Warnings</h3>
                  <div className="space-y-1">
                    {state.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-600 flex items-start">
                        <AlertCircle className="w-3 h-3 mt-0.5 mr-1 flex-shrink-0" />
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('frontend')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'frontend' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
                }`}
              >
                <FileCode className="w-4 h-4 inline mr-1" />
                Frontend
              </button>
              {settings.showBackend && (
                <button
                  onClick={() => setActiveTab('backend')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'backend' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <Database className="w-4 h-4 inline mr-1" />
                  Backend
                </button>
              )}
              {settings.showTests && (
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'tests' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <TestTube className="w-4 h-4 inline mr-1" />
                  Tests
                </button>
              )}
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'preview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-1" />
                Preview
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'frontend' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                    <span className="text-sm font-medium">Frontend Code</span>
                    <button
                      onClick={() => copyToClipboard(state.frontendCode, 'frontend')}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                    >
                      {copied === 'frontend' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 text-sm bg-gray-900 text-green-400">
                    <code>{state.frontendCode || '// No code generated yet. Click "Generate" to create code.'}</code>
                  </pre>
                </div>
              )}

              {activeTab === 'backend' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                    <span className="text-sm font-medium">Backend Code</span>
                    <button
                      onClick={() => copyToClipboard(state.backendCode, 'backend')}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                    >
                      {copied === 'backend' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 text-sm bg-gray-900 text-green-400">
                    <code>{state.backendCode || '// No backend code generated yet.'}</code>
                  </pre>
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                    <span className="text-sm font-medium">Test Code</span>
                    <button
                      onClick={() => copyToClipboard(state.testCode, 'tests')}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                    >
                      {copied === 'tests' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 text-sm bg-gray-900 text-green-400">
                    <code>{state.testCode || '// No test code generated yet.'}</code>
                  </pre>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="h-full">
                  <iframe
                    ref={previewRef}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
