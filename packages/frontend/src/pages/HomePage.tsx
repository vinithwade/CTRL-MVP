import { Link, useNavigate } from 'react-router-dom'
import { Brain, ArrowRight, Layout, GitBranch, Code, Zap, Sparkles, Star, CheckCircle, Play, Users, Globe, Shield, Zap as Lightning } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect, useRef } from 'react'
import { AuthModal } from '../components/AuthModal'

export function HomePage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')
  const [isFeaturesVisible, setIsFeaturesVisible] = useState(false)
  const featuresRef = useRef<HTMLDivElement>(null)

  const handleDevelopersClick = () => {
    if (isLoggedIn) {
      navigate('/user-dashboard')
    } else {
      setAuthModalMode('login')
      setAuthModalOpen(true)
    }
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  // Scroll animation for Features section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsFeaturesVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (featuresRef.current) {
      observer.observe(featuresRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-blue-800 font-['Inter'] font-semibold">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered UI Development
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-semibold text-white mb-6 leading-tight font-['Inter']">
              The universal development platform
              <span className="block text-blue-200">
                for the AI era
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-12 leading-relaxed font-['SupermemoryFont']">
              From visual design to production-ready code, CTRL provides the complete toolkit for modern development.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleDevelopersClick}
                className="group relative px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl font-['Inter']"
              >
                <div className="relative flex items-center">
                  Get CTRL
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
              
              <button className="group relative px-8 py-4 bg-transparent backdrop-blur-sm border border-white/30 rounded-2xl text-white/90 font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg font-['Inter']">
                <div className="relative flex items-center">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </div>
              </button>

              <button className="group relative px-8 py-4 bg-transparent backdrop-blur-sm border border-white/20 rounded-2xl text-white/70 font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md font-['Inter']">
                <div className="relative flex items-center">
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-white/60 font-['Inter']">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {/* Developer Profile Pictures */}
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden hover:scale-110 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-300/50 transition-all duration-300 cursor-pointer group">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" 
                      alt="Developer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden hover:scale-110 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-300/50 transition-all duration-300 cursor-pointer group">
                    <img 
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=32&h=32&fit=crop&crop=face" 
                      alt="Developer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden hover:scale-110 hover:border-green-300 hover:shadow-lg hover:shadow-green-300/50 transition-all duration-300 cursor-pointer group">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" 
                      alt="Developer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden hover:scale-110 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 cursor-pointer group">
                    <img 
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face" 
                      alt="Developer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden hover:scale-110 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-300/50 transition-all duration-300 cursor-pointer group">
                    <img 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face" 
                      alt="Developer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden hover:scale-110 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-300/50 transition-all duration-300 cursor-pointer group">
                    <img 
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face" 
                      alt="Developer" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="text-sm">10,000+ developers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-blue-300 fill-current" />
                <span className="text-sm">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="relative py-24 bg-gradient-to-br from-gray-900/50 to-blue-900/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 font-['Inter']">
              Everything you need to build
              <span className="block text-blue-200">
                amazing applications
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-['Inter']">
              From visual design to production-ready code, CTRL provides the complete toolkit for modern development.
            </p>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transform transition-all duration-1000 ease-out ${
            isFeaturesVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
          }`}>
            {/* Design Mode */}
            <div className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-xl transform transition-transform duration-700 ease-out hover:translate-x-[-10px]">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Layout className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4 font-['Inter']">Visual Design</h3>
                <p className="text-white/70 leading-relaxed font-['Inter']">
                  Drag-and-drop interface with real-time preview, responsive design tools, and component library.
                </p>
              </div>
            </div>

            {/* Logic Mode */}
            <div className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-xl transform transition-transform duration-700 ease-out hover:translate-x-[-10px]">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <GitBranch className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4 font-['Inter']">Visual Logic</h3>
                <p className="text-white/70 leading-relaxed font-['Inter']">
                  Node-based programming for data flow, API integration, and business logic with visual connections.
                </p>
              </div>
            </div>

            {/* Code Mode */}
            <div className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-xl transform transition-transform duration-700 ease-out hover:translate-x-[-10px]">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4 font-['Inter']">AI Code Generation</h3>
                <p className="text-white/70 leading-relaxed font-['Inter']">
                  Generate production-ready code for React, Vue, Angular, React Native, Flutter, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-gradient-to-r from-gray-900/30 to-blue-900/30">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl font-semibold text-white mb-2 group-hover:scale-110 transition-transform duration-300 font-['Inter']">50K+</div>
              <div className="text-white/70 font-['Inter']">Components Built</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-semibold text-white mb-2 group-hover:scale-110 transition-transform duration-300 font-['Inter']">10K+</div>
              <div className="text-white/70 font-['Inter'] mb-4">Developers</div>
              {/* Developer Profile Pictures */}
              <div className="flex justify-center -space-x-2 mb-2">
                <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden hover:scale-125 hover:border-blue-300 hover:shadow-md hover:shadow-blue-300/50 transition-all duration-300 cursor-pointer group">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=24&h=24&fit=crop&crop=face" 
                    alt="Developer" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden hover:scale-125 hover:border-purple-300 hover:shadow-md hover:shadow-purple-300/50 transition-all duration-300 cursor-pointer group">
                  <img 
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=24&h=24&fit=crop&crop=face" 
                    alt="Developer" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden hover:scale-125 hover:border-green-300 hover:shadow-md hover:shadow-green-300/50 transition-all duration-300 cursor-pointer group">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=24&h=24&fit=crop&crop=face" 
                    alt="Developer" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden hover:scale-125 hover:border-pink-300 hover:shadow-md hover:shadow-pink-300/50 transition-all duration-300 cursor-pointer group">
                  <img 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop&crop=face" 
                    alt="Developer" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden hover:scale-125 hover:border-orange-300 hover:shadow-md hover:shadow-orange-300/50 transition-all duration-300 cursor-pointer group">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=24&h=24&fit=crop&crop=face" 
                    alt="Developer" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden hover:scale-125 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-300/50 transition-all duration-300 cursor-pointer group">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=24&h=24&fit=crop&crop=face" 
                    alt="Developer" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-semibold text-white mb-2 group-hover:scale-110 transition-transform duration-300 font-['Inter']">99.9%</div>
              <div className="text-white/70 font-['Inter']">Uptime</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-semibold text-white mb-2 group-hover:scale-110 transition-transform duration-300 font-['Inter']">24/7</div>
              <div className="text-white/70 font-['Inter']">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 bg-gradient-to-br from-gray-900/50 to-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 font-['Inter']">
              How CTRL Works
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-['Inter']">
              Three simple steps to transform your ideas into reality
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="relative w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  1
                </div>
              </div>
              {/* Design Interface Image */}
              <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center" 
                  alt="CTRL Design Interface" 
                  className="w-full h-auto object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 font-['Inter']">Design Visually</h3>
              <p className="text-white/70 leading-relaxed font-['Inter']">
                Use our intuitive drag-and-drop interface to create beautiful UIs with pre-built components and real-time preview.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="relative w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 font-['Inter']">Connect Logic</h3>
              <p className="text-white/70 leading-relaxed font-['Inter']">
                Define data flow, API integrations, and business logic using our visual node-based programming interface.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="relative w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 font-['Inter']">Generate Code</h3>
              <p className="text-white/70 leading-relaxed font-['Inter']">
                AI generates production-ready code for your chosen framework, ready to deploy and scale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technologies */}
      <div className="py-24 bg-gradient-to-br from-gray-900/30 to-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 font-['Inter']">
              Supported Technologies
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-['Inter']">
              Generate code for the frameworks and languages you love
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              'React', 'Vue.js', 'Angular', 'Svelte', 'React Native', 'Flutter',
              'Next.js', 'Nuxt.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Node.js'
            ].map((tech) => (
              <div key={tech} className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg">
                <div className="relative text-center">
                  <span className="text-lg font-semibold text-white font-['Inter']">{tech}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 bg-gradient-to-r from-gray-900/50 to-blue-900/50">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 font-['Inter']">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-['Inter']">
            Join thousands of developers who are already using CTRL to build faster, 
            smarter, and more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleDevelopersClick}
              className="group relative px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl font-['Inter']"
            >
              <div className="relative flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
            <button className="group relative px-8 py-4 bg-transparent backdrop-blur-sm border border-white/30 rounded-2xl text-white/90 font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg font-['Inter']">
              <div className="relative flex items-center">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </div>
            </button>
            <button className="group relative px-8 py-4 bg-transparent backdrop-blur-sm border border-white/20 rounded-2xl text-white/70 font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md font-['Inter']">
              <div className="relative flex items-center">
                Join the Waitlist
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />
    </div>
  )
} 