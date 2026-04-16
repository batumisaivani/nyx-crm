import { useEffect } from 'react'
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
  BarChart3,
  TrendingUp,
  Settings
} from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  useEffect(() => {
    document.title = 'Nyxie.Business'
    return () => { document.title = 'Nyxie' }
  }, [])

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
    { name: 'Marketing', path: '/marketing', icon: BarChart3 },
    { name: 'Reports', path: '/reports', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <div className="h-screen bg-[#eeeeee] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-14 bg-white shadow-sm flex items-center justify-between px-5 flex-shrink-0 border-b border-[#e0d8d0]">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Nyxie.Business Logo"
            className="w-8 h-8 object-contain"
            style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <h1 className="text-lg font-light font-[Playfair] text-gray-800 tracking-wide">
            Nyxie.Business
          </h1>
        </div>

        {/* Profile Menu - Right */}
        <div className="relative group">
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
            <div className="w-7 h-7 bg-[#9489E2] rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-gray-700 text-sm font-medium hidden md:block">{user?.email?.split('@')[0]}</span>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#e0d8d0] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-4 border-b border-[#e0d8d0]">
              <p className="text-sm font-medium text-gray-800">{user?.email}</p>
              <p className="text-xs text-purple-600 mt-1">Owner Account</p>
            </div>

            <div className="p-2">
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-lg">💳</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Billing Plan</p>
                  <p className="text-xs text-gray-400">Free Trial</p>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className="text-lg">🔔</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Notifications</p>
                  <p className="text-xs text-gray-400">No new notifications</p>
                </div>
              </button>

              <div className="border-t border-[#e0d8d0] mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  <span className="text-lg">🚪</span>
                  <p className="text-sm font-medium text-red-500">Sign Out</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-20 hover:w-[175px] bg-white shadow-sm border-r border-[#e0d8d0] flex flex-col transition-all duration-300 group">
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
                      ? 'bg-[#9489E2] text-white shadow-md shadow-[#9489E2]/20'
                      : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-[#eeeeee] hover:text-gray-800'
                  }
                `}
                onClick={(e) => isDisabled && e.preventDefault()}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden group-hover:inline-block ml-3">{item.name}</span>
                {item.badge && (
                  <span className="hidden group-hover:inline-block ml-auto px-1.5 py-0.5 text-xs bg-purple-100 text-purple-600 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <main className="h-full p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
