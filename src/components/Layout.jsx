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
  Settings,
  CreditCard,
  Bell,
  LogOut,
  User
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
          <button className="flex items-center gap-3 px-3 py-1.5 rounded-2xl border border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-sm transition-all duration-200">
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-gray-800 tracking-tight leading-tight">{user?.email?.split('@')[0]}</div>
              <div className="text-[10px] text-gray-400 tracking-tight leading-tight">{user?.email}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9489E2] via-[#b8b0f0] to-[#7b6fd4] p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-[#9489E2]">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-64 p-2 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-200/50 transition-all duration-200">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-800 tracking-tight">Profile</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-200/50 transition-all duration-200">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-800 tracking-tight">Settings</span>
            </Link>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-200/50 transition-all duration-200 text-left">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800 tracking-tight">Billing</span>
              </div>
              <span className="text-[10px] font-medium text-[#9489E2] bg-[#9489E2]/10 border border-[#9489E2]/10 rounded-md py-0.5 px-1.5">Free Trial</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-200/50 transition-all duration-200 text-left">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-800 tracking-tight">Notifications</span>
            </button>

            <div className="my-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 bg-red-500/5 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 hover:shadow-sm transition-all duration-200"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Sign Out</span>
            </button>
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
