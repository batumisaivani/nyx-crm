import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import RevenueCircle from '../components/ui/RevenueCircle'
import ClassicLoader from '../components/ui/loader'
import { Calendar, TrendingUp, Scissors, Users, Building2, CalendarDays, Brain, ChevronDown, ExternalLink, Send, Clock, Tag, Zap, Plus, Sparkles, Shield, Settings, CheckCircle2, X, Camera } from 'lucide-react'
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
    revenue: 0,
    earnedRevenue: 0,
    projectedRevenue: 0,
    prevEarnedRevenue: 0,
    prevTotalRevenue: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    avgServiceTime: 0,
    completedBookings: 0,
    totalFinishedBookings: 0,
    avgRating: 0,
    totalReviews: 0,
    weeklyTrend: [0, 0, 0, 0],
    topServices: [],
    todayCompleted: 0,
    todayPending: 0,
    todayConfirmed: 0,
    todayCancelled: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [salonImage, setSalonImage] = useState(null)
  const [nextBooking, setNextBooking] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState(null)
  const [autopilotEnabled, setAutopilotEnabled] = useState(false)
  const [showGuardrails, setShowGuardrails] = useState(false)
  const [guardrails, setGuardrails] = useState({
    monthlyBudget: 200,
    maxDiscount: 20,
    clientFrequency: 2,
  })

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
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      const threeWeeksAgo = new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0]

      // Fetch all data in parallel
      const [servicesRes, specialistsRes, allBookingsRes, todayBookingsRes, monthBookingsRes, todayRevenueRes, yesterdayRevenueRes, avgServiceTimeRes, reviewsRes, weeklyBookingsRes, topServicesRes, prevMonthServicesRes, monthPaymentsRes] = await Promise.all([
        supabase.from('services').select('id').eq('salon_id', salonId),
        supabase.from('specialists').select('id').eq('salon_id', salonId),
        supabase.from('bookings').select('id, status').eq('salon_id', salonId),
        supabase.from('bookings').select('id, status').eq('salon_id', salonId).eq('booking_date', today),
        supabase.from('bookings')
          .select('*, services(price)')
          .eq('salon_id', salonId)
          .gte('booking_date', firstDayOfMonth),
        supabase.from('bookings')
          .select('final_price, services(price)')
          .eq('salon_id', salonId)
          .eq('booking_date', today)
          .eq('status', 'completed'),
        supabase.from('bookings')
          .select('final_price, services(price)')
          .eq('salon_id', salonId)
          .eq('booking_date', yesterday)
          .eq('status', 'completed'),
        supabase.from('bookings')
          .select('services(duration_minutes)')
          .eq('salon_id', salonId)
          .eq('status', 'completed')
          .gte('booking_date', firstDayOfMonth),
        supabase.from('reviews')
          .select('rating')
          .eq('salon_id', salonId),
        supabase.from('bookings')
          .select('booking_date')
          .eq('salon_id', salonId)
          .gte('booking_date', threeWeeksAgo)
          .lte('booking_date', today),
        supabase.from('bookings')
          .select('service_id, final_price, services(name, price)')
          .eq('salon_id', salonId)
          .eq('status', 'completed')
          .gte('booking_date', firstDayOfMonth),
        supabase.from('bookings')
          .select('service_id, status, final_price, services(name, price)')
          .eq('salon_id', salonId)
          .eq('status', 'completed')
          .gte('booking_date', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0])
          .lt('booking_date', firstDayOfMonth),
        supabase.from('payments')
          .select('booking_id, amount_paid')
          .eq('salon_id', salonId)
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
          .select('*, services(name), specialists(name)')
          .eq('salon_id', salonId)
          .gte('booking_date', today)
          .in('status', ['pending', 'confirmed'])
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(3)
      ])

      // Build payments lookup (booking_id -> amount_paid)
      const paymentsMap = {}
      ;(monthPaymentsRes.data || []).forEach(p => { paymentsMap[p.booking_id] = p.amount_paid })

      // Calculate revenue: use payments.amount_paid for completed (most accurate), then final_price, then service price
      const calcRevenue = (data) => data?.reduce((sum, b) => {
        const paid = paymentsMap[b.id]
        return sum + (paid != null ? paid : (b.final_price || b.services?.price || 0))
      }, 0) || 0

      const monthBookings = monthBookingsRes.data || []
      const completedMonthBookings = monthBookings.filter(b => b.status === 'completed')
      const revenue = calcRevenue(completedMonthBookings)
      const earnedRevenue = calcRevenue(completedMonthBookings)
      const projectedRevenue = calcRevenue(monthBookings.filter(b => b.status === 'pending' || b.status === 'confirmed'))
      const todayRevenue = calcRevenue(todayRevenueRes.data)
      const yesterdayRevenue = calcRevenue(yesterdayRevenueRes.data)

      // Avg service time from completed bookings this month
      const durations = avgServiceTimeRes.data?.map(b => b.services?.duration_minutes).filter(Boolean) || []
      const avgServiceTime = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

      // Completed vs total finished (completed + cancelled) for efficiency
      const allStatuses = allBookingsRes.data || []
      const completedBookings = allStatuses.filter(b => b.status === 'completed').length
      const totalFinished = allStatuses.length

      // Today's status breakdown
      const todayAll = todayBookingsRes.data || []
      const todayCompleted = todayAll.filter(b => b.status === 'completed').length
      const todayPending = todayAll.filter(b => b.status === 'pending').length
      const todayConfirmed = todayAll.filter(b => b.status === 'confirmed').length
      const todayCancelled = todayAll.filter(b => b.status === 'cancelled').length

      // Reviews
      const reviews = reviewsRes.data || []
      const totalReviews = reviews.length
      const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : 0

      // Last month revenue for growth comparison
      const prevMonthBookings = prevMonthServicesRes.data || []
      const prevEarnedRevenue = calcRevenue(prevMonthBookings.filter(b => b.status === 'completed'))
      const prevTotalRevenue = calcRevenue(prevMonthBookings)

      // Top performing services (this month vs last month)
      const serviceMap = {}
      ;(topServicesRes.data || []).forEach(b => {
        const name = b.services?.name || 'Unknown'
        if (!serviceMap[name]) serviceMap[name] = { name, bookings: 0, revenue: 0 }
        serviceMap[name].bookings++
        const paid = paymentsMap[b.id]
        serviceMap[name].revenue += paid != null ? paid : (b.final_price || b.services?.price || 0)
      })
      const prevServiceMap = {}
      ;(prevMonthServicesRes.data || []).forEach(b => {
        const name = b.services?.name || 'Unknown'
        if (!prevServiceMap[name]) prevServiceMap[name] = { bookings: 0 }
        prevServiceMap[name].bookings++
      })
      const topServices = Object.values(serviceMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(s => {
          const prev = prevServiceMap[s.name]?.bookings || 0
          const growth = prev > 0 ? Math.round(((s.bookings - prev) / prev) * 100) : (s.bookings > 0 ? 100 : 0)
          return { ...s, growth }
        })

      // Weekly bookings trend (current week, prev week, 2 weeks ago, 3 weeks ago)
      const now = new Date()
      const dayOfWeek = now.getDay() || 7 // Monday = 1, Sunday = 7
      const currentWeekStart = new Date(now)
      currentWeekStart.setDate(now.getDate() - dayOfWeek + 1)
      currentWeekStart.setHours(0, 0, 0, 0)

      const weeklyTrend = [0, 0, 0, 0] // [3 weeks ago, 2 weeks ago, prev week, current week]
      const weeklyBookings = weeklyBookingsRes.data || []
      weeklyBookings.forEach(b => {
        const bookingDate = new Date(b.booking_date + 'T00:00:00')
        const diffDays = Math.floor((currentWeekStart - bookingDate) / 86400000)
        if (bookingDate >= currentWeekStart) {
          weeklyTrend[3]++
        } else if (diffDays < 7) {
          weeklyTrend[2]++
        } else if (diffDays < 14) {
          weeklyTrend[1]++
        } else {
          weeklyTrend[0]++
        }
      })

      setStats({
        totalBookings: allBookingsRes.data?.length || 0,
        todayBookings: todayBookingsRes.data?.length || 0,
        monthBookings: monthBookingsRes.data?.length || 0,
        services: servicesRes.data?.length || 0,
        specialists: specialistsRes.data?.length || 0,
        revenue,
        earnedRevenue,
        projectedRevenue,
        prevEarnedRevenue,
        prevTotalRevenue,
        todayRevenue,
        yesterdayRevenue,
        avgServiceTime,
        completedBookings,
        totalFinishedBookings: totalFinished,
        avgRating,
        totalReviews,
        weeklyTrend,
        topServices,
        todayCompleted,
        todayPending,
        todayConfirmed,
        todayCancelled
      })

      // Fetch first gallery image for background
      const { data: galleryData } = await supabase
        .from('salon_images')
        .select('image_url')
        .eq('salon_id', salonId)
        .order('display_order')
        .limit(1)
      setSalonImage(galleryData?.[0]?.image_url || null)

      setRecentBookings(recentData || [])
      setNextBooking(nextData || [])
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

  const recommendedActions = [
    {
      id: 'ra1', text: 'Send 15% off to Ana', time: 'Suggested',
      detail: 'She viewed Hair Coloring 3 times without booking. A discount could convert her.',
      action: 'Create promo', link: '/promos', icon: Tag,
      autopilot: { tool: 'Discount', cost: '$15', clvAtRisk: '$1,300', roi: '52x', status: 'Sent 2h ago' },
    },
    {
      id: 'ra2', text: 'Re-engage Dato with loyalty offer', time: 'Suggested',
      detail: 'Inactive for 30+ days. Send a personalized comeback offer to retain.',
      action: 'Send offer', link: '/promos', icon: Send,
      autopilot: { tool: 'NyxCoins bonus', cost: '$0', clvAtRisk: '$890', roi: '∞', status: 'Sent 5h ago' },
    },
    {
      id: 'ra3', text: 'Add evening slots on Thursdays', time: 'Opportunity',
      detail: '12 booking requests were declined last month due to no availability after 6 PM.',
      action: 'Edit schedule', link: '/specialists', icon: Clock,
      autopilot: { tool: 'Flagged', cost: '$0', note: 'Requires manual action', status: 'Needs review' },
    },
    {
      id: 'ra4', text: 'Promote Nail Art — high demand', time: 'Trending',
      detail: 'Search volume for nail art increased 40% this month in your area.',
      action: 'Boost service', link: '/services', icon: Zap,
      autopilot: { tool: 'Push notification', cost: '$0', clvAtRisk: '$2,100', roi: '∞', status: 'Queued' },
    },
  ]

  return (
    <Layout>
      <div className="w-full -mt-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <ClassicLoader />
          </div>
        ) : (
          <>

            {/* Hero: Image | Revenue | Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Today's Status & Next Booking */}
              <AnimatedCard className="overflow-hidden h-full flex flex-col">
                <div className="px-5 pt-5 pb-3">
                  <p className="text-gray-500 text-[10px] font-medium tracking-[0.2em] uppercase">
                    {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                  </p>
                  <p className="text-gray-800 text-lg font-bold mt-0.5">{facilityAccess?.salons?.name || 'Your Salon'}</p>
                </div>

                {/* Today's Progress */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Today's Progress</span>
                    <span className="text-xs font-semibold text-gray-600">{stats.todayCompleted}/{stats.todayBookings}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${stats.todayBookings > 0 ? (stats.todayCompleted / stats.todayBookings) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-emerald-100 border border-emerald-200 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-emerald-600">{stats.todayCompleted}</p>
                      <p className="text-[9px] text-emerald-600/70 uppercase tracking-wide">Done</p>
                    </div>
                    <div className="bg-blue-100 border border-blue-200 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-blue-600">{stats.todayConfirmed}</p>
                      <p className="text-[9px] text-blue-600/70 uppercase tracking-wide">Confirmed</p>
                    </div>
                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-yellow-400">{stats.todayPending}</p>
                      <p className="text-[9px] text-yellow-600/70 uppercase tracking-wide">Pending</p>
                    </div>
                    <div className="bg-rose-100 border border-rose-200 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-rose-400">{stats.todayCancelled}</p>
                      <p className="text-[9px] text-rose-600/70 uppercase tracking-wide">Cancelled</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-5 border-t border-gray-200" />

                {/* Next Booking Spotlight */}
                <div className="px-5 py-4 flex-1 flex flex-col">
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gray-500 mb-3">Upcoming Bookings</p>
                  {nextBooking.length > 0 ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-2 overflow-y-auto max-h-[200px] pr-1">
                        {nextBooking.map((booking, i) => (
                          <div key={booking.id} className={`flex items-center gap-2.5 py-1.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-bold text-purple-400">{formatTime(booking.booking_time)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{booking.customer_name || 'Guest'}</p>
                              <p className="text-[10px] text-gray-500 truncate">{booking.services?.name || 'Service'} · {booking.specialists?.name || 'Any'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Link
                        to="/calendar"
                        className="mt-3 flex items-center justify-center w-full py-2 rounded-xl border border-white/[0.08] text-gray-600 text-xs font-medium hover:bg-gray-100 hover:text-gray-800/80 transition-all"
                      >
                        View in Calendar
                      </Link>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400">No upcoming bookings</p>
                    </div>
                  )}
                </div>
              </AnimatedCard>

              {/* Revenue Circle */}
              <RevenueCircle total={Math.round(stats.revenue)} earned={Math.round(stats.earnedRevenue)} projected={Math.round(stats.projectedRevenue)} prevEarned={Math.round(stats.prevEarnedRevenue)} prevTotal={Math.round(stats.prevTotalRevenue)} />

              {/* Marketing Card */}
              <div className="bg-gradient-to-br from-[#9489E2] to-[#7b6fd4] rounded-2xl p-5 flex flex-col h-full text-white" style={{ boxShadow: '0 4px 16px rgba(148,137,226,0.3)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Marketing Hub</span>
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <Link to="/marketing" className="flex flex-col items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl p-3 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-center">Stories</span>
                  </Link>
                  <Link to="/marketing" className="flex flex-col items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl p-3 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-center">New Promo</span>
                  </Link>
                  <Link to="/marketing" className="flex flex-col items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl p-3 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-center">Discounts</span>
                  </Link>
                  <Link to="/marketing" className="flex flex-col items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl p-3 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-center">Create Ad</span>
                  </Link>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/15 text-[10px]">
                  <span className="opacity-60">{stats.todayBookings} bookings today</span>
                  <span className="opacity-60">{stats.services} services · {stats.specialists} specialists</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="relative bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-[0_2px_8px_rgba(0,0,0,0.15)] mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 font-[Calibri,sans-serif]">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <AnimatedCard className="p-4">
                  <Link to="/calendar" className="block text-left">
                    <CalendarDays className="w-6 h-6 mb-2 text-[#9489E2]" />
                    <div className="text-sm font-medium text-gray-900">View Calendar</div>
                    <div className="text-xs text-gray-500 mt-1">See today's schedule</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/reports" className="block text-left">
                    <TrendingUp className="w-6 h-6 mb-2 text-[#9489E2]" />
                    <div className="text-sm font-medium text-gray-900">View Reports</div>
                    <div className="text-xs text-gray-500 mt-1">Analytics & insights</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/services" className="block text-left">
                    <Scissors className="w-6 h-6 mb-2 text-[#9489E2]" />
                    <div className="text-sm font-medium text-gray-900">Manage Services</div>
                    <div className="text-xs text-gray-500 mt-1">Add or edit services</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/specialists" className="block text-left">
                    <Users className="w-6 h-6 mb-2 text-[#9489E2]" />
                    <div className="text-sm font-medium text-gray-900">Manage Specialists</div>
                    <div className="text-xs text-gray-500 mt-1">Add or edit team members</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/profile" className="block text-left">
                    <Building2 className="w-6 h-6 mb-2 text-[#9489E2]" />
                    <div className="text-sm font-medium text-gray-900">Edit Profile</div>
                    <div className="text-xs text-gray-500 mt-1">Update facility info</div>
                  </Link>
                </AnimatedCard>

                <AnimatedCard className="p-4">
                  <Link to="/bookings" className="block text-left">
                    <Calendar className="w-6 h-6 mb-2 text-[#9489E2]" />
                    <div className="text-sm font-medium text-gray-900">Recent Bookings</div>
                    <div className="text-xs text-gray-500 mt-1">View all bookings</div>
                  </Link>
                </AnimatedCard>
              </div>
            </div>

            {/* Smart Intelligence */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-[#9489E2]" />
                <h3 className="text-lg font-bold text-gray-800 font-[Calibri,sans-serif]">Smart Intelligence</h3>
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

                {/* Panel 3 — Recommended Actions + Autopilot */}
                <div className={`feat-panel feat-panel-3 transition-all ${autopilotEnabled ? 'ring-1 ring-purple-500/20' : ''}`}>
                  <div className="feat-panel-head">
                    <span className="feat-panel-name">Recommended Actions</span>
                    <div className="flex items-center gap-2">
                      {autopilotEnabled && (
                        <button onClick={() => setShowGuardrails(true)} className="text-gray-500 hover:text-purple-400 transition-colors cursor-pointer">
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const next = !autopilotEnabled
                          setAutopilotEnabled(next)
                          if (next) setShowGuardrails(true)
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                          autopilotEnabled
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                            : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        Autopilot {autopilotEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Budget usage bar */}
                  <AnimatePresence>
                    {autopilotEnabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pt-3 pb-1">
                          <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="text-gray-500">Monthly budget used</span>
                            <span className="text-purple-400 font-semibold">$47 / ${guardrails.monthlyBudget}</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(47 / guardrails.monthlyBudget) * 100}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                            <span>3 actions taken</span>
                            <span className="text-emerald-600">2 converted</span>
                            <span>1 pending</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-4 space-y-1">
                    {recommendedActions.map((item, i) => {
                      const ActionIcon = item.icon
                      const ap = item.autopilot
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            className="flex items-center gap-3 w-full text-left py-2 px-1 -mx-1 rounded-lg hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="feat-sn feat-sn-3">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate">{item.text}</p>
                              <p className="text-[11px] text-gray-500">
                                {autopilotEnabled ? ap.status : item.time}
                              </p>
                            </div>
                            {autopilotEnabled && ap.status.includes('Sent') && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            )}
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

                                  {autopilotEnabled ? (
                                    <div className="space-y-2">
                                      {/* AI reasoning row */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">
                                          <Sparkles className="w-2.5 h-2.5" />
                                          {ap.tool}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                          Cost: <span className="text-gray-300">{ap.cost}</span>
                                        </span>
                                        {ap.clvAtRisk && (
                                          <span className="text-[10px] text-gray-500">
                                            CLV at risk: <span className="text-orange-400">{ap.clvAtRisk}</span>
                                          </span>
                                        )}
                                        {ap.roi && (
                                          <span className="text-[10px] text-gray-500">
                                            ROI: <span className="text-emerald-600 font-semibold">{ap.roi}</span>
                                          </span>
                                        )}
                                      </div>
                                      {/* Status badge */}
                                      <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                                        ap.status.includes('Sent') ? 'text-emerald-600' :
                                        ap.status === 'Queued' ? 'text-amber-400' : 'text-orange-400'
                                      }`}>
                                        {ap.status.includes('Sent') ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {ap.status}
                                      </div>
                                    </div>
                                  ) : (
                                    <Link to={item.link} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors">
                                      <ActionIcon className="w-3 h-3" />
                                      {item.action}
                                    </Link>
                                  )}
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
              <div className="relative bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-[Calibri,sans-serif]">Performance Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-700">Today's Revenue</p>
                      <p className="text-2xl font-bold text-[#9489E2]">{stats.todayRevenue.toFixed(2)} GEL</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">vs Yesterday</p>
                      {stats.yesterdayRevenue > 0 ? (
                        <p className={`text-sm font-semibold ${stats.todayRevenue >= stats.yesterdayRevenue ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.todayRevenue >= stats.yesterdayRevenue ? '+' : ''}{(((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100).toFixed(0)}%
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-gray-500">—</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-700">Avg. Service Time</p>
                      <p className="text-xl font-bold text-[#9489E2]">{stats.avgServiceTime > 0 ? `${stats.avgServiceTime} min` : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Completion Rate</p>
                      <p className="text-sm font-semibold text-green-600">
                        {stats.totalFinishedBookings > 0 ? `${Math.round((stats.completedBookings / stats.totalFinishedBookings) * 100)}%` : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Customer Satisfaction</p>
                      <p className="text-xl font-bold text-[#9489E2]">{stats.totalReviews > 0 ? `${stats.avgRating} / 5.0` : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Reviews</p>
                      <p className="text-sm font-semibold text-gray-700">{stats.totalReviews}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Trend Chart */}
              <div className="relative bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-[Calibri,sans-serif]">Weekly Bookings Trend</h3>
                <div className="space-y-3">
                  {['Current Week', 'Previous Week', '2 Weeks Ago', '3 Weeks Ago'].map((label, index) => {
                    const count = stats.weeklyTrend[3 - index]
                    const maxCount = Math.max(...stats.weeklyTrend, 1)
                    const percentage = (count / maxCount) * 100
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{label}</span>
                          <span className="text-sm font-semibold text-[#9489E2]">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#9489E2] h-2 rounded-full transition-all duration-500"
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
            <div className="relative bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-[0_2px_8px_rgba(0,0,0,0.15)] mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 font-[Calibri,sans-serif]">Top Performing Services</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Bookings</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 text-gray-700">
                        <span className="text-sm font-semibold block">Growth</span>
                        <span className="text-[10px] font-normal text-gray-500">vs Previous Month</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topServices.length > 0 ? stats.topServices.map((service, index) => (
                      <tr key={index} className="border-b border-purple-500/10 hover:bg-purple-900/15 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{service.name}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-700">{service.bookings}</td>
                        <td className="py-3 px-4 text-sm text-center text-[#9489E2] font-semibold">{service.revenue.toFixed(0)} GEL</td>
                        <td className={`py-3 px-4 text-sm text-right font-semibold ${service.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {service.growth >= 0 ? '+' : ''}{service.growth}%
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-sm text-gray-500">No bookings this month</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Setup Progress */}
            {(stats.services === 0 || stats.specialists === 0) && (
              <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 border border-purple-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 font-[Calibri,sans-serif]">Complete Your Setup</h3>
                <div className="space-y-3">
                  {stats.services === 0 && (
                    <Link to="/services" className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:shadow-md hover:border-purple-600 border border-transparent transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 text-gray-800 rounded-full flex items-center justify-center text-sm shadow-lg shadow-purple-500/30">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Add your first service</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300">Create your service catalog with pricing</p>
                        </div>
                      </div>
                      <span className="text-[#9489E2]">→</span>
                    </Link>
                  )}
                  {stats.specialists === 0 && (
                    <Link to="/specialists" className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:shadow-md hover:border-purple-600 border border-transparent transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 text-gray-800 rounded-full flex items-center justify-center text-sm shadow-lg shadow-purple-500/30">
                          👥
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Add your first specialist</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300">Add your team members and assign services</p>
                        </div>
                      </div>
                      <span className="text-[#9489E2]">→</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Autopilot Guardrails Modal */}
      <AnimatePresence>
        {showGuardrails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowGuardrails(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#1a1625] border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-800">Autopilot Guardrails</h3>
                </div>
                <button onClick={() => setShowGuardrails(false)} className="text-gray-400 hover:text-gray-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Monthly budget */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Monthly discount budget</span>
                    <span className="text-sm font-bold text-purple-400">${guardrails.monthlyBudget}</span>
                  </div>
                  <input
                    type="range" min="50" max="500" step="25"
                    value={guardrails.monthlyBudget}
                    onChange={(e) => setGuardrails(g => ({ ...g, monthlyBudget: +e.target.value }))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>$50</span><span>$500</span>
                  </div>
                </div>

                {/* Max discount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Max discount per offer</span>
                    <span className="text-sm font-bold text-purple-400">{guardrails.maxDiscount}%</span>
                  </div>
                  <input
                    type="range" min="5" max="30" step="5"
                    value={guardrails.maxDiscount}
                    onChange={(e) => setGuardrails(g => ({ ...g, maxDiscount: +e.target.value }))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>5%</span><span>30%</span>
                  </div>
                </div>

                {/* Client frequency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Max offers per client / month</span>
                    <span className="text-sm font-bold text-purple-400">{guardrails.clientFrequency}x</span>
                  </div>
                  <input
                    type="range" min="1" max="4" step="1"
                    value={guardrails.clientFrequency}
                    onChange={(e) => setGuardrails(g => ({ ...g, clientFrequency: +e.target.value }))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>1x</span><span>4x</span>
                  </div>
                </div>
              </div>

              {/* Toolbox explainer */}
              <div className="mt-5 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  <span className="text-purple-400 font-semibold">How it works: </span>
                  AI exhausts free actions first — loyalty nudges, streak reminders, push notifications. Discounts are the last resort, and only when the expected return exceeds the cost. Every action is logged for full transparency.
                </p>
              </div>

              {/* Action priority */}
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Action priority (AI tries top-down)</p>
                {[
                  { label: 'Push notification', cost: 'Free', color: 'text-emerald-600' },
                  { label: 'NyxCoins loyalty bonus', cost: 'Free', color: 'text-emerald-600' },
                  { label: 'Streak-break warning', cost: 'Free', color: 'text-emerald-600' },
                  { label: 'Personalized SMS', cost: '~$0.01', color: 'text-gray-400' },
                  { label: 'Discount offer', cost: 'Budget', color: 'text-orange-400' },
                ].map((tool, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 w-3">{i + 1}.</span>
                      <span className="text-xs text-gray-300">{tool.label}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${tool.color}`}>{tool.cost}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowGuardrails(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-gray-800 text-sm font-semibold transition-colors cursor-pointer"
              >
                Save Guardrails
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
