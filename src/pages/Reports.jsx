import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import DateRangeCalendar from '../components/ui/DateRangeCalendar'
import ClassicLoader from '../components/ui/loader'
import { DollarSign, ClipboardList, BarChart3, TrendingUp, Calendar, Gift, CalendarDays } from 'lucide-react'

export default function Reports() {
  const { facilityAccess } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [reportsCalendarOpen, setReportsCalendarOpen] = useState(false)
  const reportsCalendarAnchorRef = useRef(null)
  const [hoveredSlice, setHoveredSlice] = useState(null)

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
        .eq('status', 'completed')
        .gte('created_at', prevStart)
        .lte('created_at', prevEnd)

      // Only completed bookings count as revenue
      const completedBookings = bookings.filter(b => b.status === 'completed')

      // Calculate revenue from completed bookings only
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.final_price || b.service?.price || 0), 0)
      const previousRevenue = (previousBookings || []).reduce(
        (sum, b) => sum + (b.final_price || 0),
        0
      )

      // Revenue trend by day (completed only)
      const revenueTrend = {}
      completedBookings.forEach((booking) => {
        const d = new Date(booking.created_at)
        const isoKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!revenueTrend[isoKey]) revenueTrend[isoKey] = { amount: 0, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
        revenueTrend[isoKey].amount += (booking.final_price || booking.service?.price || 0)
      })

      setRevenueData({
        total: totalRevenue,
        totalPrevious: previousRevenue,
        trend: Object.entries(revenueTrend)
          .map(([key, { amount, label }]) => ({ date: label, sortKey: key, amount }))
          .sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
      })

      // Bookings by status (all bookings for status counts)
      const byStatus = {}
      bookings.forEach((booking) => {
        byStatus[booking.status] = (byStatus[booking.status] || 0) + 1
      })

      setBookingsData({
        total: bookings.length,
        totalPrevious: previousBookings?.length || 0,
        byStatus,
      })

      // Promo analytics (completed only)
      const totalDiscount = completedBookings.reduce((sum, b) => sum + (b.discount_amount || 0), 0)
      const promoUsage = {}
      completedBookings.forEach((booking) => {
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

      // Services analytics (completed only for revenue)
      const serviceStats = {}
      completedBookings.forEach((booking) => {
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

      // Specialists analytics (completed only for revenue)
      const specialistStats = {}
      completedBookings.forEach((booking) => {
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
      ['Nyxie.Business Analytics Report'],
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
        <h2 className="text-2xl font-bold text-gray-800 font-[Inter]">Analytics & Reports</h2>
        <button
          onClick={exportToCSV}
          className="px-5 py-2 bg-[#9489E2] text-white border border-[#9489E2] rounded-lg hover:bg-[#8078d0] font-medium text-sm transition-all flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 overflow-visible z-[1000]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3 overflow-visible">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {['7', '30', '90', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === 'custom' ? 'Custom' : `${range} Days`}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <>
              <div className="h-6 w-px bg-gray-200" />
              <div className="relative">
                <button
                  ref={reportsCalendarAnchorRef}
                  onClick={() => setReportsCalendarOpen(!reportsCalendarOpen)}
                  className={`flex items-center gap-2 px-4 py-1.5 bg-white/50 border border-gray-200 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-all ${customStartDate && customEndDate ? 'border-[#9489E2]/40' : ''}`}
                >
                  <CalendarDays className="w-4 h-4 text-[#9489E2]" />
                  <span className="text-xs font-medium text-gray-800">
                    {customStartDate && customEndDate
                      ? `${new Date(customStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(customEndDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'Select Range'
                    }
                  </span>
                </button>
                <DateRangeCalendar
                  isOpen={reportsCalendarOpen}
                  onClose={() => setReportsCalendarOpen(false)}
                  dateFrom={customStartDate}
                  dateTo={customEndDate}
                  anchorRef={reportsCalendarAnchorRef}
                  onSelect={(from, to) => {
                    setCustomStartDate(from)
                    setCustomEndDate(to)
                  }}
                />
              </div>
              {customStartDate && customEndDate && (
                <button
                  onClick={() => { setCustomStartDate(''); setCustomEndDate('') }}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 text-xs font-medium transition-all"
                >
                  Reset
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-[1]">
        <AnimatedCard className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[11px] text-gray-800 font-semibold uppercase tracking-wide">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{revenueData.total.toFixed(0)} <span className="text-xs font-medium text-gray-400">₾</span></div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs font-medium ${revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-400">vs previous period</span>
          </div>
        </AnimatedCard>

        <AnimatedCard className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[11px] text-gray-800 font-semibold uppercase tracking-wide">Total Bookings</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{bookingsData.total}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs font-medium ${bookingsChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {bookingsChange >= 0 ? '↑' : '↓'} {Math.abs(bookingsChange).toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-400">vs previous period</span>
          </div>
        </AnimatedCard>

        <AnimatedCard className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#9489E2]/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#9489E2]" />
            </div>
            <span className="text-[11px] text-gray-800 font-semibold uppercase tracking-wide">Avg Transaction</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{avgTransactionValue.toFixed(0)} <span className="text-xs font-medium text-gray-400">₾</span></div>
          <div className="text-[10px] text-gray-400 mt-1">Per booking</div>
        </AnimatedCard>

        <AnimatedCard className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <Gift className="w-4 h-4 text-pink-500" />
            </div>
            <span className="text-[11px] text-gray-800 font-semibold uppercase tracking-wide">Total Discounts</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{promoData.totalDiscount.toFixed(0)} <span className="text-xs font-medium text-gray-400">₾</span></div>
          <div className="text-[10px] text-gray-400 mt-1">
            {revenueData.total > 0 ? ((promoData.totalDiscount / revenueData.total) * 100).toFixed(1) : '0.0'}% of revenue
          </div>
        </AnimatedCard>
      </div>

      {/* Revenue Trend + Pie Chart */}
      <div className="flex gap-4 mb-6 z-[1]">
      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-[#9489E2]" />
          <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Revenue Trend</h2>
        </div>
        {revenueData.trend.length > 0 ? (() => {
          const sorted = revenueData.trend
          const maxAmount = Math.max(...sorted.map(t => t.amount), 1)
          const chartH = 220
          const n = sorted.length
          const padLeftPct = 6
          const padRightPct = 1
          const padTop = 10
          // Percentage-based x, pixel-based y
          const xPct = (i) => padLeftPct + (n > 1 ? i / (n - 1) : 0.5) * (100 - padLeftPct - padRightPct)
          const yPx = (amount) => padTop + (1 - amount / maxAmount) * (chartH - padTop)
          const points = sorted.map((item, i) => ({ xPct: xPct(i), yPx: yPx(item.amount) }))

          // Use a fixed viewBox that matches the container aspect for the SVG overlay
          const vbW = 1000
          const xVb = (i) => (xPct(i) / 100) * vbW
          const svgPoints = sorted.map((item, i) => ({ x: xVb(i), y: yPx(item.amount) }))
          const linePath = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
          const areaPath = `${linePath} L${svgPoints[svgPoints.length - 1].x},${chartH} L${svgPoints[0].x},${chartH} Z`

          return (
            <div className="mt-2">
              {/* Chart area */}
              <div className="relative" style={{ height: chartH }}>
                {/* Y-axis grid lines + labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(frac => (
                  <div key={frac} className="absolute left-0 right-0 flex items-center" style={{ top: padTop + (1 - frac) * (chartH - padTop) }}>
                    <span className="text-[9px] text-gray-800 w-[6%] text-right pr-1.5 -translate-y-1/2">{Math.round(maxAmount * frac).toLocaleString()}</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                ))}

                {/* SVG: line + area + dots */}
                <svg className="absolute inset-0 w-full overflow-visible" viewBox={`0 0 ${vbW} ${chartH}`} preserveAspectRatio="none" style={{ height: chartH, pointerEvents: 'none' }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#9489E2" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#9489E2" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#areaGrad)" />
                  <path d={linePath} fill="none" stroke="#9489E2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  {svgPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#9489E2" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>

                {/* Hover zones */}
                {sorted.map((item, i) => {
                  const halfGap = n > 1 ? (100 - padLeftPct - padRightPct) / (n - 1) / 2 : 50
                  return (
                    <div key={i} className="absolute inset-y-0 group cursor-crosshair" style={{ left: `${points[i].xPct - halfGap}%`, width: `${halfGap * 2}%` }}>
                      <div className="absolute inset-y-0 left-1/2 w-px bg-[#9489E2]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ top: points[i].yPx - 45 }}>
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-2.5 py-1.5 whitespace-nowrap">
                          <p className="text-[10px] text-gray-500">{item.date}</p>
                          <p className="text-xs font-bold text-gray-800">{item.amount.toFixed(0)} ₾</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* X-axis labels */}
              <div className="relative" style={{ height: 50, marginLeft: `${padLeftPct}%`, marginRight: `${padRightPct}%` }}>
                {sorted.map((item, i) => {
                  const leftPct = n > 1 ? (i / (n - 1)) * 100 : 50
                  return (
                    <div key={i} className="absolute" style={{ left: `${leftPct}%`, top: 24, transform: 'translateX(-50%)' }}>
                      <span className="text-[8px] text-gray-800 whitespace-nowrap" style={{ display: 'inline-block', transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
                        {item.date}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })() : (
          <p className="text-gray-400 text-center py-8 text-sm">No revenue data for this period</p>
        )}
      </div>

      {/* Pie Chart — Revenue by Service */}
      <div className="w-[330px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#9489E2]" />
          <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Revenue by Service</h2>
        </div>
        {servicesData.length > 0 ? (() => {
          const colors = ['#9489E2', '#F472B6', '#34D399', '#FBBF24', '#60A5FA', '#FB923C', '#A78BFA', '#F87171']
          const totalRev = servicesData.reduce((s, d) => s + d.revenue, 0) || 1
          const slices = servicesData.slice(0, 7)
          const otherRev = servicesData.slice(7).reduce((s, d) => s + d.revenue, 0)
          if (otherRev > 0) slices.push({ name: 'Other', revenue: otherRev })

          // Build pie segments
          let cumAngle = -90
          const segments = slices.map((s, i) => {
            const pct = (s.revenue / totalRev) * 100
            const angle = (pct / 100) * 360
            const startAngle = cumAngle
            cumAngle += angle
            return { ...s, pct, startAngle, angle, color: colors[i % colors.length] }
          })

          const r = 80
          const cx = 100
          const cy = 95
          const toRad = (deg) => (deg * Math.PI) / 180

          const hovered = hoveredSlice !== null ? segments[hoveredSlice] : null

          return (
            <div className="relative" style={{ margin: '0 auto' }}>
              <svg viewBox="0 0 200 190" className="w-full">
                {segments.map((seg, i) => {
                  if (seg.angle <= 0) return null
                  const a1 = toRad(seg.startAngle)
                  const a2 = toRad(seg.startAngle + seg.angle)
                  const x1 = cx + r * Math.cos(a1)
                  const y1 = cy + r * Math.sin(a1)
                  const x2 = cx + r * Math.cos(a2)
                  const y2 = cy + r * Math.sin(a2)
                  const largeArc = seg.angle > 180 ? 1 : 0
                  const isHovered = hoveredSlice === i
                  const isFaded = hoveredSlice !== null && !isHovered
                  // Explode hovered slice slightly outward
                  const midAngle = toRad(seg.startAngle + seg.angle / 2)
                  const explode = isHovered ? 4 : 0
                  const tx = Math.cos(midAngle) * explode
                  const ty = Math.sin(midAngle) * explode
                  const path = seg.angle >= 359.9
                    ? `M${cx - r},${cy} A${r},${r} 0 1,1 ${cx + r},${cy} A${r},${r} 0 1,1 ${cx - r},${cy}`
                    : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`
                  return (
                    <path
                      key={i}
                      d={path}
                      fill={seg.color}
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-200 cursor-pointer"
                      style={{ opacity: isFaded ? 0.35 : 1, transform: `translate(${tx}px, ${ty}px)` }}
                      onMouseEnter={() => setHoveredSlice(i)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  )
                })}
                {/* Center hole */}
                <circle cx={cx} cy={cy} r="45" fill="white" />
                {/* Center text — default or hovered */}
                {hovered ? (
                  <>
                    <text x={cx} y={cy - 14} textAnchor="middle" className="fill-gray-800 font-bold" style={{ fontSize: 9 }}>{hovered.name}</text>
                    <text x={cx} y={cy + 2} textAnchor="middle" className="fill-gray-800 font-bold" style={{ fontSize: 13 }}>{hovered.revenue.toLocaleString()} ₾</text>
                    <text x={cx} y={cy + 16} textAnchor="middle" className="fill-gray-800 font-bold" style={{ fontSize: 11 }}>{hovered.pct.toFixed(1)}%</text>
                  </>
                ) : (
                  <>
                    <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-800 font-bold" style={{ fontSize: 16 }}>{totalRev.toLocaleString()}</text>
                    <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 8 }}>₾ total</text>
                  </>
                )}
              </svg>
            </div>
          )
        })() : (
          <p className="text-gray-400 text-center py-8 text-sm">No data</p>
        )}
      </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 z-[1]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-[#9489E2]" />
          <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Booking Status</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(bookingsData.byStatus).map(([status, count]) => {
            const colors = {
              completed: 'bg-emerald-50 border-emerald-200 text-emerald-700',
              confirmed: 'bg-blue-50 border-blue-200 text-blue-700',
              pending: 'bg-amber-50 border-amber-200 text-amber-700',
              cancelled: 'bg-red-50 border-red-200 text-red-700',
            }
            return (
              <div key={status} className={`text-center p-3 rounded-xl border ${colors[status] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs mt-0.5 capitalize opacity-70">{status}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two Column Layout for Services and Specialists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 relative z-[1]">
        {/* Top Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#9489E2]" />
            <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Top Services</h2>
          </div>
          {servicesData.length > 0 ? (
            <div className="space-y-2">
              {servicesData.slice(0, 5).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{service.name}</p>
                      <p className="text-[10px] text-gray-400">{service.bookings} bookings</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{service.revenue.toFixed(0)} ₾</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">No service data</p>
          )}
        </div>

        {/* Top Specialists */}
        <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#9489E2]" />
            <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Top Specialists</h2>
          </div>
          {specialistsData.length > 0 ? (
            <div className="space-y-2">
              {specialistsData.slice(0, 5).map((specialist, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{specialist.name}</p>
                      <p className="text-[10px] text-gray-400">{specialist.bookings} bookings</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{specialist.revenue.toFixed(0)} ₾</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">No specialist data</p>
          )}
        </div>
      </div>

      {/* Promo Performance */}
      {promoData.promoUsage.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 z-[1]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-pink-500" />
            <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Promo Code Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Promo Code</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Uses</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Discount</th>
                </tr>
              </thead>
              <tbody>
                {promoData.promoUsage.map((promo, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-all">
                    <td className="py-2.5 px-4 text-sm font-medium text-gray-800">{promo.code}</td>
                    <td className="py-2.5 px-4 text-sm text-gray-500">{promo.uses}</td>
                    <td className="py-2.5 px-4 text-sm font-bold text-gray-800">{promo.totalDiscount.toFixed(0)} ₾</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Specialist Utilisation Rate */}
      {specialistUtilisation.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 z-[1]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#9489E2]" />
            <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Specialist Utilisation Rate</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Specialist</th>
                  <th className="text-center py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Day</th>
                  <th className="text-center py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Week</th>
                  <th className="text-center py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Month</th>
                  <th className="text-center py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Quarter</th>
                </tr>
              </thead>
              <tbody>
                {specialistUtilisation.map((specialist, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-all">
                    <td className="py-2.5 px-4 text-sm text-gray-800 font-medium">{specialist.name}</td>
                    {['day', 'week', 'month', 'quarter'].map(period => {
                      const val = parseFloat(specialist[period])
                      return (
                        <td key={period} className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            val >= 70 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            val >= 40 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            'bg-gray-50 text-gray-500 border border-gray-200'
                          }`}>
                            {specialist[period]}%
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 z-[1]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#9489E2]" />
            <h2 className="text-sm font-bold text-gray-800 font-[Inter]">Peak Booking Hours</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {peakHours.slice(0, 12).map((hour, index) => (
              <div key={index} className={`text-center p-3 rounded-xl border ${
                index === 0 ? 'bg-[#9489E2]/5 border-[#9489E2]/20' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-lg font-bold text-gray-800">{hour.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{hour.hour}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
