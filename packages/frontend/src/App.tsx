import { BrowserRouter } from 'react-router-dom'
import { NavigationProvider } from './contexts/NavigationContext'
import EnhancedRouter from './components/EnhancedRouter'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <EnhancedRouter />
        <Analytics />
        <SpeedInsights />
      </NavigationProvider>
    </BrowserRouter>
  )
}

export default App 