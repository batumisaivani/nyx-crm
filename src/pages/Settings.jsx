import { useState, useEffect } from 'react'
import { Globe, Palette, LifeBuoy, Sparkles, Rocket, MessageCircle, Mail, Video, BookOpen, Bug, Lightbulb, Sun, Moon } from 'lucide-react'

export default function Settings() {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  // Apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
    // Will trigger app-wide language change when we implement i18n
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    // Will apply theme when we implement dark mode
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat Support',
      description: 'Chat with our support team in real-time',
      comingSoon: true
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      comingSoon: true
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides and tutorials',
      comingSoon: true
    },
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Browse articles and documentation',
      comingSoon: true
    },
    {
      icon: Bug,
      title: 'Report a Bug',
      description: 'Found an issue? Let us know',
      comingSoon: true
    },
    {
      icon: Lightbulb,
      title: 'Feature Request',
      description: 'Suggest new features and improvements',
      comingSoon: true
    },
  ]

  return (
    <div className="w-full -mt-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white font-[Inter]">Settings & Support</h2>
        <p className="text-gray-300 mt-1">Customize your experience and get help</p>
      </div>

      {/* Language Settings */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <Globe className="w-6 h-6 text-purple-300 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-white font-[Inter]">Language</h3>
            <p className="text-sm text-gray-300">Choose your preferred language</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`relative w-full p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
              language === 'en'
                ? 'border-purple-500 bg-purple-900/40 text-white shadow-lg shadow-purple-500/20'
                : 'border-purple-500/10 bg-purple-950/25 text-gray-300 hover:border-purple-500/40'
            }`}
          >
            <div className="text-3xl mb-2">🇬🇧</div>
            <div className="font-medium">English</div>
            <div className="text-xs text-purple-300 mt-1">Default</div>
          </button>

          <button
            onClick={() => handleLanguageChange('ka')}
            className={`relative w-full p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
              language === 'ka'
                ? 'border-purple-500 bg-purple-900/40 text-white shadow-lg shadow-purple-500/20'
                : 'border-purple-500/10 bg-purple-950/25 text-gray-300 hover:border-purple-500/40'
            }`}
          >
            <div className="text-3xl mb-2">🇬🇪</div>
            <div className="font-medium">ქართული</div>
            <div className="text-xs text-purple-300 mt-1">Georgian</div>
          </button>
        </div>

        {language === 'ka' && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400">ℹ️</span>
              <div className="text-sm text-gray-200">
                <strong className="text-blue-300">Coming Soon:</strong> Full Georgian translation is in progress. The interface will automatically switch when ready.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Theme Settings */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <Palette className="w-6 h-6 text-purple-300 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-white font-[Inter]">Appearance</h3>
            <p className="text-sm text-gray-300">Customize how Nyxie CRM looks</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`relative w-full p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
              theme === 'light'
                ? 'border-purple-500 bg-purple-900/40 text-white shadow-lg shadow-purple-500/20'
                : 'border-purple-500/10 bg-purple-950/25 text-gray-300 hover:border-purple-500/40'
            }`}
          >
            <div className="mb-2 flex justify-center">
              <Sun className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="font-medium">Light Mode</div>
            <div className="text-xs text-purple-300 mt-1">Default theme</div>
          </button>

          <button
            onClick={() => handleThemeChange('dark')}
            className={`relative w-full p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
              theme === 'dark'
                ? 'border-purple-500 bg-purple-900/40 text-white shadow-lg shadow-purple-500/20'
                : 'border-purple-500/10 bg-purple-950/25 text-gray-300 hover:border-purple-500/40'
            }`}
          >
            <div className="mb-2 flex justify-center">
              <Moon className="w-10 h-10 text-blue-400" />
            </div>
            <div className="font-medium">Dark Mode</div>
            <div className="text-xs text-purple-300 mt-1">Easy on eyes</div>
          </button>
        </div>
      </div>

      {/* Support Section */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <LifeBuoy className="w-6 h-6 text-purple-300 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-white font-[Inter]">Support & Help</h3>
            <p className="text-sm text-gray-300">Get assistance from our team</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportOptions.map((option, index) => {
            const IconComponent = option.icon
            return (
              <div
                key={index}
                className="relative p-4 border-2 border-purple-500/10 rounded-xl hover:border-purple-500/40 transition-all bg-purple-950/25"
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className="w-6 h-6 text-purple-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white">{option.title}</h4>
                      {option.comingSoon && (
                        <span className="px-2 py-1 text-xs bg-orange-900/30 text-orange-300 rounded-full font-medium border border-orange-700">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{option.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/15 to-pink-900/15 border border-purple-500/10 rounded-xl">
          <div className="flex items-start space-x-3">
            <Rocket className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white mb-1">Post-Launch Features</h4>
              <p className="text-sm text-gray-200">
                These support features will be available shortly after the platform launches.
                We're working hard to deliver the best experience possible!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
        <div className="text-center">
          <p className="text-sm text-gray-300">Nyxie CRM, Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
