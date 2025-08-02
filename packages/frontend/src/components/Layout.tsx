import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthModal } from './AuthModal'
import { 
  Layout as LayoutIcon, 
  Palette, 
  GitBranch, 
  Code, 
  Settings, 
  User, 
  LogOut,
  Sparkles,
  Github,
  Twitter,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDesign } from '../contexts/DesignContext'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'AI Assistant', href: '/ai' },
]

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')
  const location = useLocation()
  const { isLoggedIn, user, logout } = useAuth()

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  const handleLogout = async () => {
    await logout(() => {
      // Navigate to homepage after logout
      window.location.href = '/'
    })
  }

  return (
    <div className="min-h-screen bg-white font-['Inter'] font-semibold">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900 font-['Inter']">CTRL</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-semibold transition-colors duration-200 font-['Inter'] ${
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop Auth & Social */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Social Proof */}
              <div className="flex items-center space-x-4 text-sm text-gray-500 font-['Inter']">
                <div className="flex items-center space-x-1">
                  <Github className="h-4 w-4" />
                  <span>2.1K</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Twitter className="h-4 w-4" />
                  <span>1.8K</span>
                </div>
              </div>

              {/* Auth Buttons */}
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-['Inter']">
                    {user?.email}
                  </span>
                  <Link
                    to="/user-dashboard"
                    className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold font-['Inter']"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Profile"
                  >
                    <User size={18} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold font-['Inter']"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold font-['Inter']"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-sm hover:shadow-md font-semibold font-['Inter']"
                  >
                    Get CTRL
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 font-['Inter'] ${
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Mobile Auth */}
              <div className="pt-4 border-t border-gray-200/50">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg font-['Inter']">
                      {user?.email}
                    </div>
                    <Link
                      to="/user-dashboard"
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-['Inter']"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-['Inter']"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                                         <button
                       onClick={() => {
                         handleLogout()
                         setMobileMenuOpen(false)
                       }}
                       className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-['Inter']"
                     >
                       Logout
                     </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        openAuthModal('login')
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-['Inter']"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('signup')
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-['Inter']"
                    >
                      Get CTRL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-white text-sm font-['Satoshi']">
              © 2025 CTRL.AI
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Debug Components */}
      {/* <TableSchemaTest /> */}
    </div>
  )
} 