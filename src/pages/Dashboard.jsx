import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import RevenueCircle from '../components/ui/RevenueCircle'
import ClassicLoader from '../components/ui/loader'
import { Calendar, TrendingUp, Scissors, Users, Building2, CalendarDays, Brain, ChevronDown, ExternalLink, Send, Clock, Tag, Zap, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StoryViewer } from '../components/ui/StoryViewer'

export default function Dashboard() {
  const { facilityAccess } = useAuth()
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    monthBookings: 0,
    services: 0,
    specialists: 0,
    revenue: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [nextBooking, setNextBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState(null)

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchDashboardData()
    }
  }, [facilityAccess])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const salonId = facilityAccess.salon_id

      // Date calculations
      const today = new Date().toISOString().split('T')[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      // Fetch all data in parallel
      const [servicesRes, specialistsRes, allBookingsRes, todayBookingsRes, monthBookingsRes] = await Promise.all([
        supabase.from('services').select('id').eq('salon_id', salonId),
        supabase.from('specialists').select('id').eq('salon_id', salonId),
        supabase.from('bookings').select('id, status').eq('salon_id', salonId),
        supabase.from('bookings').select('id').eq('salon_id', salonId).eq('booking_date', today),
        supabase.from('bookings')
          .select('*, services(price)')
          .eq('salon_id', salonId)
          .gte('booking_date', firstDayOfMonth)
      ])

      // Fetch recent bookings + next upcoming booking
      const [{ data: recentData }, { data: nextData }] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, services(name), specialists(name)')
          .eq('salon_id', salonId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('bookings')
          .select('*, services(name), specialists(name), customers(full_name)')
          .eq('salon_id', salonId)
          .gte('booking_date', today)
          .in('status', ['pending', 'confirmed'])
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(1)
      ])

      // Calculate revenue (use final_price if available, otherwise service price)
      const revenue = monthBookingsRes.data?.reduce((sum, booking) => {
        const price = booking.final_price || booking.services?.price || 0
        return sum + price
      }, 0) || 0

      setStats({
        totalBookings: allBookingsRes.data?.length || 0,
        todayBookings: todayBookingsRes.data?.length || 0,
        monthBookings: monthBookingsRes.data?.length || 0,
        services: servicesRes.data?.length || 0,
        specialists: specialistsRes.data?.length || 0,
        revenue: revenue
      })

      setRecentBookings(recentData || [])
      setNextBooking(nextData?.[0] || null)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.substring(0, 5)
  }

  const salonStories = [
    {
      username: 'NOOR HAIR',
      avatar: '/salon-hero.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      stories: [
        { id: 'noor-1', type: 'image', src: '/stories/salon-1.jpg' },
        { id: 'noor-2', type: 'image', src: '/stories/hair-1.jpg' },
      ],
    },
    {
      username: 'Ana',
      avatar: '/user-ana.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      stories: [
        { id: 'ana-1', type: 'image', src: '/stories/hair-color-1.jpg' },
        { id: 'ana-2', type: 'image', src: '/stories/model-1.jpg' },
      ],
    },
    {
      username: 'Nino',
      avatar: '/user-nino.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      stories: [
        { id: 'nino-1', type: 'image', src: '/stories/nails-1.jpg' },
        { id: 'nino-2', type: 'image', src: '/stories/nails-2.jpg' },
      ],
    },
    {
      username: 'Dato',
      avatar: '/user-dato.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      stories: [
        { id: 'dato-1', type: 'image', src: '/stories/model-2.jpg' },
      ],
    },
    {
      username: 'Lika',
      avatar: '/user-lika.webp',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      stories: [
        { id: 'lika-1', type: 'image', src: '/stories/spa-1.jpg' },
      ],
    },
  ]

  const STATUS_COLORS = {
    pending: 'bg-gradient-to-br from-yellow-800/60 to-yellow-900/60 border border-yellow-400/40 text-yellow-50',
    confirmed: 'bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-500/30 text-blue-100',
    completed: 'bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-600/30 text-emerald-200',
    cancelled: 'bg-gradient-to-br from-rose-900/40 to-red-900/40 border border-rose-600/30 text-rose-200',
  }

  return (
    <Layout>
      <div className="w-full -mt-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <ClassicLoader />
          </div>
        ) : (
          <>
            {/* Stories Row */}
            <div className="mb-6 -mx-2">
              <div className="flex items-start gap-4 overflow-x-auto px-2 pb-2 scrollbar-hide">
                {salonStories.map((storyGroup) => (
                  <StoryViewer
                    key={storyGroup.username}
                    stories={storyGroup.stories}
                    username={storyGroup.username}
                    avatar={storyGroup.avatar}
                    timestamp={storyGroup.timestamp}
                  />
                ))}
              </div>
            </div>

            {/* Hero: Image | Revenue | Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Salon Image */}
              <div className="relative rounded-2xl overflow-hidden">
                <div className="aspect-[3/4]">
                  <img
                    src="/salon-hero.jpg"
                    alt={facilityAccess?.salons?.name || 'Salon'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <p className="text-white/50 text-[10px] font-medium tracking-[0.2em] uppercase">Welcome back</p>
                    <p className="text-white text-xl font-bold">{facilityAccess?.salons?.name || 'Your Salon'}</p>
                  </div>
                </div>
              </div>

              {/* Revenue Circle */}
              <RevenueCircle total={Math.round(stats.revenue)} />

              {/* Stats List */}
              <div className="flex flex-col gap-3">
                <AnimatedCard className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-purple-200/50">Today's Bookings</div>
                      <div className="text-xl font-bold text-white leading-tight">{stats.todayBookings}</div>
                    </div>
                    <div className="text-xs text-white/25 font-medium">/ {stats.totalBookings}</div>
                  </div>
                </AnimatedCard>

                <AnimatedCard className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Scissors className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-purple-200/50">Active Services</div>
                      <div className="text-xl font-bold text-white leading-tight">{stats.services}</div>
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-purple-200/50">Specialists</div>
                      <div className="text-xl font-bold text-white leading-tight">{stats.specialists}</div>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Background image fill + New Booking CTA */}
                <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[120px]">
                  <img src="/stats-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 flex items-end justify-center h-full p-4">
                    <Link
                      to="/calendar"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600/90 backdrop-blur-sm hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      New Booking
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6 mb-8">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-[Calibri,sans-serif]">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <AnimatedCard className="p-4">
                  <Link to="/calendar" className="block text-left">
                    <CalendarDays className="w-6 h-6 mb-2 text-purple-700 dark:text-purple-300" />
                    <div className="text-sm font-medium text-black dark:text-white">View Calendar</div>
                    <div className="text-xs text-purple-800 dark:text-purple-200 mt-1">See today's schedule</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/reports" className="block text-left">
                    <TrendingUp className="w-6 h-6 mb-2 text-purple-700 dark:text-purple-300" />
                    <div className="text-sm font-medium text-black dark:text-white">View Reports</div>
                    <div className="text-xs text-purple-800 dark:text-purple-200 mt-1">Analytics & insights</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/services" className="block text-left">
                    <Scissors className="w-6 h-6 mb-2 text-purple-700 dark:text-purple-300" />
                    <div className="text-sm font-medium text-black dark:text-white">Manage Services</div>
                    <div className="text-xs text-purple-800 dark:text-purple-200 mt-1">Add or edit services</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/specialists" className="block text-left">
                    <Users className="w-6 h-6 mb-2 text-purple-700 dark:text-purple-300" />
                    <div className="text-sm font-medium text-black dark:text-white">Manage Specialists</div>
                    <div className="text-xs text-purple-800 dark:text-purple-200 mt-1">Add or edit team members</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/profile" className="block text-left">
                    <Building2 className="w-6 h-6 mb-2 text-purple-700 dark:text-purple-300" />
                    <div className="text-sm font-medium text-black dark:text-white">Edit Profile</div>
                    <div className="text-xs text-purple-800 dark:text-purple-200 mt-1">Update facility info</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/bookings" className="block text-left">
                    <Calendar className="w-6 h-6 mb-2 text-purple-700 dark:text-purple-300" />
                    <div className="text-sm font-medium text-black dark:text-white">Recent Bookings</div>
                    <div className="text-xs text-purple-800 dark:text-purple-200 mt-1">View all bookings</div>
                  </Link>
                </AnimatedCard>
              </div>
            </div>

            {/* Smart Intelligence */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white font-[Calibri,sans-serif]">Smart Intelligence</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Panel 1 — User Activity */}
                <div className="feat-panel feat-panel-1">
                  <div className="feat-panel-head">
                    <span className="feat-panel-name">User Activity</span>
                    <span className="feat-tag feat-tag-user">
                      <span className="feat-tag-dot" style={{ background: '#00EBFB' }} />
                      LIVE
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    {[
                      { id: 'ua1', text: 'Ana is viewing Hair Coloring', time: '2m ago', avatar: '/user-ana.jpg', detail: 'Visited the page 3 times this week. Previously booked Balayage.', action: 'View customer', link: '/customers' },
                      { id: 'ua2', text: 'Dato viewed your profile', time: '5m ago', avatar: '/user-dato.jpg', detail: 'New visitor from Instagram referral. Browsed pricing section.', action: 'View customer', link: '/customers' },
                      { id: 'ua3', text: 'Nino browsed Nail Services', time: '12m ago', avatar: '/user-nino.jpg', detail: 'Returning client — last visit was 3 weeks ago for Gel Nails.', action: 'View customer', link: '/customers' },
                      { id: 'ua4', text: 'Lika opened booking page', time: '18m ago', avatar: '/user-lika.webp', detail: 'Selected "Haircut" but didn\'t complete booking. Cart abandoned.', action: 'Send reminder', link: '/bookings' },
                    ].map((item, i) => (
                      <div key={item.id}>
                        <button
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="flex items-center gap-3 w-full text-left py-2 px-1 -mx-1 rounded-lg hover:bg-white/[0.03] transition-colors"
                        >
                          <img src={item.avatar} alt="" className="w-[30px] h-[30px] rounded-full object-cover flex-shrink-0 ring-1 ring-cyan-400/20" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">{item.text}</p>
                            <p className="text-[11px] text-gray-500">{item.time}</p>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedItem === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-[42px] mb-2 pl-3 border-l border-cyan-500/20">
                                <p className="text-xs text-gray-400 mb-2">{item.detail}</p>
                                <Link to={item.link} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  {item.action}
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 2 — AI Insights */}
                <div className="feat-panel feat-panel-2">
                  <div className="feat-panel-head">
                    <span className="feat-panel-name">AI Insights</span>
                    <span className="feat-tag feat-tag-ai">
                      <span className="feat-tag-dot" style={{ background: '#c4b5fd' }} />
                      AI
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    {[
                      { id: 'ai1', text: '3 clients at risk of churning', time: 'Updated now', detail: 'Ana, Giorgi, and Tamta haven\'t booked in 45+ days. Their average rebooking interval is 21 days.', action: 'View at-risk clients', link: '/customers' },
                      { id: 'ai2', text: 'Booking frequency dropped 20%', time: '1h ago', detail: 'Week-over-week decline. Monday and Wednesday slots are most underbooked.', action: 'View calendar gaps', link: '/calendar' },
                      { id: 'ai3', text: 'Peak demand: Tue & Thu 2-5 PM', time: '3h ago', detail: 'Consider raising prices during peak hours or adding a specialist to these shifts.', action: 'Manage schedule', link: '/specialists' },
                      { id: 'ai4', text: 'Color services trending +35%', time: 'Today', detail: 'Balayage and highlights are your fastest growing category. Top performer: Nana.', action: 'View reports', link: '/reports' },
                    ].map((item, i) => (
                      <div key={item.id}>
                        <button
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="flex items-center gap-3 w-full text-left py-2 px-1 -mx-1 rounded-lg hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="feat-sn feat-sn-2">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">{item.text}</p>
                            <p className="text-[11px] text-gray-500">{item.time}</p>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedItem === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-[42px] mb-2 pl-3 border-l border-purple-400/20">
                                <p className="text-xs text-gray-400 mb-2">{item.detail}</p>
                                <Link to={item.link} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  {item.action}
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel 3 — Recommended Actions */}
                <div className="feat-panel feat-panel-3">
                  <div className="feat-panel-head">
                    <span className="feat-panel-name">Recommended Actions</span>
                    <span className="feat-tag feat-tag-biz">
                      <span className="feat-tag-dot" style={{ background: '#fda4af' }} />
                      ACTIONS
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    {[
                      { id: 'ra1', text: 'Send 15% off to Ana', time: 'Suggested', detail: 'She viewed Hair Coloring 3 times without booking. A discount could convert her.', action: 'Create promo', link: '/promos', icon: Tag },
                      { id: 'ra2', text: 'Re-engage Dato with loyalty offer', time: 'Suggested', detail: 'Inactive for 30+ days. Send a personalized comeback offer to retain.', action: 'Send offer', link: '/promos', icon: Send },
                      { id: 'ra3', text: 'Add evening slots on Thursdays', time: 'Opportunity', detail: '12 booking requests were declined last month due to no availability after 6 PM.', action: 'Edit schedule', link: '/specialists', icon: Clock },
                      { id: 'ra4', text: 'Promote Nail Art — high demand', time: 'Trending', detail: 'Search volume for nail art increased 40% this month in your area.', action: 'Boost service', link: '/services', icon: Zap },
                    ].map((item, i) => {
                      const ActionIcon = item.icon
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            className="flex items-center gap-3 w-full text-left py-2 px-1 -mx-1 rounded-lg hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="feat-sn feat-sn-3">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate">{item.text}</p>
                              <p className="text-[11px] text-gray-500">{item.time}</p>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {expandedItem === item.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-[42px] mb-2 pl-3 border-l border-rose-400/20">
                                  <p className="text-xs text-gray-400 mb-2">{item.detail}</p>
                                  <Link to={item.link} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors">
                                    <ActionIcon className="w-3 h-3" />
                                    {item.action}
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Performance Overview Table */}
              <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6">
                <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-[Calibri,sans-serif]">Performance Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-300">Today's Revenue</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{(stats.revenue * 0.15).toFixed(2)} GEL</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-700 dark:text-gray-400">vs Yesterday</p>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">+12%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-300">Avg. Service Time</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400">45 min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-700 dark:text-gray-400">Efficiency</p>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">95%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-300">Customer Satisfaction</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400">4.8 / 5.0</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-700 dark:text-gray-400">Reviews</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-300">124</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Trend Chart */}
              <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6">
                <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-[Calibri,sans-serif]">Monthly Bookings Trend</h3>
                <div className="space-y-3">
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => {
                    const values = [65, 78, 85, 92]
                    const percentage = values[index]
                    return (
                      <div key={week}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-900 dark:text-gray-300">{week}</span>
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">{Math.floor(stats.monthBookings * (percentage / 100))}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-400 via-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Top Services Table */}
            <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6 mb-8">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-[Calibri,sans-serif]">Top Performing Services</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-500/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-300">Service</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-300">Bookings</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-300">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-300">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Haircut & Styling', bookings: 45, revenue: 2250, growth: '+15%' },
                      { name: 'Color Treatment', bookings: 32, revenue: 3200, growth: '+8%' },
                      { name: 'Manicure & Pedicure', bookings: 28, revenue: 1400, growth: '+22%' },
                      { name: 'Facial Treatment', bookings: 18, revenue: 1800, growth: '+5%' }
                    ].map((service, index) => (
                      <tr key={index} className="border-b border-purple-500/10 hover:bg-purple-900/15 transition-colors">
                        <td className="py-3 px-4 text-sm text-black dark:text-white font-medium">{service.name}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-gray-300">{service.bookings}</td>
                        <td className="py-3 px-4 text-sm text-center text-purple-700 dark:text-purple-400 font-semibold">{service.revenue} GEL</td>
                        <td className="py-3 px-4 text-sm text-right text-green-700 dark:text-green-400 font-semibold">{service.growth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Setup Progress */}
            {(stats.services === 0 || stats.specialists === 0) && (
              <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 border border-purple-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-black dark:text-white mb-3 font-[Calibri,sans-serif]">Complete Your Setup</h3>
                <div className="space-y-3">
                  {stats.services === 0 && (
                    <Link to="/services" className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:shadow-md hover:border-purple-600 border border-transparent transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm shadow-lg shadow-purple-500/30">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black dark:text-white">Add your first service</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300">Create your service catalog with pricing</p>
                        </div>
                      </div>
                      <span className="text-purple-700 dark:text-purple-400">→</span>
                    </Link>
                  )}
                  {stats.specialists === 0 && (
                    <Link to="/specialists" className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:shadow-md hover:border-purple-600 border border-transparent transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm shadow-lg shadow-purple-500/30">
                          👥
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black dark:text-white">Add your first specialist</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300">Add your team members and assign services</p>
                        </div>
                      </div>
                      <span className="text-purple-700 dark:text-purple-400">→</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
