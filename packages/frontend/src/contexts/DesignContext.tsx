import { createContext, useContext, useState, ReactNode } from 'react'

export interface Component {
  id: string
  type: string
  name: string
  props: Record<string, any>
  children?: Component[]
  position: { x: number; y: number }
  size: { width: number; height: number }
  backgroundColor?: string
  zIndex?: number
  interactions?: {
    click?: string
    hover?: string
    animation?: string
  }
  dataBinding?: {
    variable?: string
    api?: string
  }
  logic?: {
    triggers: LogicTrigger[]
    actions: LogicAction[]
    conditions: LogicCondition[]
  }
}

export interface LogicTrigger {
  id: string
  type: 'click' | 'hover' | 'focus' | 'input_change' | 'page_load' | 'custom'
  event: string
  conditions?: LogicCondition[]
}

export interface LogicAction {
  id: string
  type: 'navigate' | 'show_hide' | 'update_data' | 'api_call' | 'animation' | 'validation' | 'custom'
  target?: string
  data?: any
  api?: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: any
  }
}

export interface LogicCondition {
  id: string
  type: 'if' | 'else' | 'and' | 'or'
  condition: string
  value?: any
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  components: Component[]
}

export interface Screen {
  id: string
  name: string
  width: number
  height: number
  type: 'mobile' | 'tablet' | 'desktop' | 'custom'
  layers: Layer[]
  activeLayer: string
}

interface DesignContextType {
  screens: Screen[]
  activeScreen: string | null
  components: Component[]
  addComponent: (component: Component) => void
  updateComponent: (componentId: string, updates: Partial<Component>) => void
  deleteComponent: (componentId: string) => void
  addScreen: (screen: Screen) => void
  updateScreen: (screenId: string, updates: Partial<Screen>) => void
  deleteScreen: (screenId: string) => void
  setActiveScreen: (screenId: string) => void
  addLogicToComponent: (componentId: string, logic: Component['logic']) => void
  getComponentById: (componentId: string) => Component | undefined
  getComponentsByScreen: (screenId: string) => Component[]
}

const DesignContext = createContext<DesignContextType | undefined>(undefined)

export function DesignProvider({ children }: { children: ReactNode }) {
  const [screens, setScreens] = useState<Screen[]>([])
  const [activeScreen, setActiveScreen] = useState<string | null>(null)
  const [components, setComponents] = useState<Component[]>([])

  const addComponent = (component: Component) => {
    setComponents(prev => [...prev, component])
  }

  const updateComponent = (componentId: string, updates: Partial<Component>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId ? { ...comp, ...updates } : comp
    ))
  }

  const deleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId))
  }

  const addScreen = (screen: Screen) => {
    setScreens(prev => [...prev, screen])
    if (!activeScreen) {
      setActiveScreen(screen.id)
    }
  }

  const updateScreen = (screenId: string, updates: Partial<Screen>) => {
    setScreens(prev => prev.map(screen => 
      screen.id === screenId ? { ...screen, ...updates } : screen
    ))
  }

  const deleteScreen = (screenId: string) => {
    setScreens(prev => prev.filter(screen => screen.id !== screenId))
    if (activeScreen === screenId) {
      setActiveScreen(prev => prev === screenId ? (screens[0]?.id || null) : prev)
    }
  }

  const addLogicToComponent = (componentId: string, logic: Component['logic']) => {
    updateComponent(componentId, { logic })
  }

  const getComponentById = (componentId: string) => {
    return components.find(comp => comp.id === componentId)
  }

  const getComponentsByScreen = (screenId: string) => {
    const screen = screens.find(s => s.id === screenId)
    if (!screen) return []
    
    // Get all components from all layers in the screen
    return screen.layers.flatMap(layer => layer.components)
  }

  return (
    <DesignContext.Provider value={{
      screens,
      activeScreen,
      components,
      addComponent,
      updateComponent,
      deleteComponent,
      addScreen,
      updateScreen,
      deleteScreen,
      setActiveScreen,
      addLogicToComponent,
      getComponentById,
      getComponentsByScreen
    }}>
      {children}
    </DesignContext.Provider>
  )
}

export function useDesign() {
  const context = useContext(DesignContext)
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider')
  }
  return context
} 