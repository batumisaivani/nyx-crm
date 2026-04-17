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
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
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
        <h2 className="text-2xl font-bold text-gray-800 font-[Inter]">Settings & Support</h2>
      </div>

      <div className="flex gap-4">
        {/* Left column */}
        <div className="flex-1 space-y-4">
          {/* Language & Appearance */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="h-14 bg-gradient-to-r from-[#9489E2]/25 via-[#b8b0f0]/15 to-[#9489E2]/10" />
            <div className="px-5 pb-5 pt-3">
              {/* Language */}
              <div className="flex items-center mb-4">
                <Globe className="w-5 h-5 text-[#9489E2] mr-2.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-800 font-[Inter]">Language</h3>
                  <p className="text-[11px] text-gray-500">Choose your preferred language</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`relative w-full p-3 rounded-xl border-2 transition-all ${
                    language === 'en'
                      ? 'border-[#9489E2] bg-[#9489E2]/5 text-gray-800 shadow-sm shadow-[#9489E2]/10'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🇬🇧</div>
                  <div className="text-sm font-medium">English</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Default</div>
                </button>

                <button
                  onClick={() => handleLanguageChange('ka')}
                  className={`relative w-full p-3 rounded-xl border-2 transition-all ${
                    language === 'ka'
                      ? 'border-[#9489E2] bg-[#9489E2]/5 text-gray-800 shadow-sm shadow-[#9489E2]/10'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🇬🇪</div>
                  <div className="text-sm font-medium">ქართული</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Georgian</div>
                </button>
              </div>

              {language === 'ka' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 text-sm">ℹ️</span>
                    <div className="text-xs text-gray-700">
                      <strong className="text-blue-600">Coming Soon:</strong> Full Georgian translation is in progress. The interface will automatically switch when ready.
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="my-5 h-px bg-gray-200" />

              {/* Appearance */}
              <div className="flex items-center mb-4">
                <Palette className="w-5 h-5 text-[#9489E2] mr-2.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-800 font-[Inter]">Appearance</h3>
                  <p className="text-[11px] text-gray-500">Customize how Nyxie.Business looks</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`relative w-full p-3 rounded-xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-[#9489E2] bg-[#9489E2]/5 text-gray-800 shadow-sm shadow-[#9489E2]/10'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <div className="mb-1.5 flex justify-center">
                    <Sun className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="text-sm font-medium">Light Mode</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Default theme</div>
                </button>

                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`relative w-full p-3 rounded-xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-[#9489E2] bg-[#9489E2]/5 text-gray-800 shadow-sm shadow-[#9489E2]/10'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <div className="mb-1.5 flex justify-center">
                    <Moon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-sm font-medium">Dark Mode</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Easy on eyes</div>
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-xs text-gray-500">Nyxie.Business, Version 1.0.0</p>
          </div>
        </div>

        {/* Right column — Support */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="h-14 bg-gradient-to-r from-[#9489E2]/25 via-[#b8b0f0]/15 to-[#9489E2]/10" />
            <div className="px-5 pb-5 pt-3">
              <div className="flex items-center mb-4">
                <LifeBuoy className="w-5 h-5 text-[#9489E2] mr-2.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-800 font-[Inter]">Support & Help</h3>
                  <p className="text-[11px] text-gray-500">Get assistance from our team</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {supportOptions.map((option, index) => {
                  const IconComponent = option.icon
                  return (
                    <div
                      key={index}
                      className="relative p-3 border border-gray-200 rounded-xl hover:border-[#9489E2]/30 hover:bg-[#9489E2]/[0.02] transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#9489E2]/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-[#9489E2]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-semibold text-gray-800">{option.title}</h4>
                            {option.comingSoon && (
                              <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-600 rounded-full font-medium border border-amber-200">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 p-3 bg-[#9489E2]/5 border border-[#9489E2]/15 rounded-xl">
                <div className="flex items-start space-x-2.5">
                  <Rocket className="w-4 h-4 text-[#9489E2] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-800 mb-0.5">Post-Launch Features</h4>
                    <p className="text-[11px] text-gray-500">
                      These support features will be available shortly after the platform launches. We're working hard to deliver the best experience possible!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
