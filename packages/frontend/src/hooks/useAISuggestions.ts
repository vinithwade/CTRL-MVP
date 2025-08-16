import { useState, useCallback, useEffect } from 'react'
import { Component, Screen } from '@/contexts/DesignContext'

interface AISuggestion {
  id: string
  type: 'placement' | 'layout' | 'component' | 'style' | 'interaction'
  title: string
  description: string
  confidence: number
  action: () => void
  position?: { x: number; y: number }
  componentType?: string
  properties?: Record<string, any>
}

interface AISuggestionState {
  suggestions: AISuggestion[]
  isLoading: boolean
  error: string | null
  showSuggestions: boolean
}

export function useAISuggestions(
  components: Component[],
  screens: Screen[],
  activeScreen: string | null,
  addComponent: (component: Component) => void,
  updateComponent: (componentId: string, updates: Partial<Component>) => void
) {
  const [state, setState] = useState<AISuggestionState>({
    suggestions: [],
    isLoading: false,
    error: null,
    showSuggestions: false
  })

  // Analyze current design and generate suggestions
  const analyzeDesign = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const currentScreen = screens.find(s => s.id === activeScreen)
      if (!currentScreen) return

      const suggestions: AISuggestion[] = []

      // 1. Layout Analysis
      analyzeLayout(currentScreen, components, suggestions, addComponent)

      // 2. Component Placement Suggestions
      analyzeComponentPlacement(currentScreen, components, suggestions, addComponent)

      // 3. Style Consistency
      analyzeStyleConsistency(components, suggestions, updateComponent)

      // 4. Interaction Suggestions
      analyzeInteractions(components, suggestions, updateComponent)

      // 5. Accessibility Suggestions
      analyzeAccessibility(components, suggestions, updateComponent)

      setState(prev => ({
        ...prev,
        suggestions,
        isLoading: false,
        showSuggestions: suggestions.length > 0
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to analyze design'
      }))
    }
  }, [components, screens, activeScreen, addComponent, updateComponent])

  const analyzeLayout = (
    screen: Screen,
    components: Component[],
    suggestions: AISuggestion[],
    addComponent: (component: Component) => void
  ) => {
    const screenComponents = components.filter(c => 
      screen.layers.some(layer => layer.components.some(comp => comp.id === c.id))
    )

    // Check for empty spaces
    const occupiedAreas = screenComponents.map(comp => ({
      x: comp.position.x,
      y: comp.position.y,
      width: comp.size.width,
      height: comp.size.height
    }))

    const emptySpaces = findEmptySpaces(screen, occupiedAreas)
    
    if (emptySpaces.length > 0) {
      suggestions.push({
        id: 'layout-suggestion-1',
        type: 'layout',
        title: 'Add content to empty space',
        description: `Found ${emptySpaces.length} empty areas that could be filled with content`,
        confidence: 0.8,
        action: () => {
          const space = emptySpaces[0]
          addComponent({
            id: `suggested-${Date.now()}`,
            type: 'text',
            name: 'Suggested Content',
            props: { content: 'Add your content here' },
            position: { x: space.x + 20, y: space.y + 20 },
            size: { width: space.width - 40, height: space.height - 40 }
          })
        },
        position: emptySpaces[0]
      })
    }

    // Check for alignment issues
    const alignmentIssues = findAlignmentIssues(screenComponents)
    if (alignmentIssues.length > 0) {
      suggestions.push({
        id: 'layout-suggestion-2',
        type: 'layout',
        title: 'Improve alignment',
        description: `${alignmentIssues.length} components could be better aligned`,
        confidence: 0.7,
        action: () => {
          alignmentIssues.forEach(issue => {
            updateComponent(issue.componentId, { position: issue.suggestedPosition })
          })
        }
      })
    }
  }

  const analyzeComponentPlacement = (
    screen: Screen,
    components: Component[],
    suggestions: AISuggestion[],
    addComponent: (component: Component) => void
  ) => {
    const screenComponents = components.filter(c => 
      screen.layers.some(layer => layer.components.some(comp => comp.id === c.id))
    )

    // Suggest common UI patterns
    const hasButton = screenComponents.some(c => c.type === 'button')
    const hasInput = screenComponents.some(c => c.type === 'input')
    const hasForm = screenComponents.some(c => c.type === 'form')

    if (hasButton && !hasInput && !hasForm) {
      suggestions.push({
        id: 'component-suggestion-1',
        type: 'component',
        title: 'Add input field',
        description: 'Buttons often work better with input fields',
        confidence: 0.6,
        action: () => {
          const button = screenComponents.find(c => c.type === 'button')
          if (button) {
            addComponent({
              id: `suggested-input-${Date.now()}`,
              type: 'input',
              name: 'Input Field',
              props: { placeholder: 'Enter text...' },
              position: { x: button.position.x, y: button.position.y - 60 },
              size: { width: button.size.width, height: 40 }
            })
          }
        }
      })
    }

    // Suggest navigation elements
    if (screenComponents.length > 3 && !screenComponents.some(c => c.type === 'navigation')) {
      suggestions.push({
        id: 'component-suggestion-2',
        type: 'component',
        title: 'Add navigation',
        description: 'Consider adding navigation for better user experience',
        confidence: 0.5,
        action: () => {
          addComponent({
            id: `suggested-nav-${Date.now()}`,
            type: 'navigation',
            name: 'Navigation',
            props: { items: ['Home', 'About', 'Contact'] },
            position: { x: 20, y: 20 },
            size: { width: screen.width - 40, height: 50 }
          })
        }
      })
    }
  }

  const analyzeStyleConsistency = (
    components: Component[],
    suggestions: AISuggestion[],
    updateComponent: (componentId: string, updates: Partial<Component>) => void
  ) => {
    const buttonComponents = components.filter(c => c.type === 'button')
    const colors = buttonComponents.map(c => c.backgroundColor).filter(Boolean)
    
    if (colors.length > 1) {
      const mostCommonColor = findMostCommon(colors)
      suggestions.push({
        id: 'style-suggestion-1',
        type: 'style',
        title: 'Unify button colors',
        description: 'Consider using consistent colors for better visual hierarchy',
        confidence: 0.7,
        action: () => {
          buttonComponents.forEach(button => {
            updateComponent(button.id, { backgroundColor: mostCommonColor })
          })
        }
      })
    }

    // Check for consistent spacing
    const spacingIssues = findSpacingIssues(components)
    if (spacingIssues.length > 0) {
      suggestions.push({
        id: 'style-suggestion-2',
        type: 'style',
        title: 'Improve spacing',
        description: `${spacingIssues.length} components could benefit from better spacing`,
        confidence: 0.6,
        action: () => {
          spacingIssues.forEach(issue => {
            updateComponent(issue.componentId, { position: issue.suggestedPosition })
          })
        }
      })
    }
  }

  const analyzeInteractions = (
    components: Component[],
    suggestions: AISuggestion[],
    updateComponent: (componentId: string, updates: Partial<Component>) => void
  ) => {
    const interactiveComponents = components.filter(c => 
      c.type === 'button' || c.type === 'input' || c.type === 'form'
    )

    interactiveComponents.forEach(component => {
      if (!component.interactions?.click && component.type === 'button') {
        suggestions.push({
          id: `interaction-suggestion-${component.id}`,
          type: 'interaction',
          title: 'Add click handler',
          description: `Button "${component.name}" should have a click action`,
          confidence: 0.8,
          action: () => {
            updateComponent(component.id, {
              interactions: {
                ...component.interactions,
                click: 'handleClick'
              }
            })
          }
        })
      }
    })
  }

  const analyzeAccessibility = (
    components: Component[],
    suggestions: AISuggestion[],
    updateComponent: (componentId: string, updates: Partial<Component>) => void
  ) => {
    components.forEach(component => {
      if (component.type === 'image' && !component.props?.alt) {
        suggestions.push({
          id: `accessibility-suggestion-${component.id}`,
          type: 'interaction',
          title: 'Add alt text',
          description: `Image "${component.name}" needs alt text for accessibility`,
          confidence: 0.9,
          action: () => {
            updateComponent(component.id, {
              props: {
                ...component.props,
                alt: 'Description of image'
              }
            })
          }
        })
      }
    })
  }

  // Helper functions
  const findEmptySpaces = (screen: Screen, occupiedAreas: any[]) => {
    // Simple algorithm to find empty spaces
    const gridSize = 50
    const emptySpaces = []
    
    for (let x = 0; x < screen.width; x += gridSize) {
      for (let y = 0; y < screen.height; y += gridSize) {
        const isOccupied = occupiedAreas.some(area => 
          x < area.x + area.width && x + gridSize > area.x &&
          y < area.y + area.height && y + gridSize > area.y
        )
        
        if (!isOccupied) {
          emptySpaces.push({ x, y, width: gridSize, height: gridSize })
        }
      }
    }
    
    return emptySpaces
  }

  const findAlignmentIssues = (components: Component[]) => {
    const issues = []
    const alignmentThreshold = 10
    
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i]
        const comp2 = components[j]
        
        // Check horizontal alignment
        if (Math.abs(comp1.position.x - comp2.position.x) < alignmentThreshold) {
          issues.push({
            componentId: comp2.id,
            suggestedPosition: { ...comp2.position, x: comp1.position.x }
          })
        }
        
        // Check vertical alignment
        if (Math.abs(comp1.position.y - comp2.position.y) < alignmentThreshold) {
          issues.push({
            componentId: comp2.id,
            suggestedPosition: { ...comp2.position, y: comp1.position.y }
          })
        }
      }
    }
    
    return issues
  }

  const findSpacingIssues = (components: Component[]) => {
    const issues = []
    const minSpacing = 20
    
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i]
        const comp2 = components[j]
        
        const distance = Math.sqrt(
          Math.pow(comp1.position.x - comp2.position.x, 2) +
          Math.pow(comp1.position.y - comp2.position.y, 2)
        )
        
        if (distance < minSpacing) {
          issues.push({
            componentId: comp2.id,
            suggestedPosition: {
              x: comp2.position.x + minSpacing,
              y: comp2.position.y + minSpacing
            }
          })
        }
      }
    }
    
    return issues
  }

  const findMostCommon = (arr: any[]) => {
    const counts: Record<string, number> = {}
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1
    })
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
  }

  const applySuggestion = useCallback((suggestionId: string) => {
    const suggestion = state.suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      suggestion.action()
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
      }))
    }
  }, [state.suggestions])

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }))
  }, [])

  const toggleSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSuggestions: !prev.showSuggestions
    }))
  }, [])

  // Auto-analyze when components change
  useEffect(() => {
    if (components.length > 0) {
      const timeoutId = setTimeout(analyzeDesign, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [components, analyzeDesign])

  return {
    ...state,
    analyzeDesign,
    applySuggestion,
    dismissSuggestion,
    toggleSuggestions
  }
}
