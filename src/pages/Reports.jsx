import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import CalendarPicker from '../components/ui/CalendarPicker'
import ClassicLoader from '../components/ui/loader'
import { DollarSign, ClipboardList, BarChart3, TrendingUp, Calendar, Gift } from 'lucide-react'

export default function Reports() {
  const { facilityAccess } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [openCalendar, setOpenCalendar] = useState(null) // 'from', 'to', or null

  // Analytics data
  const [revenueData, setRevenueData] = useState({
    total: 0,
    totalPrevious: 0,
    trend: [],
  })
  const [bookingsData, setBookingsData] = useState({
    total: 0,
    totalPrevious: 0,
    byStatus: {},
  })
  const [promoData, setPromoData] = useState({
    totalDiscount: 0,
    promoUsage: [],
  })
  const [servicesData, setServicesData] = useState([])
  const [specialistsData, setSpecialistsData] = useState([])
  const [peakHours, setPeakHours] = useState([])
  const [specialistUtilisation, setSpecialistUtilisation] = useState([])
  const [workingHours, setWorkingHours] = useState([])

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchAnalytics()
    }
  }, [facilityAccess, dateRange, customStartDate, customEndDate])

  const getDateRange = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate)
      start.setHours(0, 0, 0, 0)

      const end = new Date(customEndDate)
      end.setHours(23, 59, 59, 999)

      return {
        start: start.toISOString(),
        end: end.toISOString(),
      }
    }

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }
  }

  const getPreviousDateRange = () => {
    const { start, end } = getDateRange()
    const startDate = new Date(start)
    const endDate = new Date(end)

    // Calculate the number of days in the current range
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

    const previousStart = new Date(startDate)
    previousStart.setDate(previousStart.getDate() - days)

    const previousEnd = new Date(startDate)

    return {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      const { start: prevStart, end: prevEnd } = getPreviousDateRange()

      // Fetch bookings for current period
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, service:services(name, price, duration_minutes), specialist:specialists(name)')
        .eq('salon_id', facilityAccess.salon_id)
        .gte('created_at', start)
        .lte('created_at', end)

      if (bookingsError) throw bookingsError

      // Fetch bookings for previous period (for comparison)
      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .gte('created_at', prevStart)
        .lte('created_at', prevEnd)

      // Calculate revenue
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.final_price || b.service?.price || 0), 0)
      const previousRevenue = (previousBookings || []).reduce(
        (sum, b) => sum + (b.final_price || 0),
        0
      )

      // Revenue trend by day
      const revenueTrend = {}
      bookings.forEach((booking) => {
        const date = new Date(booking.created_at).toLocaleDateString()
        revenueTrend[date] = (revenueTrend[date] || 0) + (booking.final_price || booking.service?.price || 0)
      })

      setRevenueData({
        total: totalRevenue,
        totalPrevious: previousRevenue,
        trend: Object.entries(revenueTrend).map(([date, amount]) => ({ date, amount })),
      })

      // Bookings by status
      const byStatus = {}
      bookings.forEach((booking) => {
        byStatus[booking.status] = (byStatus[booking.status] || 0) + 1
      })

      setBookingsData({
        total: bookings.length,
        totalPrevious: previousBookings?.length || 0,
        byStatus,
      })

      // Promo analytics
      const totalDiscount = bookings.reduce((sum, b) => sum + (b.discount_amount || 0), 0)
      const promoUsage = {}
      bookings.forEach((booking) => {
        if (booking.promo_code) {
          if (!promoUsage[booking.promo_code]) {
            promoUsage[booking.promo_code] = {
              code: booking.promo_code,
              uses: 0,
              totalDiscount: 0,
            }
          }
          promoUsage[booking.promo_code].uses++
          promoUsage[booking.promo_code].totalDiscount += booking.discount_amount || 0
        }
      })

      setPromoData({
        totalDiscount,
        promoUsage: Object.values(promoUsage).sort((a, b) => b.uses - a.uses),
      })

      // Services analytics
      const serviceStats = {}
      bookings.forEach((booking) => {
        const serviceName = booking.service?.name || 'Unknown'
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = {
            name: serviceName,
            bookings: 0,
            revenue: 0,
          }
        }
        serviceStats[serviceName].bookings++
        serviceStats[serviceName].revenue += booking.final_price || booking.service?.price || 0
      })

      setServicesData(
        Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue)
      )

      // Specialists analytics
      const specialistStats = {}
      bookings.forEach((booking) => {
        if (booking.specialist) {
          const specialistName = booking.specialist.name
          if (!specialistStats[specialistName]) {
            specialistStats[specialistName] = {
              name: specialistName,
              bookings: 0,
              revenue: 0,
            }
          }
          specialistStats[specialistName].bookings++
          specialistStats[specialistName].revenue += booking.final_price || booking.service?.price || 0
        }
      })

      setSpecialistsData(
        Object.values(specialistStats).sort((a, b) => b.revenue - a.revenue)
      )

      // Peak hours analysis
      const hourStats = {}
      bookings.forEach((booking) => {
        if (booking.booking_time) {
          const hour = parseInt(booking.booking_time.split(':')[0])
          hourStats[hour] = (hourStats[hour] || 0) + 1
        }
      })

      setPeakHours(
        Object.entries(hourStats)
          .map(([hour, count]) => ({
            hour: `${hour.padStart(2, '0')}:00`,
            count,
          }))
          .sort((a, b) => b.count - a.count)
      )

      // Fetch working hours for utilization calculation
      const { data: workingHoursData } = await supabase
        .from('working_hours')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)

      setWorkingHours(workingHoursData || [])

      // Fetch specialists for utilization
      const { data: specialistsForUtil } = await supabase
        .from('specialists')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)

      // Calculate specialist utilization for different time periods
      if (specialistsForUtil && workingHoursData) {
        const now = new Date()
        const utilData = specialistsForUtil.map(specialist => {
          // Calculate working hours per week
          let weeklyHours = 0
          workingHoursData.forEach(wh => {
            if (!wh.is_closed && wh.open_time && wh.close_time) {
              const [openH, openM] = wh.open_time.substring(0, 5).split(':').map(Number)
              const [closeH, closeM] = wh.close_time.substring(0, 5).split(':').map(Number)
              weeklyHours += (closeH * 60 + closeM - (openH * 60 + openM)) / 60
            }
          })

          // Filter bookings for this specialist
          const specBookings = bookings.filter(b => b.specialist_id === specialist.id && ['completed', 'confirmed'].includes(b.status))

          // Calculate for different periods
          const dayStart = new Date(now)
          dayStart.setHours(0, 0, 0, 0)
          const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

          const calculateUtil = (startDate) => {
            const filtered = specBookings.filter(b => new Date(b.created_at) >= startDate)
            const workedMinutes = filtered.reduce((sum, b) => sum + (b.service?.duration_minutes || 0), 0)
            const workedHours = workedMinutes / 60
            const daysSince = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))
            const weeksSince = daysSince / 7
            const availableHours = weeklyHours * weeksSince
            return availableHours > 0 ? Math.min(100, (workedHours / availableHours) * 100).toFixed(1) : '0.0'
          }

          return {
            name: specialist.name,
            day: calculateUtil(dayStart),
            week: calculateUtil(weekStart),
            month: calculateUtil(monthStart),
            quarter: calculateUtil(quarterStart)
          }
        })

        setSpecialistUtilisation(utilData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const exportToCSV = () => {
    const rows = [
      ['Nyxie CRM Analytics Report'],
      ['Date Range', dateRange === 'custom' ? `${customStartDate} to ${customEndDate}` : `Last ${dateRange} days`],
      [''],
      ['Revenue Summary'],
      ['Total Revenue', `${revenueData.total.toFixed(2)} GEL`],
      ['Total Discounts', `${promoData.totalDiscount.toFixed(2)} GEL`],
      ['Net Revenue', `${(revenueData.total - promoData.totalDiscount).toFixed(2)} GEL`],
      [''],
      ['Bookings Summary'],
      ['Total Bookings', bookingsData.total],
      ...Object.entries(bookingsData.byStatus).map(([status, count]) => [
        `${status.charAt(0).toUpperCase() + status.slice(1)} Bookings`,
        count,
      ]),
      [''],
      ['Top Services'],
      ['Service', 'Bookings', 'Revenue'],
      ...servicesData.map((s) => [s.name, s.bookings, `${s.revenue.toFixed(2)} GEL`]),
      [''],
      ['Top Specialists'],
      ['Specialist', 'Bookings', 'Revenue'],
      ...specialistsData.map((s) => [s.name, s.bookings, `${s.revenue.toFixed(2)} GEL`]),
    ]

    const csvContent = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nyx-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  const revenueChange = calculateChange(revenueData.total, revenueData.totalPrevious)
  const bookingsChange = calculateChange(bookingsData.total, bookingsData.totalPrevious)
  const avgTransactionValue = bookingsData.total > 0 ? revenueData.total / bookingsData.total : 0

  return (
    <div className="w-full -mt-4 overflow-visible">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-[Inter]">Analytics & Reports</h2>
          <p className="text-gray-300 mt-1">Insights and performance metrics</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-8 py-3 bg-purple-900/30 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/40 font-medium transition-all transform hover:scale-105"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-8 overflow-visible z-[1000]">
        <div className="flex items-center gap-3 overflow-visible">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-300" />
            <label className="text-sm font-medium text-gray-200">Date Range:</label>
          </div>
          <div className="flex gap-2">
            {['7', '30', '90', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-purple-900/30 border border-purple-500/10 text-white'
                    : 'bg-black/30 border border-purple-500/[0.06] text-gray-200 hover:border-purple-500/40'
                }`}
              >
                {range === 'custom' ? 'Custom' : `${range} Days`}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <>
              <div className="relative z-[100] overflow-visible">
                <CalendarPicker
                  value={customStartDate}
                  onChange={setCustomStartDate}
                  label="From"
                  isOpen={openCalendar === 'from'}
                  onToggle={(open) => setOpenCalendar(open ? 'from' : null)}
                />
              </div>
              <div className="relative z-[100] overflow-visible">
                <CalendarPicker
                  value={customEndDate}
                  onChange={setCustomEndDate}
                  minDate={customStartDate}
                  label="To"
                  isOpen={openCalendar === 'to'}
                  onToggle={(open) => setOpenCalendar(open ? 'to' : null)}
                />
              </div>
              <div className="pt-[18px]">
                <button
                  onClick={() => {
                    setCustomStartDate('')
                    setCustomEndDate('')
                    setOpenCalendar(null)
                  }}
                  className="px-3 py-2 bg-black/30 border border-purple-500/[0.06] text-gray-200 rounded-lg hover:border-purple-500/40 text-xs font-medium transition-all"
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-[1]">
        {/* Total Revenue */}
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <div className="text-sm text-purple-200">Total Revenue</div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{revenueData.total.toFixed(2)} GEL</div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                revenueChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}%
            </span>
            <span className="text-xs text-purple-300">vs previous period</span>
          </div>
        </AnimatedCard>

        {/* Total Bookings */}
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            <div className="text-sm text-purple-200">Total Bookings</div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{bookingsData.total}</div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                bookingsChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {bookingsChange >= 0 ? '↑' : '↓'} {Math.abs(bookingsChange).toFixed(1)}%
            </span>
            <span className="text-xs text-purple-300">vs previous period</span>
          </div>
        </AnimatedCard>

        {/* Avg Transaction Value */}
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <BarChart3 className="w-5 h-5 text-purple-300" />
            <div className="text-sm text-purple-200">Avg Transaction</div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{avgTransactionValue.toFixed(2)} GEL</div>
          <div className="text-xs text-purple-300">Per booking</div>
        </AnimatedCard>

        {/* Total Discounts */}
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Gift className="w-5 h-5 text-pink-400" />
            <div className="text-sm text-purple-200">Total Discounts</div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{promoData.totalDiscount.toFixed(2)} GEL</div>
          <div className="text-xs text-purple-300">
            {((promoData.totalDiscount / revenueData.total) * 100).toFixed(1)}% of revenue
          </div>
        </AnimatedCard>
      </div>

      {/* Revenue Trend */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6 z-[1]">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-semibold text-white font-[Inter]">Revenue Trend</h2>
        </div>
        {revenueData.trend.length > 0 ? (
          <div className="space-y-3">
            {revenueData.trend.map((item, index) => (
              <div key={index}>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-300 w-28 font-medium">{item.date}</div>
                  <div className="flex-1 bg-black/30 rounded-full h-7 overflow-hidden border border-purple-500/[0.06]">
                    <div
                      className="bg-gradient-to-r from-purple-800/100 via-purple-900/100 to-violet-900/100 h-full rounded-full flex items-center justify-end px-3 shadow-lg"
                      style={{
                        width: `${Math.max((item.amount / Math.max(...revenueData.trend.map((t) => t.amount))) * 100, 5)}%`,
                      }}
                    >
                      <span className="text-xs font-semibold text-white whitespace-nowrap">{item.amount.toFixed(2)} GEL</span>
                    </div>
                  </div>
                </div>
                {index < revenueData.trend.length - 1 && (
                  <div className="ml-28 border-b border-purple-500/[0.06] my-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-300 text-center py-8">No revenue data for this period</p>
        )}
      </div>

      {/* Booking Status Breakdown */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6 z-[1]">
        <div className="flex items-center space-x-3 mb-4">
          <ClipboardList className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-semibold text-white font-[Inter]">Booking Status</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(bookingsData.byStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-purple-900/30 border border-purple-500/10 rounded-lg">
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-sm text-purple-300 mt-1 capitalize">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout for Services and Specialists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 relative z-[1]">
        {/* Top Services */}
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg font-semibold text-white font-[Inter]">Top Services</h2>
          </div>
          {servicesData.length > 0 ? (
            <div className="space-y-3">
              {servicesData.slice(0, 5).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-purple-900/30 border border-purple-500/10 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-white">{service.name}</p>
                    <p className="text-sm text-purple-300">{service.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">{service.revenue.toFixed(2)} GEL</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-center py-8">No service data</p>
          )}
        </div>

        {/* Top Specialists */}
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg font-semibold text-white font-[Inter]">Top Specialists</h2>
          </div>
          {specialistsData.length > 0 ? (
            <div className="space-y-3">
              {specialistsData.slice(0, 5).map((specialist, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-purple-900/30 border border-purple-500/10 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-white">{specialist.name}</p>
                    <p className="text-sm text-purple-300">{specialist.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">{specialist.revenue.toFixed(2)} GEL</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-center py-8">No specialist data</p>
          )}
        </div>
      </div>

      {/* Promo Performance */}
      {promoData.promoUsage.length > 0 && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6 z-[1]">
          <div className="flex items-center space-x-3 mb-4">
            <Gift className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-semibold text-white font-[Inter]">Promo Code Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-purple-200">Promo Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-purple-200">Uses</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-purple-200">Total Discount</th>
                </tr>
              </thead>
              <tbody>
                {promoData.promoUsage.map((promo, index) => (
                  <tr key={index} className="border-b border-purple-500/[0.06]">
                    <td className="py-3 px-4 font-medium text-white">{promo.code}</td>
                    <td className="py-3 px-4 text-gray-300">{promo.uses}</td>
                    <td className="py-3 px-4 text-green-400 font-semibold">
                      {promo.totalDiscount.toFixed(2)} GEL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Specialist Utilisation Rate */}
      {specialistUtilisation.length > 0 && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6 z-[1]">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg font-semibold text-white font-[Inter]">Specialist Utilisation Rate</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/10">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-purple-200">Specialist</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-purple-200">Day</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-purple-200">Week</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-purple-200">Month</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-purple-200">Quarter</th>
                </tr>
              </thead>
              <tbody>
                {specialistUtilisation.map((specialist, index) => (
                  <tr key={index} className="border-b border-purple-500/[0.06] hover:bg-purple-900/30 transition-all">
                    <td className="py-3 px-4 text-white font-medium">{specialist.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 bg-purple-900/30 border border-purple-500/10 rounded-full text-white font-bold text-sm">
                        {specialist.day}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 bg-purple-900/30 border border-purple-500/10 rounded-full text-white font-bold text-sm">
                        {specialist.week}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 bg-purple-900/30 border border-purple-500/10 rounded-full text-white font-bold text-sm">
                        {specialist.month}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 bg-purple-900/30 border border-purple-500/10 rounded-full text-white font-bold text-sm">
                        {specialist.quarter}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 z-[1]">
          <div className="flex items-center space-x-3 mb-4">
            <ClipboardList className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg font-semibold text-white font-[Inter]">Peak Booking Hours</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {peakHours.slice(0, 12).map((hour, index) => (
              <div key={index} className="text-center p-3 bg-purple-900/30 border border-purple-500/10 rounded-lg">
                <p className="text-lg font-bold text-white">{hour.count}</p>
                <p className="text-sm text-purple-300 mt-1">{hour.hour}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
