import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

type CTRLMode = 'design' | 'logic' | 'code'

interface NavigationContextType {
  currentMode: CTRLMode
  setCurrentMode: (mode: CTRLMode) => void
  navigateToMode: (mode: CTRLMode) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Initialize current mode based on URL
  const getInitialMode = (): CTRLMode => {
    const path = location.pathname
    if (path.includes('/logic')) return 'logic'
    if (path.includes('/code')) return 'code'
    return 'design' // default
  }

  const [currentMode, setCurrentMode] = useState<CTRLMode>(getInitialMode)

  const navigateToMode = (mode: CTRLMode) => {
    setCurrentMode(mode)
    // Preserve projectId segment if present: /:mode/:projectId
    const match = location.pathname.match(/^\/(design|logic|code)\/(.+)$/)
    if (match && match[2]) {
      navigate(`/${mode}/${match[2]}`)
    } else {
      navigate(`/${mode}`)
    }
  }

  // Update current mode when location changes
  useEffect(() => {
    const newMode = getInitialMode()
    setCurrentMode(newMode)
  }, [location.pathname])

  return (
    <NavigationContext.Provider value={{ currentMode, setCurrentMode, navigateToMode }}>
      {children}
    </NavigationContext.Provider>
  )
}

function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

export { NavigationProvider, useNavigation } 