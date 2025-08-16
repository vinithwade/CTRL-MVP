import { useState, useEffect } from 'react'
import { useDesign } from '@/contexts/DesignContext'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  EyeOff,
  RefreshCw
} from 'lucide-react'

interface DesignIssue {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  category: 'accessibility' | 'responsive' | 'performance' | 'usability' | 'code-quality'
  title: string
  description: string
  componentId?: string
  componentName?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestions: string[]
  autoFixable: boolean
  position?: { x: number; y: number }
}

interface ErrorDetectionProps {
  isVisible: boolean
  onToggle: () => void
}

export function ErrorDetection({ isVisible, onToggle }: ErrorDetectionProps) {
  const { components, screens } = useDesign()
  const [issues, setIssues] = useState<DesignIssue[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [filters, setFilters] = useState({
    showErrors: true,
    showWarnings: true,
    showInfo: true,
    showSuccess: true,
    categories: ['accessibility', 'responsive', 'performance', 'usability', 'code-quality']
  })

  // Auto-analyze when components change
  useEffect(() => {
    if (components.length > 0) {
      const timeoutId = setTimeout(() => {
        analyzeDesign()
      }, 500) // Debounce analysis

      return () => clearTimeout(timeoutId)
    }
  }, [components, screens])

  const analyzeDesign = () => {
    setIsAnalyzing(true)
    const newIssues: DesignIssue[] = []

    try {
      // 1. Accessibility Analysis
      analyzeAccessibility(newIssues)

      // 2. Responsive Design Analysis
      analyzeResponsiveDesign(newIssues)

      // 3. Performance Analysis
      analyzePerformance(newIssues)

      // 4. Usability Analysis
      analyzeUsability(newIssues)

      // 5. Code Quality Analysis
      analyzeCodeQuality(newIssues)

      // 6. Success Messages
      generateSuccessMessages(newIssues)

      setIssues(newIssues)
    } catch (error) {
      console.error('Error during design analysis:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeAccessibility = (issues: DesignIssue[]) => {
    // Check for missing alt text on images
    components.forEach(component => {
      if (component.type === 'image' && !component.props?.alt) {
        issues.push({
          id: `accessibility-${component.id}`,
          type: 'error',
          category: 'accessibility',
          title: 'Missing Alt Text',
          description: `Image component "${component.name}" is missing alt text, which is required for screen readers.`,
          componentId: component.id,
          componentName: component.name,
          severity: 'high',
          suggestions: [
            'Add descriptive alt text to the image',
            'Use meaningful text that describes the image content',
            'Consider the context and purpose of the image'
          ],
          autoFixable: true,
          position: component.position
        })
      }
    })

    // Check for proper heading hierarchy
    const headings = components.filter(c => c.type === 'text' && c.props?.heading)
    if (headings.length > 0) {
      const headingLevels = headings.map(h => h.props?.level || 1)
      const hasProperHierarchy = headingLevels.every((level, index) => 
        index === 0 || level <= headingLevels[index - 1] + 1
      )
      
      if (!hasProperHierarchy) {
        issues.push({
          id: 'accessibility-heading-hierarchy',
          type: 'warning',
          category: 'accessibility',
          title: 'Improper Heading Hierarchy',
          description: 'Heading levels should follow a logical hierarchy (h1 → h2 → h3, etc.).',
          severity: 'medium',
          suggestions: [
            'Ensure heading levels follow a logical sequence',
            'Don\'t skip heading levels (e.g., h1 → h3)',
            'Use h1 for the main page heading only'
          ],
          autoFixable: false
        })
      }
    }

    // Check for color contrast issues
    components.forEach(component => {
      if (component.backgroundColor) {
        const contrast = calculateColorContrast(component.backgroundColor, '#ffffff')
        if (contrast < 4.5) {
          issues.push({
            id: `accessibility-contrast-${component.id}`,
            type: 'warning',
            category: 'accessibility',
            title: 'Low Color Contrast',
            description: `Component "${component.name}" has low color contrast (${contrast.toFixed(2)}:1).`,
            componentId: component.id,
            componentName: component.name,
            severity: 'medium',
            suggestions: [
              'Increase the contrast ratio to at least 4.5:1',
              'Use darker text on light backgrounds',
              'Use lighter text on dark backgrounds'
            ],
            autoFixable: false,
            position: component.position
          })
        }
      }
    })
  }

  const analyzeResponsiveDesign = (issues: DesignIssue[]) => {
    // Check for components that might be too wide for mobile
    components.forEach(component => {
      if (component.size && component.size.width > 400) {
        issues.push({
          id: `responsive-width-${component.id}`,
          type: 'warning',
          category: 'responsive',
          title: 'Component May Be Too Wide',
          description: `Component "${component.name}" has a width of ${component.size.width}px, which may not fit well on mobile devices.`,
          componentId: component.id,
          componentName: component.name,
          severity: 'medium',
          suggestions: [
            'Consider using responsive units (%, vw, vh)',
            'Add media queries for mobile breakpoints',
            'Use flexbox or grid for better responsive behavior'
          ],
          autoFixable: false,
          position: component.position
        })
      }
    })

    // Check for overlapping components
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i]
        const comp2 = components[j]
        
        if (componentsOverlap(comp1, comp2)) {
          issues.push({
            id: `responsive-overlap-${comp1.id}-${comp2.id}`,
            type: 'error',
            category: 'responsive',
            title: 'Components Overlapping',
            description: `Components "${comp1.name}" and "${comp2.name}" are overlapping, which may cause layout issues.`,
            componentId: comp1.id,
            componentName: `${comp1.name} & ${comp2.name}`,
            severity: 'high',
            suggestions: [
              'Adjust the positioning of overlapping components',
              'Use proper z-index values to control layering',
              'Consider using CSS Grid or Flexbox for layout'
            ],
            autoFixable: false,
            position: comp1.position
          })
        }
      }
    }
  }

  const analyzePerformance = (issues: DesignIssue[]) => {
    // Check for too many components (performance concern)
    if (components.length > 50) {
      issues.push({
        id: 'performance-too-many-components',
        type: 'warning',
        category: 'performance',
        title: 'Too Many Components',
        description: `The design has ${components.length} components, which may impact performance.`,
        severity: 'medium',
        suggestions: [
          'Consider breaking the design into smaller sections',
          'Use component virtualization for large lists',
          'Implement lazy loading for non-critical components'
        ],
        autoFixable: false
      })
    }

    // Check for large images
    const imageComponents = components.filter(c => c.type === 'image')
    imageComponents.forEach(img => {
      if (img.size && (img.size.width > 800 || img.size.height > 600)) {
        issues.push({
          id: `performance-large-image-${img.id}`,
          type: 'warning',
          category: 'performance',
          title: 'Large Image Detected',
          description: `Image "${img.name}" has dimensions ${img.size.width}x${img.size.height}px, which may impact loading performance.`,
          componentId: img.id,
          componentName: img.name,
          severity: 'medium',
          suggestions: [
            'Optimize image size and format',
            'Use responsive images with srcset',
            'Consider lazy loading for images below the fold'
          ],
          autoFixable: false,
          position: img.position
        })
      }
    })
  }

  const analyzeUsability = (issues: DesignIssue[]) => {
    // Check for missing interactive elements
    const hasButtons = components.some(c => c.type === 'button')
    const hasInputs = components.some(c => c.type === 'input')
    const hasForms = components.some(c => c.type === 'form')

    if (!hasButtons && !hasInputs && !hasForms) {
      issues.push({
        id: 'usability-no-interactive-elements',
        type: 'info',
        category: 'usability',
        title: 'No Interactive Elements',
        description: 'The design lacks interactive elements like buttons, inputs, or forms.',
        severity: 'low',
        suggestions: [
          'Consider adding buttons for user actions',
          'Include form inputs for data collection',
          'Add navigation elements for better user experience'
        ],
        autoFixable: false
      })
    }

    // Check for proper spacing
    const spacingIssues = findSpacingIssues(components)
    spacingIssues.forEach(issue => {
      issues.push({
        id: `usability-spacing-${issue.componentId}`,
        type: 'warning',
        category: 'usability',
        title: 'Poor Spacing',
        description: `Component "${issue.componentName}" has poor spacing that may affect usability.`,
        componentId: issue.componentId,
        componentName: issue.componentName,
        severity: 'low',
        suggestions: [
          'Add consistent spacing between components',
          'Use a design system for spacing values',
          'Consider the visual hierarchy and breathing room'
        ],
        autoFixable: false,
        position: issue.position
      })
    })
  }

  const analyzeCodeQuality = (issues: DesignIssue[]) => {
    // Check for components without proper naming
    components.forEach(component => {
      if (!component.name || component.name === 'Component' || component.name.length < 3) {
        issues.push({
          id: `code-quality-naming-${component.id}`,
          type: 'warning',
          category: 'code-quality',
          title: 'Poor Component Naming',
          description: `Component "${component.name}" has a generic or unclear name.`,
          componentId: component.id,
          componentName: component.name,
          severity: 'low',
          suggestions: [
            'Use descriptive, semantic names for components',
            'Follow naming conventions (PascalCase for components)',
            'Include the component type in the name'
          ],
          autoFixable: false,
          position: component.position
        })
      }
    })

    // Check for missing props
    const componentsWithoutProps = components.filter(c => !c.props || Object.keys(c.props).length === 0)
    if (componentsWithoutProps.length > 0) {
      issues.push({
        id: 'code-quality-missing-props',
        type: 'info',
        category: 'code-quality',
        title: 'Components Without Props',
        description: `${componentsWithoutProps.length} components lack configuration props.`,
        severity: 'low',
        suggestions: [
          'Add props for component customization',
          'Consider making components more configurable',
          'Use TypeScript interfaces for prop definitions'
        ],
        autoFixable: false
      })
    }
  }

  const generateSuccessMessages = (issues: DesignIssue[]) => {
    // Add success messages for good practices
    const hasProperStructure = components.length > 0 && screens.length > 0
    if (hasProperStructure) {
      issues.push({
        id: 'success-structure',
        type: 'success',
        category: 'usability',
        title: 'Good Project Structure',
        description: 'The design has a proper structure with components and screens.',
        severity: 'low',
        suggestions: [],
        autoFixable: false
      })
    }

    const hasInteractiveElements = components.some(c => ['button', 'input', 'form'].includes(c.type))
    if (hasInteractiveElements) {
      issues.push({
        id: 'success-interactive',
        type: 'success',
        category: 'usability',
        title: 'Interactive Elements Present',
        description: 'The design includes interactive elements for user engagement.',
        severity: 'low',
        suggestions: [],
        autoFixable: false
      })
    }
  }

  // Helper functions
  const calculateColorContrast = (bgColor: string, textColor: string): number => {
    // Simplified contrast calculation
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    const bg = hexToRgb(bgColor)
    const text = hexToRgb(textColor)

    if (!bg || !text) return 1

    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const bgLuminance = getLuminance(bg.r, bg.g, bg.b)
    const textLuminance = getLuminance(text.r, text.g, text.b)

    const lighter = Math.max(bgLuminance, textLuminance)
    const darker = Math.min(bgLuminance, textLuminance)

    return (lighter + 0.05) / (darker + 0.05)
  }

  const componentsOverlap = (comp1: any, comp2: any): boolean => {
    if (!comp1.position || !comp2.position || !comp1.size || !comp2.size) return false

    return !(
      comp1.position.x + comp1.size.width < comp2.position.x ||
      comp2.position.x + comp2.size.width < comp1.position.x ||
      comp1.position.y + comp1.size.height < comp2.position.y ||
      comp2.position.y + comp2.size.height < comp1.position.y
    )
  }

  const findSpacingIssues = (components: any[]) => {
    const issues = []
    const minSpacing = 20

    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i]
        const comp2 = components[j]

        if (comp1.position && comp2.position) {
          const distance = Math.sqrt(
            Math.pow(comp1.position.x - comp2.position.x, 2) +
            Math.pow(comp1.position.y - comp2.position.y, 2)
          )

          if (distance < minSpacing && distance > 0) {
            issues.push({
              componentId: comp2.id,
              componentName: comp2.name,
              position: comp2.position
            })
          }
        }
      }
    }

    return issues
  }

  const getFilteredIssues = () => {
    return issues.filter(issue => {
      if (!filters.showErrors && issue.type === 'error') return false
      if (!filters.showWarnings && issue.type === 'warning') return false
      if (!filters.showInfo && issue.type === 'info') return false
      if (!filters.showSuccess && issue.type === 'success') return false
      if (!filters.categories.includes(issue.category)) return false
      return true
    })
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-red-400 bg-red-50'
      case 'medium': return 'border-yellow-400 bg-yellow-50'
      case 'low': return 'border-blue-400 bg-blue-50'
      default: return 'border-gray-400 bg-gray-50'
    }
  }

  if (!isVisible) return null

  const filteredIssues = getFilteredIssues()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Design Analysis</h2>
            {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin" />}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={analyzeDesign}
              disabled={isAnalyzing}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
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
          {/* Filters Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Filters</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showErrors}
                      onChange={(e) => setFilters(prev => ({ ...prev, showErrors: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Errors</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showWarnings}
                      onChange={(e) => setFilters(prev => ({ ...prev, showWarnings: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Warnings</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showInfo}
                      onChange={(e) => setFilters(prev => ({ ...prev, showInfo: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Info</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showSuccess}
                      onChange={(e) => setFilters(prev => ({ ...prev, showSuccess: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Success</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Categories</h3>
                <div className="space-y-2">
                  {['accessibility', 'responsive', 'performance', 'usability', 'code-quality'].map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, categories: [...prev.categories, category] }))
                          } else {
                            setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Issues:</span>
                    <span className="font-mono">{filteredIssues.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span className="font-mono text-red-600">{filteredIssues.filter(i => i.type === 'error').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warnings:</span>
                    <span className="font-mono text-yellow-600">{filteredIssues.filter(i => i.type === 'warning').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-auto p-4">
            {filteredIssues.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No issues found! Your design looks good.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={`border-l-4 p-4 rounded-r ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{issue.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                          
                          {issue.suggestions.length > 0 && (
                            <div className="mb-2">
                              <h4 className="text-sm font-medium mb-1">Suggestions:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {issue.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {issue.componentName && (
                            <p className="text-xs text-gray-500">
                              Component: {issue.componentName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
