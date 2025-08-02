import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '@/contexts/NavigationContext'
import { useDesign } from '@/contexts/DesignContext'
import { 
  FileText, 
  Folder, 
  FolderOpen,
  File,
  Search,
  GitBranch,
  Bug,
  ChevronRight,
  ChevronDown,
  Plus,
  Code,
  Palette,
  Database,
  Globe,
  Zap,
  Download,
  Play,
  Layout
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  language?: string
  children?: FileNode[]
  isOpen?: boolean
}

interface EditorTab {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirty: boolean
}

export function CodeMode() {
  const { navigateToMode } = useNavigation()
  const { components, screens, logicNodes, connections } = useDesign()
  const [activeTab, setActiveTab] = useState<string | null>('App.tsx')
  const [sidebarWidth] = useState(280)
  const [activePanel, setActivePanel] = useState<'explorer' | 'search' | 'git' | 'debug'>('explorer')
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<FileNode[]>([])
  const [generationMessage, setGenerationMessage] = useState('')

  // Generate code from Design and Logic modes
  const generateCodeFromDesign = useCallback(() => {
    // Check if files already exist
    if (generatedFiles.length > 0) {
      setGenerationMessage('Code already generated! Use "Regenerate" to create new code.')
      setTimeout(() => setGenerationMessage(''), 3000)
      return
    }

    setIsGenerating(true)
    setGenerationMessage('')
    
    // Simulate generation time
    setTimeout(() => {
      const newFiles: FileNode[] = []
      
      // Generate React components from Design Mode
      if (components.length > 0 || logicNodes.length > 0) {
        // Generate main App component with all components and logic in one file
        const appComponent = generateAppComponent(components, screens, logicNodes, connections)
        newFiles.push({
          id: 'app-component',
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx',
          language: 'typescript',
          content: appComponent
        })

        // Generate a single components file with all components and their logic
        const allComponentsCode = generateAllComponentsCode(components, logicNodes, connections)
        newFiles.push({
          id: 'all-components',
          name: 'components.tsx',
          type: 'file',
          path: '/src/components.tsx',
          language: 'typescript',
          content: allComponentsCode
        })

        // Generate styles
        const stylesCode = generateStylesCode(components)
        newFiles.push({
          id: 'styles',
          name: 'styles.css',
          type: 'file',
          path: '/src/styles.css',
          language: 'css',
          content: stylesCode
        })

        // Generate main.tsx
        const mainTsx = generateMainTsx()
        newFiles.push({
          id: 'main-tsx',
          name: 'main.tsx',
          type: 'file',
          path: '/src/main.tsx',
          language: 'typescript',
          content: mainTsx
        })

        // Generate package.json
        const packageJson = generatePackageJson()
        newFiles.push({
          id: 'package-json',
          name: 'package.json',
          type: 'file',
          path: '/package.json',
          language: 'json',
          content: packageJson
        })

        // Generate index.html
        const indexHtml = generateIndexHtml()
        newFiles.push({
          id: 'index-html',
          name: 'index.html',
          type: 'file',
          path: '/index.html',
          language: 'html',
          content: indexHtml
        })

        // Generate vite.config.ts
        const viteConfig = generateViteConfig()
        newFiles.push({
          id: 'vite-config',
          name: 'vite.config.ts',
          type: 'file',
          path: '/vite.config.ts',
          language: 'typescript',
          content: viteConfig
        })

        // Generate tsconfig.json
        const tsConfig = generateTsConfig()
        newFiles.push({
          id: 'ts-config',
          name: 'tsconfig.json',
          type: 'file',
          path: '/tsconfig.json',
          language: 'json',
          content: tsConfig
        })
      }

      setGeneratedFiles(newFiles)
      
      // Update fileExplorer by replacing existing files or adding new ones
      setFileExplorer(prev => {
        const existingFiles = prev.filter(file => !newFiles.some(newFile => newFile.id === file.id))
        return [...existingFiles, ...newFiles]
      })
      
      setIsGenerating(false)
      setGenerationMessage('Code generated successfully!')
      setTimeout(() => setGenerationMessage(''), 3000)
    }, 2000)
  }, [components, screens, logicNodes, connections, generatedFiles.length])

  const regenerateCode = useCallback(() => {
    // Clear existing generated files
    setGeneratedFiles([])
    setGenerationMessage('')
    
    // Remove generated files from fileExplorer
    setFileExplorer(prev => prev.filter(file => 
      !['app-component', 'all-components', 'styles', 'main-tsx', 'package-json', 'index-html', 'vite-config', 'ts-config'].includes(file.id)
    ))
    
    // Close any open tabs of generated files
    setTabs(prev => prev.filter(tab => 
      !['app-component', 'all-components', 'styles', 'main-tsx', 'package-json', 'index-html', 'vite-config', 'ts-config'].includes(tab.id)
    ))
    
    // Generate new code
    generateCodeFromDesign()
  }, [generateCodeFromDesign])

  const generateAppComponent = (components: any[], screens: any[], logicNodes: any[], connections: any[]): string => {
    // Generate logic functions based on connections
    const logicFunctions = generateLogicFunctions(logicNodes, connections)
    
    // Generate component JSX with event handlers
    const componentJSX = components.map(comp => {
      const componentLogic = logicNodes.find(node => node.type === 'component' && node.componentId === comp.id)
      const eventHandlers = componentLogic ? generateEventHandlers(componentLogic, connections, logicNodes) : ''
      
      return `
        <div 
          key="${comp.id}"
          className="${comp.props?.className || ''}"
          style={{
            position: 'absolute',
            left: ${comp.position.x}px,
            top: ${comp.position.y}px,
            width: ${comp.size.width}px,
            height: ${comp.size.height}px,
            backgroundColor: '${comp.backgroundColor || 'transparent'}',
            zIndex: ${comp.zIndex || 1}
          }}
          ${eventHandlers}
        >
          ${generateComponentContent(comp)}
        </div>
      `
    }).join('\n')

    return `import React, { useState, useEffect } from 'react'
import './styles.css'

${logicFunctions}

export default function App() {
  const [state, setState] = useState({
    // Add state variables based on logic nodes
    ${generateStateVariables(logicNodes)}
  })

  return (
    <div className="app">
      <div className="screen-container">
        ${componentJSX}
      </div>
    </div>
  )
}`
  }

  const generateAllComponentsCode = (components: any[], logicNodes: any[], connections: any[]): string => {
    const componentExports = components.map(comp => comp.name).join(', ')
    
    // Get screen type for responsive design
    const screenType = screens.length > 0 ? screens[0].type : 'desktop'
    
    const componentDefinitions = components.map(component => {
      const props = component.logic ? generateLogicProps(component.logic) : ''
      const interactions = component.logic ? generateLogicInteractions(component.logic) : ''
      const styling = component.backgroundColor ? ` style={{ backgroundColor: '${component.backgroundColor}' }}` : ''

      // Generate different content based on component type and screen type
      let componentContent = ''
      switch (component.type) {
        case 'button':
          const buttonClasses = screenType === 'mobile' 
            ? "w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base"
            : "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          componentContent = `<button${props} className="${buttonClasses}">
            ${component.name}
          </button>`
          break
        case 'input':
          const inputClasses = screenType === 'mobile'
            ? "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            : "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          componentContent = `<input type="text" placeholder="${component.name}" className="${inputClasses}" />`
          break
        case 'text':
          const textClasses = screenType === 'mobile'
            ? "text-lg font-semibold text-gray-900"
            : "text-xl font-semibold text-gray-900"
          componentContent = `<h3 className="${textClasses}">${component.name}</h3>
          <p className="text-gray-600 ${screenType === 'mobile' ? 'text-sm' : ''}">This is a ${component.type} component with custom content.</p>`
          break
        case 'image':
          const imageClasses = screenType === 'mobile'
            ? "w-full h-32 object-cover rounded-lg"
            : "w-full h-48 object-cover rounded"
          componentContent = `<img src="https://via.placeholder.com/300x200/3b82f6/ffffff?text=${component.name}" alt="${component.name}" className="${imageClasses}" />`
          break
        case 'form':
          const formClasses = screenType === 'mobile' ? "space-y-4 max-w-none" : "space-y-4 max-w-md"
          const formInputClasses = screenType === 'mobile'
            ? "mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            : "mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          const formButtonClasses = screenType === 'mobile'
            ? "w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base"
            : "w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          componentContent = `<form className="${formClasses}">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" className="${formInputClasses}" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" className="${formInputClasses}" />
            </div>
            <button type="submit" className="${formButtonClasses}">
              Submit
            </button>
          </form>`
          break
        case 'list':
          const listClasses = screenType === 'mobile' ? "space-y-2" : "space-y-2"
          const listItemClasses = screenType === 'mobile'
            ? "flex items-center p-3 bg-gray-50 rounded-lg"
            : "flex items-center p-2 bg-gray-50 rounded"
          componentContent = `<ul className="${listClasses}">
            <li className="${listItemClasses}">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              List item 1
            </li>
            <li className="${listItemClasses}">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              List item 2
            </li>
            <li className="${listItemClasses}">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              List item 3
            </li>
          </ul>`
          break
        case 'table':
          const tableClasses = screenType === 'mobile'
            ? "w-full border-collapse border border-gray-300 text-sm"
            : "w-full border-collapse border border-gray-300"
          const tableCellClasses = screenType === 'mobile'
            ? "border border-gray-300 px-2 py-2 text-xs"
            : "border border-gray-300 px-4 py-2"
          componentContent = `<div className="${screenType === 'mobile' ? 'overflow-x-auto' : ''}">
            <table className="${tableClasses}">
              <thead>
                <tr className="bg-gray-50">
                  <th className="${tableCellClasses} text-left">Name</th>
                  <th className="${tableCellClasses} text-left">Email</th>
                  <th className="${tableCellClasses} text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="${tableCellClasses}">John Doe</td>
                  <td className="${tableCellClasses}">john@example.com</td>
                  <td className="${tableCellClasses}">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                  </td>
                </tr>
                <tr>
                  <td className="${tableCellClasses}">Jane Smith</td>
                  <td className="${tableCellClasses}">jane@example.com</td>
                  <td className="${tableCellClasses}">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>`
          break
        default:
          const containerClasses = screenType === 'mobile'
            ? "p-4 border border-gray-200 rounded-lg"
            : "p-4 border border-gray-200 rounded"
          const titleClasses = screenType === 'mobile'
            ? "text-lg font-medium text-gray-900 mb-2"
            : "text-lg font-medium text-gray-900 mb-2"
          const defaultButtonClasses = screenType === 'mobile'
            ? "mt-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base"
            : "mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          componentContent = `<div className="${containerClasses}">
            <h3 className="${titleClasses}">${component.name}</h3>
            <p className="text-gray-600 ${screenType === 'mobile' ? 'text-sm' : ''}">This is a ${component.type} component with custom styling.</p>
            <button className="${defaultButtonClasses}" onclick="handleMobileButtonClick('${component.name}')">Click me</button>
          </div>`
      }

      return `export const ${component.name}: React.FC = () => {
${interactions}

  return (
    <div className="${component.type}-component"${styling}>
      ${componentContent}
    </div>
  );
};`
    }).join('\n\n')

    return `import React from 'react';

${componentDefinitions}

// Export all components
export { ${componentExports} };`
  }

  const generateMainTsx = (): string => {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
  }

  const generateViteConfig = (): string => {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})`
  }

  const generateTsConfig = (): string => {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`
  }

  const generateLogicProps = (logic: any): string => {
    if (!logic || !logic.actions) return ''
    
    const props = logic.actions.map((action: any) => {
      if (action.type === 'navigate') {
        return `onClick={() => {
          console.log('Navigating to: ${action.target}');
          // In a real app, this would use React Router
          alert('Navigation to: ${action.target}');
        }}`
      }
      if (action.type === 'api_call') {
        return `onClick={async () => {
          try {
            console.log('Making API call to: ${action.api.url}');
            const response = await fetch('${action.api.url}', {
              method: '${action.api.method}',
              headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            console.log('API Response:', data);
            alert('API call successful! Check console for details.');
          } catch (error) {
            console.error('API Error:', error);
            alert('API call failed. Check console for details.');
          }
        }}`
      }
      if (action.type === 'style') {
        return `onClick={() => {
          console.log('Applying style: ${action.style}');
          // In a real app, this would update component state
          alert('Style applied: ${action.style}');
        }}`
      }
      return ''
    }).filter(Boolean).join(' ')

    return props ? ` ${props}` : ''
  }

  const generateLogicInteractions = (logic: any): string => {
    if (!logic || !logic.triggers) return ''

    const interactions = logic.triggers.map((trigger: any) => {
      if (trigger.type === 'click') {
        return `  const handleClick = () => {
    console.log('${trigger.event} event triggered');
    // Add your click logic here
    alert('${trigger.event} event triggered!');
  };`
      }
      if (trigger.type === 'hover') {
        return `  const handleMouseEnter = () => {
    console.log('Hover effect triggered');
    // Add your hover logic here
  };`
      }
      return ''
    }).filter(Boolean).join('\n')

    return interactions
  }

  const generateStylesCode = (components: any[]): string => {
    const componentStyles = components.map(comp => {
      return `.${comp.type}-component {
  padding: 1rem;
  margin: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.${comp.type}-component:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}`
    }).join('\n\n')

    return `/* Generated styles for CTRL components */

.App {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

${componentStyles}

/* Global styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f9fafb;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}`
  }

  const generatePackageJson = (): string => {
    return `{
  "name": "ctrl-generated-app",
  "version": "1.0.0",
  "description": "Generated by CTRL - UI to Code Generator",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "vite --host"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}`
  }

  const generateIndexHtml = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CTRL Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  }

  const exportProject = () => {
    // Check if code has been generated
    if (generatedFiles.length === 0) {
      setGenerationMessage('No code generated yet! Please generate code first.')
      setTimeout(() => setGenerationMessage(''), 3000)
      return
    }

    // Create a ZIP file with all generated files
    createAndDownloadZip()
  }

  const createAndDownloadZip = async () => {
    try {
      // Create a simple project download without external ZIP library
      // Instead, we'll create individual files that can be downloaded
      
      // Create README content
      const readmeContent = `# CTRL Generated App

This project was generated using CTRL - UI to Code Generator.

## Features
- ${components.length} components from Design Mode
- ${components.filter(comp => comp.logic).length} components with Logic Mode connections
- Responsive design for ${screens.length > 0 ? screens[0].type : 'desktop'} devices
- Modern React + TypeScript + Vite setup

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open your browser and navigate to http://localhost:3000

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build

## Project Structure

${generatedFiles.map(file => `- \`${file.path}\` - ${file.name}`).join('\n')}

## Components

${components.map(comp => `- \`${comp.name}\` (${comp.type})${comp.logic ? ' - with logic connections' : ''}`).join('\n')}

## Screens

${screens.map(screen => `- \`${screen.name}\` (${screen.type})`).join('\n')}

## Technologies Used

- React 18
- TypeScript
- Vite
- Tailwind CSS (via CDN)

## Generated on

${new Date().toLocaleString()}

---

Happy coding! 🚀
`

      // Create .gitignore content
      const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
`

      // Create tsconfig.node.json content
      const tsconfigNodeContent = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`

      // Create a project manifest file
      const projectManifest = {
        name: 'ctrl-generated-app',
        version: '1.0.0',
        description: 'Generated by CTRL - UI to Code Generator',
        components: components.map(comp => ({
          name: comp.name,
          type: comp.type,
          hasLogic: !!comp.logic
        })),
        screens: screens.map(screen => ({
          name: screen.name,
          type: screen.type
        })),
        generatedFiles: generatedFiles.map(file => ({
          name: file.name,
          path: file.path,
          language: file.language
        })),
        generatedAt: new Date().toISOString()
      }

      // Download all files individually
      const downloadFile = (filename: string, content: string, type: string = 'text/plain') => {
        const blob = new Blob([content], { type })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      // Download all generated files
      generatedFiles.forEach(file => {
        if (file.content) {
          const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path
          const filename = filePath.split('/').pop() || file.name
          downloadFile(filename, file.content, getMimeType(file.language || 'text'))
        }
      })

      // Download additional project files
      downloadFile('README.md', readmeContent)
      downloadFile('.gitignore', gitignoreContent)
      downloadFile('tsconfig.node.json', tsconfigNodeContent)
      downloadFile('project-manifest.json', JSON.stringify(projectManifest, null, 2), 'application/json')

      // Show success message
      setGenerationMessage('Project files downloaded successfully! Check your downloads folder.')
      setTimeout(() => setGenerationMessage(''), 5000)

    } catch (error) {
      console.error('Error creating project files:', error)
      setGenerationMessage('Error creating project files. Please try again.')
      setTimeout(() => setGenerationMessage(''), 3000)
    }
  }

  const getMimeType = (language: string): string => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return 'text/javascript'
      case 'json':
        return 'application/json'
      case 'css':
        return 'text/css'
      case 'html':
        return 'text/html'
      default:
        return 'text/plain'
    }
  }

  const runProject = () => {
    if (generatedFiles.length === 0) return
    
    setPreviewLoading(true)
    
    // Create a complete HTML document with the generated code
    const htmlContent = createPreviewHTML()
    
    // Create a blob URL for the preview
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    
    // Show preview after a short delay to simulate loading
    setTimeout(() => {
      setShowPreview(true)
      setPreviewLoading(false)
      
      // Update terminal output
      const newOutput = [...terminalOutput, '$ npm run dev']
      newOutput.push('Starting development server...')
      newOutput.push('✓ Server running on http://localhost:3000')
      newOutput.push('✓ Project built successfully!')
      newOutput.push('✓ Preview opened in new window')
      newOutput.push('', '> ')
      setTerminalOutput(newOutput)
    }, 1500)
  }

  const createPreviewHTML = () => {
    // Find the generated files
    const appFile = generatedFiles.find(f => f.id === 'app-component')
    const componentsFile = generatedFiles.find(f => f.id === 'all-components')
    const stylesFile = generatedFiles.find(f => f.id === 'styles')
    
    if (!appFile?.content || !componentsFile?.content || !stylesFile?.content) {
      return '<html><body><h1>Error: Generated files not found or empty</h1></body></html>'
    }

    // Get the screen type from the first screen (or default to desktop)
    const screenType = screens.length > 0 ? screens[0].type : 'desktop'

    // Extract the component code from the generated files
    const componentsCode = componentsFile.content.replace('import React from \'react\';\n\n', '')
      .replace('\n\n// Export all components\nexport { ' + components.map(comp => comp.name).join(', ') + ' };', '')
    
    const appCode = appFile.content.replace('import React from \'react\';\nimport { ' + components.map(comp => comp.name).join(', ') + ' } from \'./components\';\nimport \'./styles.css\';\n\n', '')
      .replace('\n\nexport default App;', '')

    // Create a simple fallback HTML for components
    const fallbackHTML = components.map(component => {
      const styling = component.backgroundColor ? ` style="background-color: ${component.backgroundColor};"` : ''
      
      switch (component.type) {
        case 'button':
          const buttonClasses = screenType === 'mobile' 
            ? "mobile-button w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base"
            : "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          return `<div class="mobile-card ${component.type}-component mobile-touchable"${styling}>
                    <button class="${buttonClasses}" onclick="handleMobileButtonClick('${component.name}')">
                      ${component.name}
                    </button>
                  </div>`
        case 'input':
          const inputClasses = screenType === 'mobile'
            ? "mobile-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            : "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          return `<div class="mobile-card ${component.type}-component"${styling}>
                    <div class="mobile-form-group">
                      <label class="mobile-form-label">${component.name}</label>
                      <input type="text" placeholder="Enter ${component.name.toLowerCase()}..." class="${inputClasses}" onfocus="handleMobileInputFocus(this)" onblur="handleMobileInputBlur(this)" />
                    </div>
                  </div>`
        case 'text':
          const textClasses = screenType === 'mobile'
            ? "mobile-title"
            : "text-xl font-semibold text-gray-900"
          return `<div class="mobile-card ${component.type}-component mobile-touchable"${styling}>
                    <h3 class="${textClasses}">${component.name}</h3>
                    <p class="mobile-subtitle">This is a ${component.type} component with custom content and styling.</p>
                  </div>`
        case 'image':
          const imageClasses = screenType === 'mobile'
            ? "mobile-image"
            : "w-full h-48 object-cover rounded"
          return `<div class="mobile-card ${component.type}-component mobile-touchable"${styling}>
                    <img src="https://via.placeholder.com/300x200/3b82f6/ffffff?text=${component.name}" alt="${component.name}" class="${imageClasses}" onclick="handleMobileImageTap('${component.name}')" />
                  </div>`
        case 'form':
          const formClasses = screenType === 'mobile' ? "mobile-form" : "space-y-4 max-w-md"
          const formInputClasses = screenType === 'mobile'
            ? "mobile-input mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            : "mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          const formButtonClasses = screenType === 'mobile'
            ? "mobile-button w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base"
            : "w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          return `<div class="mobile-card ${component.type}-component"${styling}>
                    <form class="${formClasses}" onsubmit="handleMobileFormSubmit(event)">
                      <div class="mobile-form-group">
                        <label class="mobile-form-label">Name</label>
                        <input type="text" class="${formInputClasses}" onfocus="handleMobileInputFocus(this)" onblur="handleMobileInputBlur(this)" />
                      </div>
                      <div class="mobile-form-group">
                        <label class="mobile-form-label">Email</label>
                        <input type="email" class="${formInputClasses}" onfocus="handleMobileInputFocus(this)" onblur="handleMobileInputBlur(this)" />
                      </div>
                      <button type="submit" class="${formButtonClasses}">
                        Submit
                      </button>
                    </form>
                  </div>`
        default:
          const containerClasses = screenType === 'mobile'
            ? "mobile-card mobile-touchable"
            : "p-4 border border-gray-200 rounded"
          const titleClasses = screenType === 'mobile'
            ? "mobile-title"
            : "text-lg font-medium text-gray-900 mb-2"
          const defaultButtonClasses = screenType === 'mobile'
            ? "mobile-button mt-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base"
            : "mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          return `<div class="${containerClasses}"${styling}>
                    <h3 class="${titleClasses}">${component.name}</h3>
                    <p class="mobile-subtitle">This is a ${component.type} component with custom styling and interactions.</p>
                    <button class="${defaultButtonClasses}" onclick="handleMobileButtonClick('${component.name}')">Click me</button>
                  </div>`
      }
    }).join('\n')

    // Add mobile status bar for mobile preview
    const mobileStatusBar = screenType === 'mobile' ? `
      <div class="mobile-status-bar">
        <div class="time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="icons">
          <div style="width: 16px; height: 12px; border: 1px solid white; border-radius: 2px; position: relative;">
            <div style="position: absolute; left: 1px; top: 1px; width: 10px; height: 8px; background: white; border-radius: 1px;"></div>
          </div>
          <div class="battery"></div>
        </div>
      </div>
    ` : ''

    // Add mobile navigation bar for mobile preview
    const mobileNavBar = screenType === 'mobile' ? `
      <div class="mobile-nav-bar">
        <div class="mobile-nav-item active">
          <div class="mobile-nav-icon">🏠</div>
          <span>Home</span>
        </div>
        <div class="mobile-nav-item">
          <div class="mobile-nav-icon">🔍</div>
          <span>Search</span>
        </div>
        <div class="mobile-nav-item">
          <div class="mobile-nav-icon">📱</div>
          <span>Apps</span>
        </div>
        <div class="mobile-nav-item">
          <div class="mobile-nav-icon">👤</div>
          <span>Profile</span>
        </div>
      </div>
    ` : ''

    // Device-specific styles based on screen type
    const getDeviceStyles = () => {
      switch (screenType) {
        case 'mobile':
          return `
            .device-frame {
              width: 375px;
              height: 667px;
              border: 8px solid #1f2937;
              border-radius: 25px;
              background: #000;
              padding: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              position: relative;
              cursor: pointer;
              overflow: hidden;
            }
            .device-frame::before {
              content: '';
              position: absolute;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              width: 60px;
              height: 4px;
              background: #374151;
              border-radius: 2px;
              z-index: 10;
            }
            .device-screen {
              width: 100%;
              height: 100%;
              background: white;
              border-radius: 15px;
              overflow: hidden;
              position: relative;
              touch-action: pan-y pinch-zoom;
              -webkit-overflow-scrolling: touch;
            }
            .preview-content {
              padding: 0;
              height: 100%;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              background: white;
            }
            .fallback-container {
              display: flex;
              flex-direction: column;
              gap: 16px;
              padding: 16px;
              min-height: 100vh;
            }
            .App {
              max-width: none;
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background: white;
            }
            
            /* Mobile-specific interactive styles */
            .mobile-interactive {
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }
            
            /* Touch-friendly button styles */
            .mobile-button {
              min-height: 48px;
              padding: 14px 20px;
              font-size: 16px;
              border-radius: 12px;
              transition: all 0.2s ease;
              -webkit-tap-highlight-color: rgba(0,0,0,0.1);
              border: none;
              font-weight: 600;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .mobile-button:active {
              transform: scale(0.96);
              opacity: 0.8;
              box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            }
            
            /* Touch-friendly input styles */
            .mobile-input {
              min-height: 48px;
              padding: 14px 16px;
              font-size: 16px;
              border-radius: 12px;
              -webkit-appearance: none;
              -webkit-tap-highlight-color: transparent;
              border: 2px solid #e5e7eb;
              background: white;
              transition: all 0.2s ease;
            }
            
            .mobile-input:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              transform: scale(1.02);
            }
            
            /* Mobile scrollbar */
            .device-screen::-webkit-scrollbar {
              width: 4px;
            }
            
            .device-screen::-webkit-scrollbar-track {
              background: transparent;
            }
            
            .device-screen::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.2);
              border-radius: 2px;
            }
            
            /* Mobile touch feedback */
            .mobile-touchable {
              position: relative;
              overflow: hidden;
              border-radius: 12px;
              transition: all 0.2s ease;
            }
            
            .mobile-touchable:active {
              transform: scale(0.98);
              opacity: 0.8;
            }
            
            /* Mobile status bar */
            .mobile-status-bar {
              position: sticky;
              top: 0;
              left: 0;
              right: 0;
              height: 44px;
              background: #000;
              border-radius: 15px 15px 0 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 20px;
              font-size: 14px;
              color: white;
              z-index: 10;
              font-weight: 600;
            }
            
            .mobile-status-bar .time {
              font-weight: 700;
            }
            
            .mobile-status-bar .icons {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            
            .mobile-status-bar .battery {
              width: 24px;
              height: 12px;
              border: 1px solid white;
              border-radius: 3px;
              position: relative;
            }
            
            .mobile-status-bar .battery::after {
              content: '';
              position: absolute;
              right: -3px;
              top: 3px;
              width: 2px;
              height: 6px;
              background: white;
              border-radius: 0 1px 1px 0;
            }
            
            .mobile-status-bar .battery::before {
              content: '';
              position: absolute;
              left: 2px;
              top: 2px;
              width: 16px;
              height: 8px;
              background: white;
              border-radius: 1px;
            }
            
            /* Mobile navigation bar */
            .mobile-nav-bar {
              position: sticky;
              bottom: 0;
              left: 0;
              right: 0;
              height: 83px;
              background: rgba(255,255,255,0.95);
              backdrop-filter: blur(20px);
              border-top: 1px solid #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: space-around;
              padding-bottom: 20px;
              z-index: 10;
            }
            
            .mobile-nav-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              color: #6b7280;
              font-size: 10px;
              font-weight: 500;
              transition: color 0.2s ease;
            }
            
            .mobile-nav-item.active {
              color: #3b82f6;
            }
            
            .mobile-nav-icon {
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              transition: background-color 0.2s ease;
            }
            
            .mobile-nav-item.active .mobile-nav-icon {
              background: rgba(59, 130, 246, 0.1);
            }
            
            /* Mobile content area */
            .mobile-content {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              padding-bottom: 100px;
            }
            
            /* Mobile card styles */
            .mobile-card {
              background: white;
              border-radius: 16px;
              padding: 20px;
              margin-bottom: 16px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border: 1px solid #f3f4f6;
            }
            
            /* Mobile form styles */
            .mobile-form {
              background: white;
              border-radius: 16px;
              padding: 24px;
              margin-bottom: 16px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .mobile-form-group {
              margin-bottom: 20px;
            }
            
            .mobile-form-label {
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            
            /* Mobile image styles */
            .mobile-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            /* Mobile text styles */
            .mobile-title {
              font-size: 24px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 8px;
              line-height: 1.2;
            }
            
            .mobile-subtitle {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 16px;
              line-height: 1.5;
            }
            
            /* Mobile spacing */
            .mobile-section {
              margin-bottom: 24px;
            }
            
            /* Mobile safe area */
            .mobile-safe-area {
              padding-top: env(safe-area-inset-top);
              padding-bottom: env(safe-area-inset-bottom);
            }`
        case 'tablet':
          return `
            .device-frame {
              width: 768px;
              height: 1024px;
              border: 12px solid #1f2937;
              border-radius: 20px;
              background: #000;
              padding: 30px;
              box-shadow: 0 25px 50px rgba(0,0,0,0.3);
              position: relative;
            }
            .device-frame::before {
              content: '';
              position: absolute;
              top: 15px;
              left: 50%;
              transform: translateX(-50%);
              width: 80px;
              height: 6px;
              background: #374151;
              border-radius: 3px;
            }
            .device-screen {
              width: 100%;
              height: 100%;
              background: white;
              border-radius: 12px;
              overflow: hidden;
            }
            .preview-content {
              padding: 20px;
              height: 100%;
              overflow-y: auto;
            }
            .fallback-container {
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              padding: 15px;
            }
            .App {
              max-width: none;
              margin: 0;
              padding: 1.5rem;
            }`
        default: // desktop
          return `
            .device-frame {
              width: 100%;
              height: 100%;
              border: none;
              background: transparent;
              padding: 0;
              box-shadow: none;
            }
            .device-screen {
              width: 100%;
              height: 100%;
              background: white;
              border-radius: 0;
              overflow: hidden;
            }
            .preview-content {
              padding: 20px;
              height: 100%;
              overflow-y: auto;
            }
            .fallback-container {
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
              padding: 20px;
            }
            .App {
              max-width: 1200px;
              margin: 0 auto;
              padding: 2rem;
            }`
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>CTRL Generated App - Preview (${screenType})</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        ${stylesFile.content}
        
        /* Preview specific styles */
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            ${screenType === 'mobile' ? '-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;' : ''}
        }
        
        .preview-header {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
        }
        
        .preview-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
        
        .preview-close {
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .preview-close:hover {
            background: #dc2626;
        }
        
        .preview-container {
            width: 100%;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding-top: 80px;
        }
        
        /* Device frame styles */
        ${getDeviceStyles()}
        
        /* Error handling */
        .preview-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 20px;
            border-radius: 8px;
            margin: 20px;
        }
        
        .preview-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6b7280;
        }
        
        /* Component specific styles */
        .button-component button {
            transition: all 0.2s ease;
        }
        
        .input-component input {
            transition: all 0.2s ease;
        }
        
        .form-component form {
            max-width: 400px;
        }
        
        .table-component table {
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <div class="preview-title">CTRL Generated App Preview - ${screenType.charAt(0).toUpperCase() + screenType.slice(1)}</div>
        <button class="preview-close" onclick="window.close()">Close Preview</button>
    </div>
    
    <div class="preview-container">
        <div class="device-frame">
            <div class="device-screen">
                ${mobileStatusBar}
                <div id="root" class="mobile-interactive mobile-content">
                    <div class="fallback-container">
                        <h2 style="grid-column: 1 / -1; text-align: center; margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Generated Components Preview</h2>
                        ${fallbackHTML}
                    </div>
                </div>
                ${mobileNavBar}
            </div>
        </div>
    </div>

    <script>
        // Mobile interaction handlers
        function handleMobileButtonClick(componentName) {
            console.log('Mobile button clicked:', componentName);
            // Add haptic feedback simulation
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            // Show mobile-style alert
            showMobileAlert('Button clicked: ' + componentName);
        }
        
        function handleMobileInputFocus(input) {
            console.log('Mobile input focused');
            input.style.transform = 'scale(1.02)';
            input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
            // Scroll to input if needed
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        function handleMobileInputBlur(input) {
            console.log('Mobile input blurred');
            input.style.transform = 'scale(1)';
            input.style.boxShadow = '';
        }
        
        function handleMobileImageTap(imageName) {
            console.log('Mobile image tapped:', imageName);
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
            showMobileAlert('Image tapped: ' + imageName);
        }
        
        function handleMobileFormSubmit(event) {
            event.preventDefault();
            console.log('Mobile form submitted');
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
            showMobileAlert('Form submitted successfully!');
        }
        
        function showMobileAlert(message) {
            // Create mobile-style alert
            const alert = document.createElement('div');
            alert.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 20px 30px;
                border-radius: 16px;
                font-size: 16px;
                font-weight: 600;
                z-index: 10000;
                max-width: 80%;
                text-align: center;
                animation: mobileAlertIn 0.3s ease-out;
                backdrop-filter: blur(10px);
            \`;
            alert.textContent = message;
            document.body.appendChild(alert);
            
            setTimeout(() => {
                alert.style.animation = 'mobileAlertOut 0.3s ease-in';
                setTimeout(() => {
                    document.body.removeChild(alert);
                }, 300);
            }, 2000);
        }
        
        // Mobile navigation functionality
        function handleMobileNavClick(navItem) {
            // Remove active class from all nav items
            document.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            // Add active class to clicked item
            navItem.classList.add('active');
            
            // Simulate navigation
            const navText = navItem.querySelector('span').textContent;
            showMobileAlert('Navigated to: ' + navText);
            
            // Add haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(20);
            }
        }
        
        // Add click handlers to navigation items
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.addEventListener('click', () => handleMobileNavClick(item));
            });
        });
        
        // Mobile scroll behavior
        let isScrolling = false;
        let scrollTimeout;
        
        function handleMobileScroll() {
            if (!isScrolling) {
                isScrolling = true;
                document.body.style.overflow = 'hidden';
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                document.body.style.overflow = 'auto';
            }, 150);
        }
        
        // Add scroll listener
        document.addEventListener('scroll', handleMobileScroll, { passive: true });
        
        // Mobile touch gestures
        let touchStartY = 0;
        let touchEndY = 0;
        
        function handleTouchStart(e) {
            touchStartY = e.touches[0].clientY;
        }
        
        function handleTouchEnd(e) {
            touchEndY = e.changedTouches[0].clientY;
            handleSwipe();
        }
        
        function handleSwipe() {
            const swipeDistance = touchStartY - touchEndY;
            const minSwipeDistance = 50;
            
            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    console.log('Swiped up');
                    // Could trigger pull-to-refresh or other actions
                } else {
                    console.log('Swiped down');
                    // Could trigger navigation or other actions
                }
            }
        }
        
        // Add touch listeners
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Update time in status bar
        function updateTime() {
            const timeElement = document.querySelector('.mobile-status-bar .time');
            if (timeElement) {
                timeElement.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
        }
        
        // Update time every minute
        setInterval(updateTime, 60000);
        
        // Initial time update
        updateTime();
        
        // Add mobile alert animations and mobile-specific styles
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes mobileAlertIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes mobileAlertOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            
            /* Prevent zoom on double tap */
            * {
                touch-action: manipulation;
            }
            
            /* Smooth scrolling */
            html {
                scroll-behavior: smooth;
            }
            
            /* Mobile-specific focus styles */
            .mobile-input:focus,
            .mobile-button:focus {
                outline: none;
            }
            
            /* Mobile card hover effects */
            .mobile-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            /* Mobile navigation hover effects */
            .mobile-nav-item:hover {
                transform: scale(1.05);
            }
        \`;
        document.head.appendChild(style);
    </script>

    <script type="text/babel">
        console.log('Starting preview compilation...');
        console.log('Screen type: ${screenType}');
        
        // Set a timeout to show fallback if React compilation takes too long
        const compilationTimeout = setTimeout(() => {
            console.log('React compilation timeout - keeping fallback display');
        }, 3000);
        
        try {
            // Generated Components
            ${componentsCode}
            
            // Generated App
            ${appCode}
            
            console.log('Components and App compiled successfully');
            console.log('Available components:', [${components.map(comp => comp.name).join(', ')}]);
            
            // Clear timeout since compilation succeeded
            clearTimeout(compilationTimeout);
            
            // Simple error boundary
            class PreviewErrorBoundary extends React.Component {
                constructor(props) {
                    super(props);
                    this.state = { hasError: false, error: null };
                }
                
                static getDerivedStateFromError(error) {
                    console.error('Error boundary caught error:', error);
                    return { hasError: true, error };
                }
                
                componentDidCatch(error, errorInfo) {
                    console.error('Preview Error:', error, errorInfo);
                }
                
                render() {
                    if (this.state.hasError) {
                        return React.createElement('div', {
                            className: 'preview-error'
                        }, [
                            React.createElement('h3', { key: 'title' }, 'Preview Error'),
                            React.createElement('p', { key: 'error' }, this.state.error?.message || 'Unknown error'),
                            React.createElement('button', {
                                key: 'retry',
                                onClick: () => this.setState({ hasError: false, error: null }),
                                style: {
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }
                            }, 'Retry')
                        ]);
                    }
                    
                    return this.props.children;
                }
            }
            
            // Render the app
            console.log('Attempting to render App component...');
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(
                React.createElement(PreviewErrorBoundary, null,
                    React.createElement(App)
                )
            );
            console.log('App rendered successfully');
            
        } catch (error) {
            console.error('Failed to compile or render preview:', error);
            clearTimeout(compilationTimeout);
            // Keep the fallback HTML that's already displayed
        }
    </script>
</body>
</html>`
  }

  const closePreview = () => {
    setShowPreview(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }
  const [fileExplorer, setFileExplorer] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      path: '/src',
      isOpen: true,
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          isOpen: false,
          children: [
            {
              id: '3',
              name: 'Button.tsx',
              type: 'file',
              path: '/src/components/Button.tsx',
              language: 'typescript',
              content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md'
}) => {
  return (
    <button
      onClick={onClick}
      className={\`btn-\${variant} btn-\${size}\`}
    >
      {children}
    </button>
  );
};`
            }
          ]
        },
        {
          id: '4',
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx',
          language: 'typescript',
          content: `import React from 'react';
import { Button } from './components/Button';

function App() {
  return (
    <div className="App">
      <h1>Welcome to CTRL</h1>
      <Button onClick={() => console.log('Hello!')}>
        Click me
      </Button>
    </div>
  );
}

export default App;`
        }
      ]
    },
    {
      id: '5',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      language: 'json',
      content: `{
  "name": "ctrl-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}`
    }
  ])
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Welcome to CTRL Code Mode Terminal',
    'Type "help" for available commands',
    '',
    '> '
  ])
  const [terminalInput, setTerminalInput] = useState('')
  const [showTerminal, setShowTerminal] = useState(false)
  const [showProblems] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [problems] = useState([
    { id: '1', type: 'error', message: 'Cannot find module \'./components/Button\'', file: 'App.tsx', line: 2 },
    { id: '2', type: 'warning', message: 'Unused variable \'variant\'', file: 'Button.tsx', line: 8 }
  ])

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{file: string, line: number, content: string}>>([])

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results: Array<{file: string, line: number, content: string}> = []
    
    // Search in all files
    const allFiles = [...fileExplorer, ...generatedFiles]
    allFiles.forEach(file => {
      if (file.type === 'file' && file.content) {
        const lines = file.content.split('\n')
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              file: file.name,
              line: index + 1,
              content: line.trim()
            })
          }
        })
      }
    })
    
    setSearchResults(results.slice(0, 20)) // Limit to 20 results
  }

  // Git/Source Control functionality
  const [gitStatus, setGitStatus] = useState({
    branch: 'main',
    changes: [
      { file: 'src/App.tsx', status: 'modified' },
      { file: 'src/components.tsx', status: 'new' },
      { file: 'package.json', status: 'modified' }
    ],
    staged: [] as Array<{file: string, status: string}>,
    unstaged: [] as Array<{file: string, status: string}>
  })

  const stageFile = (fileName: string) => {
    const file = gitStatus.changes.find(f => f.file === fileName)
    if (file) {
      setGitStatus(prev => ({
        ...prev,
        staged: [...prev.staged, file],
        changes: prev.changes.filter(f => f.file !== fileName)
      }))
    }
  }

  // Debug functionality
  const [debugConfig, setDebugConfig] = useState({
    breakpoints: [
      { file: 'src/App.tsx', line: 10, enabled: true },
      { file: 'src/components.tsx', line: 5, enabled: false }
    ],
    variables: [
      { name: 'components', value: 'Array(3)', type: 'array' },
      { name: 'screens', value: 'Array(1)', type: 'array' }
    ]
  })

  const openFile = (file: FileNode) => {
    if (file.type === 'file' && file.content) {
      const existingTab = tabs.find(tab => tab.path === file.path)
      if (!existingTab) {
        const newTab: EditorTab = {
          id: file.id,
          name: file.name,
          path: file.path,
          content: file.content,
          language: file.language || getLanguageFromFile(file.name),
          isDirty: false
        }
        setTabs(prev => [...prev, newTab])
        setActiveTab(file.id)
      } else {
        setActiveTab(existingTab.id)
      }
    }
  }

  const closeTab = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId))
    if (activeTab === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      setActiveTab(remainingTabs.length > 0 ? remainingTabs[0].id : null)
    }
  }

  const updateTabContent = (tabId: string, content: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, content, isDirty: true } : tab
    ))
  }

  const saveTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, isDirty: false } : tab
    ))
  }

  const toggleFolder = (folderId: string) => {
    const updateFolder = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === folderId) {
          return { ...node, isOpen: !node.isOpen }
        }
        if (node.children) {
          return { ...node, children: updateFolder(node.children) }
        }
        return node
      })
    }
    setFileExplorer(updateFolder(fileExplorer))
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ paddingLeft: level * 16 }}>
        <div 
          className={`flex items-center py-1 px-2 hover:bg-blue-50 cursor-pointer rounded ${
            activeTab === node.id ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
          }`}
          onClick={() => node.type === 'folder' ? toggleFolder(node.id) : openFile(node)}
        >
          {node.type === 'folder' ? (
            <>
              {node.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
            </>
          ) : (
            <File className="w-4 h-4 mr-2 text-gray-500" />
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === 'folder' && node.isOpen && node.children && (
          renderFileTree(node.children, level + 1)
        )}
      </div>
    ))
  }

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return <Code className="w-4 h-4" />
      case 'json':
        return <Database className="w-4 h-4" />
      case 'css':
        return <Palette className="w-4 h-4" />
      case 'html':
        return <Globe className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getLanguageFromFile = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'json':
        return 'json'
      case 'css':
        return 'css'
      case 'html':
        return 'html'
      case 'md':
        return 'markdown'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp'
      case 'c':
        return 'c'
      case 'php':
        return 'php'
      case 'rb':
        return 'ruby'
      case 'go':
        return 'go'
      case 'rs':
        return 'rust'
      case 'swift':
        return 'swift'
      case 'kt':
        return 'kotlin'
      case 'scala':
        return 'scala'
      case 'sql':
        return 'sql'
      case 'sh':
      case 'bash':
        return 'bash'
      case 'yaml':
      case 'yml':
        return 'yaml'
      case 'xml':
        return 'xml'
      default:
        return 'typescript'
    }
  }

  const handleTerminalCommand = (command: string) => {
    const newOutput = [...terminalOutput, `$ ${command}`]
    
    switch (command.toLowerCase()) {
      case 'help':
        newOutput.push('Available commands:')
        newOutput.push('  help - Show this help')
        newOutput.push('  ls - List files')
        newOutput.push('  npm install - Install dependencies')
        newOutput.push('  npm run dev - Start development server')
        newOutput.push('  clear - Clear terminal')
        break
      case 'ls':
        newOutput.push('src/')
        newOutput.push('package.json')
        newOutput.push('README.md')
        break
      case 'npm install':
        newOutput.push('Installing dependencies...')
        newOutput.push('✓ All dependencies installed successfully')
        break
      case 'npm run dev':
        newOutput.push('Starting development server...')
        newOutput.push('✓ Server running on http://localhost:3000')
        break
      case 'clear':
        setTerminalOutput(['Welcome to CTRL Code Mode Terminal', 'Type "help" for available commands', '', '> '])
        setTerminalInput('')
        return
      default:
        newOutput.push(`Command not found: ${command}`)
    }
    
    newOutput.push('', '> ')
    setTerminalOutput(newOutput)
    setTerminalInput('')
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault()
          navigateToMode('design')
          break
        case '2':
          e.preventDefault()
          navigateToMode('logic')
          break
        case '3':
          e.preventDefault()
          navigateToMode('code')
          break
        case 's':
          e.preventDefault()
          if (activeTab) saveTab(activeTab)
          break
        case '`':
          e.preventDefault()
          setShowTerminal(!showTerminal)
          break
      }
    }
  }, [navigateToMode, activeTab, showTerminal])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  // Helper functions for logic generation
  const generateLogicFunctions = (logicNodes: any[], connections: any[]): string => {
    let functions = ''
    
    // Generate functions for each logic node
    logicNodes.forEach(node => {
      if (node.type === 'trigger') {
        functions += `
  const handle${node.name.replace(/\s+/g, '')} = () => {
    // Trigger logic for ${node.name}
    console.log("Trigger activated")
  }`
      } else if (node.type === 'action') {
        functions += `
  const ${node.name.toLowerCase().replace(/\s+/g, '')} = () => {
    // Action: ${node.name}
    console.log("Action executed")
  }`
      } else if (node.type === 'api') {
        functions += `
  const ${node.name.toLowerCase().replace(/\s+/g, '')} = async () => {
    // API call: ${node.name}
    try {
      const response = await fetch('${node.data?.url || ''}', {
        method: '${node.data?.method || 'GET'}',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setState(prev => ({ ...prev, ${node.name.toLowerCase().replace(/\s+/g, '')}: data }))
    } catch (error) {
      console.error('API Error:', error)
    }
  }`
      }
    })
    
    return functions
  }

  const generateEventHandlers = (componentNode: any, connections: any[], logicNodes: any[]): string => {
    const outgoingConnections = connections.filter(conn => conn.from === componentNode.id)
    let handlers = ''
    
    outgoingConnections.forEach(conn => {
      const targetNode = logicNodes.find(node => node.id === conn.to)
      if (targetNode && targetNode.type === 'trigger') {
        handlers += `\n          onClick={handle${targetNode.name.replace(/\s+/g, '')}}`
      }
    })
    
    return handlers
  }

  const generateComponentContent = (component: any): string => {
    switch (component.type) {
      case 'button':
        return `<button className="w-full h-full flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          ${component.name}
        </button>`
      case 'input':
        return `<input 
          type="text" 
          placeholder="${component.name}"
          className="w-full h-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />`
      case 'image':
        return `<img 
          src="${component.props?.src || 'https://via.placeholder.com/150'}" 
          alt="${component.name}"
          className="w-full h-full object-cover rounded"
        />`
      default:
        return `<div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
          ${component.name}
        </div>`
    }
  }

  const generateStateVariables = (logicNodes: any[]): string => {
    const stateVars = logicNodes
      .filter(node => node.type === 'data' || node.type === 'api')
      .map(node => `${node.name.toLowerCase().replace(/\s+/g, '')}: null`)
      .join(',\n    ')
    
    return stateVars || '// No state variables needed'
  }

  // Code Editor Component with Syntax Highlighting
  const CodeEditor = ({ content, language, onChange }: { content: string; language: string; onChange: (value: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(content)

    const handleDoubleClick = () => {
      setIsEditing(true)
      setEditContent(content)
    }

    const handleSave = () => {
      onChange(editContent)
      setIsEditing(false)
    }

    const handleCancel = () => {
      setEditContent(content)
      setIsEditing(false)
    }

    // Prevent scroll propagation
    const handleScroll = (e: React.WheelEvent) => {
      e.stopPropagation()
    }

    const getLanguage = (lang: string) => {
      switch (lang) {
        case 'typescript':
        case 'ts':
        case 'tsx':
          return 'typescript'
        case 'javascript':
        case 'js':
        case 'jsx':
          return 'javascript'
        case 'json':
          return 'json'
        case 'css':
          return 'css'
        case 'html':
          return 'html'
        case 'markdown':
        case 'md':
          return 'markdown'
        case 'python':
        case 'py':
          return 'python'
        case 'java':
          return 'java'
        case 'cpp':
        case 'cc':
        case 'cxx':
          return 'cpp'
        case 'c':
          return 'c'
        case 'php':
          return 'php'
        case 'ruby':
        case 'rb':
          return 'ruby'
        case 'go':
          return 'go'
        case 'rust':
        case 'rs':
          return 'rust'
        case 'swift':
          return 'swift'
        case 'kotlin':
        case 'kt':
          return 'kotlin'
        case 'scala':
          return 'scala'
        case 'sql':
          return 'sql'
        case 'bash':
        case 'sh':
          return 'bash'
        case 'yaml':
        case 'yml':
          return 'yaml'
        case 'xml':
          return 'xml'
        default:
          return 'typescript'
      }
    }

    if (isEditing) {
      return (
        <div className="h-full flex flex-col">
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-sm">Editing {language} file</span>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onWheel={handleScroll}
            className="flex-1 bg-gray-900 text-white p-4 font-mono text-sm resize-none border-none outline-none"
            spellCheck={false}
            autoFocus
          />
        </div>
      )
    }

    return (
      <div className="h-full cursor-pointer" onDoubleClick={handleDoubleClick}>
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
          <span className="text-sm">{language.toUpperCase()}</span>
          <span className="text-xs text-gray-400">Double-click to edit</span>
        </div>
        <div className="h-full overflow-auto" onWheel={handleScroll}>
          <SyntaxHighlighter
            language={getLanguage(language)}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '14px',
              lineHeight: '1.5',
              backgroundColor: '#1e1e1e',
              height: '100%',
              overflow: 'auto'
            }}
            showLineNumbers={true}
            wrapLines={true}
            lineNumberStyle={{
              color: '#858585',
              fontSize: '12px',
              paddingRight: '1rem'
            }}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col font-['Inter'] font-semibold">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-gray-900 font-semibold">CTRL Code Editor</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={generateCodeFromDesign}
            disabled={isGenerating || components.length === 0}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate Code</span>
              </>
            )}
          </button>
          
          <button
            onClick={regenerateCode}
            disabled={generatedFiles.length === 0}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            <span>Regenerate</span>
          </button>
          
          <button
            onClick={runProject}
            disabled={generatedFiles.length === 0}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span>Run Project</span>
          </button>
          
          <button
            onClick={exportProject}
            disabled={generatedFiles.length === 0}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        
        {/* Generation Message */}
        {generationMessage && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50">
            <div className={`px-4 py-2 rounded text-sm text-white ${
              generationMessage.includes('already generated') ? 'bg-yellow-600' : 'bg-green-600'
            }`}>
              {generationMessage}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div 
          className="bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden"
          style={{ width: sidebarWidth }}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'explorer', label: 'Explorer', icon: Folder },
              { id: 'search', label: 'Search', icon: Search },
              { id: 'git', label: 'Git', icon: GitBranch },
              { id: 'debug', label: 'Debug', icon: Bug }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as any)}
                className={`flex-1 flex items-center justify-center py-2 text-sm transition-colors ${
                  activePanel === tab.id 
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
            {activePanel === 'explorer' && (
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">EXPLORER</span>
                  <button className="text-gray-500 hover:text-gray-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Design Mode Status */}
                <div className="mb-4 p-2 bg-white border border-gray-200 rounded">
                  <div className="text-xs text-gray-500 mb-1">DESIGN MODE</div>
                  <div className="text-sm text-gray-900">
                    {components.length > 0 ? (
                      <span className="text-green-600">✓ {components.length} components ready</span>
                    ) : (
                      <span className="text-yellow-600">⚠ No components from Design Mode</span>
                    )}
                  </div>
                </div>
                
                {/* Logic Mode Status */}
                <div className="mb-4 p-2 bg-white border border-gray-200 rounded">
                  <div className="text-xs text-gray-500 mb-1">LOGIC MODE</div>
                  <div className="text-sm text-gray-900">
                    {logicNodes.length > 0 && connections.length > 0 ? (
                      <span className="text-green-600">✓ Logic connections configured ({logicNodes.length} nodes, {connections.length} connections)</span>
                    ) : (
                      <span className="text-yellow-600">⚠ No logic connections</span>
                    )}
                  </div>
                </div>
                
                {renderFileTree(fileExplorer)}
              </div>
            )}
            
            {activePanel === 'search' && (
              <div className="p-2">
                <div className="text-sm font-medium text-gray-900 mb-2">SEARCH</div>
                <input
                  type="text"
                  placeholder="Search in files..."
                  className="w-full px-2 py-1 text-sm bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      performSearch(searchQuery)
                    }
                  }}
                />
                <button
                  onClick={() => performSearch(searchQuery)}
                  className="mt-2 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Search
                </button>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Search Results</h3>
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-gray-500">No results found.</p>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded p-2 max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <div key={index} className="text-sm text-gray-900 mb-1">
                          <span className="text-gray-500">{result.file}:{result.line}</span>
                          <span className="ml-2 text-gray-700">{result.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activePanel === 'git' && (
              <div className="p-2">
                <div className="text-sm font-medium text-gray-900 mb-2">SOURCE CONTROL</div>
                <div className="text-sm text-gray-600">
                  <p>Branch: {gitStatus.branch}</p>
                  <p>Changes: {gitStatus.changes.length} unstaged, {gitStatus.staged.length} staged</p>
                  <p>Unstaged: {gitStatus.unstaged.length} files</p>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Changes</h3>
                  {gitStatus.changes.map((change, index) => (
                    <div key={index} className="flex items-center justify-between text-sm text-gray-700 mb-1">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 bg-yellow-500"></span>
                        {change.file} ({change.status})
                      </div>
                      <button
                        onClick={() => stageFile(change.file)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Stage
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Staged</h3>
                  {gitStatus.staged.map((staged, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700 mb-1">
                      <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
                      {staged.file}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Unstaged</h3>
                  {gitStatus.unstaged.map((unstaged, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700 mb-1">
                      <span className="w-2 h-2 rounded-full mr-2 bg-red-500"></span>
                      {unstaged.file}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activePanel === 'debug' && (
              <div className="p-2">
                <div className="text-sm font-medium text-gray-900 mb-2">RUN AND DEBUG</div>
                <button className="w-full px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 mb-4">
                  Start Debugging
                </button>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Breakpoints</h3>
                  {debugConfig.breakpoints.map((breakpoint, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700 mb-1">
                      <input
                        type="checkbox"
                        checked={breakpoint.enabled}
                        onChange={() => {
                          const newBreakpoints = [...debugConfig.breakpoints]
                          newBreakpoints[index].enabled = !breakpoint.enabled
                          setDebugConfig({...debugConfig, breakpoints: newBreakpoints})
                        }}
                        className="mr-2"
                      />
                      <span>{breakpoint.file}:{breakpoint.line}</span>
                    </div>
                  ))}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Variables</h3>
                  {debugConfig.variables.map((variable, index) => (
                    <div key={index} className="text-sm text-gray-700 mb-1">
                      <span className="text-blue-600">{variable.name}</span>
                      <span className="text-gray-500">: </span>
                      <span className="text-green-600">{variable.value}</span>
                      <span className="text-gray-500"> ({variable.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-gray-200 cursor-col-resize hover:bg-blue-500"
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden" onWheel={(e) => e.stopPropagation()}>
          {/* Editor Tabs */}
          <div className="bg-white border-b border-gray-200 flex items-center">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center px-4 py-2 border-r border-gray-200 cursor-pointer ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {getLanguageIcon(tab.language)}
                <span className="ml-2 text-sm">{tab.name}</span>
                {tab.isDirty && <span className="ml-2 text-blue-500">•</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 bg-white overflow-hidden">
              {activeTabData ? (
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Code Editor */}
                  <CodeEditor
                    content={activeTabData.content}
                    language={activeTabData.language}
                    onChange={(newContent) => updateTabContent(activeTabData.id, newContent)}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <p>No file open</p>
                    <p className="text-sm">Select a file from the explorer to start editing</p>
                  </div>
                </div>
              )}
            </div>

            {/* Problems Panel */}
            {showProblems && (
              <div className="w-80 bg-gray-50 border-l border-gray-200">
                <div className="p-2 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900">PROBLEMS</div>
                </div>
                <div className="p-2">
                  {problems.map(problem => (
                    <div key={problem.id} className="flex items-start mb-2">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-2 ${
                        problem.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{problem.message}</div>
                        <div className="text-xs text-gray-500">{problem.file}:{problem.line}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-64 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between p-2 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900">TERMINAL</div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="p-2 h-full overflow-y-auto">
                <div className="font-mono text-sm text-green-600">
                  {terminalOutput.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTerminalCommand(terminalInput)
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none text-green-600 font-mono text-sm"
                  placeholder="Type a command..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Preview Overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="ml-4 text-sm text-gray-600">CTRL Generated App Preview</span>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 relative">
              {previewLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading preview...</p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="CTRL Generated App Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Mode Navigation Buttons - Pill Style */}
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