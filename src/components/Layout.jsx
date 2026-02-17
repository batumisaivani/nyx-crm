import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Building2,
  Scissors,
  Users,
  Calendar,
  CalendarDays,
  UserCircle,
  Star,
  Gift,
  TrendingUp,
  Settings
} from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: Building2 },
    { name: 'Services', path: '/services', icon: Scissors },
    { name: 'Specialists', path: '/specialists', icon: Users },
    { name: 'Customers', path: '/customers', icon: UserCircle },
    { name: 'Reviews', path: '/reviews', icon: Star },
    { name: 'Promos', path: '/promos', icon: Gift },
    { name: 'Reports', path: '/reports', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-14 bg-black shadow-lg flex items-center justify-between px-5 flex-shrink-0 border-b border-purple-500/10 relative">
        {/* Subtle purple glow on border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none"></div>
        {/* Brand Name - Left */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Nyxie CRM Logo"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <h1 className="text-lg font-light font-[Playfair] text-white tracking-wide">
            Nyxie CRM
          </h1>
        </div>

        {/* Profile Menu - Right */}
        <div className="relative group">
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all relative">
            <div className="relative">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-purple-500/30">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <span className="text-white text-sm font-medium hidden md:block">{user?.email?.split('@')[0]}</span>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-black/95 backdrop-blur-xl rounded-lg shadow-xl border border-purple-500/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-4 border-b border-purple-500/10">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-purple-400 mt-1">Owner Account</p>
            </div>

            <div className="p-2">
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-900/30 transition-colors text-left">
                <span className="text-lg">💳</span>
                <div>
                  <p className="text-sm font-medium text-white">Billing Plan</p>
                  <p className="text-xs text-gray-400">Free Trial</p>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-900/30 transition-colors text-left">
                <span className="text-lg">🔔</span>
                <div>
                  <p className="text-sm font-medium text-white">Notifications</p>
                  <p className="text-xs text-gray-400">No new notifications</p>
                </div>
              </button>

              <div className="border-t border-purple-500/10 mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-900/30 transition-colors text-left"
                >
                  <span className="text-lg">🚪</span>
                  <p className="text-sm font-medium text-red-400">Sign Out</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Compact with hover expand */}
        <div className="w-20 hover:w-[175px] bg-black shadow-lg border-r border-purple-500/10 flex flex-col transition-all duration-300 group">
        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path
            const isDisabled = item.badge === 'Soon'
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={isDisabled ? '#' : item.path}
                className={`
                  relative flex items-center justify-center group-hover:justify-start px-3 py-3 rounded-lg text-xs font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/80 via-violet-600/80 to-fuchsia-600/80 text-white shadow-lg shadow-purple-500/20'
                      : isDisabled
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
                onClick={(e) => isDisabled && e.preventDefault()}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden group-hover:inline-block ml-3">{item.name}</span>
                {item.badge && (
                  <span className="hidden group-hover:inline-block ml-auto px-1.5 py-0.5 text-xs bg-purple-700/50 text-purple-200 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <main className="h-full p-8 overflow-y-auto bg-black">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
