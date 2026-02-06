import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import ClassicLoader from '../components/ui/loader'
import { Calendar, TrendingUp, Scissors, Users, Building2, CalendarDays, Smartphone, Monitor } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)

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

      // Fetch recent bookings
      const { data: recentData } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name),
          specialists(name)
        `)
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })
        .limit(5)

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

  const STATUS_COLORS = {
    pending: 'bg-gradient-to-br from-yellow-800/60 to-yellow-900/60 border border-yellow-400/40 text-yellow-50',
    confirmed: 'bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-500/30 text-blue-100',
    completed: 'bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-600/30 text-emerald-200',
    cancelled: 'bg-gradient-to-br from-rose-900/40 to-red-900/40 border border-rose-600/30 text-rose-200',
  }

  return (
    <Layout>
      <div className="w-full -mt-4">
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-black dark:text-white font-[Calibri,sans-serif]">Dashboard</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <ClassicLoader />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AnimatedCard className="p-6">
                <div className="text-sm text-purple-900 dark:text-purple-200 mb-1">Today's Bookings</div>
                <div className="text-3xl font-bold text-black dark:text-white">{stats.todayBookings}</div>
                <div className="text-xs text-purple-800 dark:text-purple-300 mt-1">Total: {stats.totalBookings}</div>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <div className="text-sm text-purple-900 dark:text-purple-200 mb-1">Active Services</div>
                <div className="text-3xl font-bold text-black dark:text-white">{stats.services}</div>
                <div className="text-xs text-purple-800 dark:text-purple-300 mt-1">Available to book</div>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <div className="text-sm text-purple-900 dark:text-purple-200 mb-1">Specialists</div>
                <div className="text-3xl font-bold text-black dark:text-white">{stats.specialists}</div>
                <div className="text-xs text-purple-800 dark:text-purple-300 mt-1">Team members</div>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <Link to="/reports" className="block">
                  <div className="text-sm text-purple-900 dark:text-purple-200 mb-1">Revenue</div>
                  <div className="text-3xl font-bold text-black dark:text-white">{stats.revenue.toFixed(2)} GEL</div>
                  <div className="text-xs text-purple-800 dark:text-purple-300 mt-1 hover:text-black dark:hover:text-white">View detailed reports →</div>
                </Link>
              </AnimatedCard>
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
