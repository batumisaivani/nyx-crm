import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'
import NewBookingInterface from '../components/NewBookingInterface'
import ClassicLoader from '../components/ui/loader'
import { useToast } from '../contexts/ToastContext'
import { Users, Clock, ChevronLeft, ChevronRight, Settings, Smartphone, Monitor, List, User, Phone, Calendar as CalendarIcon, CheckCircle, XCircle, Edit } from 'lucide-react'
import { MultiSelect } from '../components/ui/multi-select'
import { createPortal } from 'react-dom'

// Generate time slots based on working hours and time window
const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = []

  // Parse start and end times
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  // Convert to minutes for easier calculation
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // Generate intervals based on selected time window
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    slots.push(time)
  }

  return slots
}

const STATUS_COLORS = {
  pending: 'bg-gradient-to-br from-yellow-800/15 to-yellow-900/15 border-2 border-yellow-400/30 text-yellow-50 shadow-lg shadow-yellow-900/10',
  confirmed: 'bg-gradient-to-br from-blue-900/15 to-blue-800/15 border-2 border-blue-500/25 text-blue-100 shadow-lg shadow-blue-900/15',
  completed: 'bg-gradient-to-br from-emerald-900/15 to-green-900/15 border-2 border-emerald-600/25 text-emerald-200 shadow-lg shadow-emerald-900/10',
  cancelled: 'bg-gradient-to-br from-rose-900/15 to-red-900/15 border-2 border-rose-600/25 text-rose-200 shadow-lg shadow-rose-900/10',
}

export default function BookingCalendar() {
  const { facilityAccess } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [specialists, setSpecialists] = useState([])
  const [bookings, setBookings] = useState([])
  const [workingHours, setWorkingHours] = useState([])
  const [specialistWorkingHours, setSpecialistWorkingHours] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [dayLoading, setDayLoading] = useState(false)
  const [selectedSpecialistFilter, setSelectedSpecialistFilter] = useState([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [showPendingPopout, setShowPendingPopout] = useState(false)
  const [pendingBookings, setPendingBookings] = useState([])
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 })
  const dateButtonRef = useRef(null)
  const [calendarSize, setCalendarSize] = useState(localStorage.getItem('calendarSize') || 'medium')
  const [timeWindow, setTimeWindow] = useState(parseInt(localStorage.getItem('timeWindow')) || 30)
  const [showSizeSettings, setShowSizeSettings] = useState(false)
  const [settingsPosition, setSettingsPosition] = useState({ top: 0, right: 0 })
  const settingsButtonRef = useRef(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [prefilledSlot, setPrefilledSlot] = useState(null)

  // New Booking Interface state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [prefilledSpecialistId, setPrefilledSpecialistId] = useState(null)
  const [prefilledDateTime, setPrefilledDateTime] = useState(null)

  // Current time indicator
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [facilityAccess, selectedDate, timeWindow])

  // Sync calendar view date when calendar opens
  useEffect(() => {
    if (isCalendarOpen) {
      setCalendarViewDate(new Date(selectedDate))
    }
  }, [isCalendarOpen, selectedDate])

  // Fetch pending bookings count
  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchPendingCount()
    }
  }, [facilityAccess])

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', facilityAccess.salon_id)
        .eq('status', 'pending')

      if (error) throw error
      setPendingCount(count || 0)
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }

  const fetchPendingBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name, duration_minutes, price),
          specialists(name)
        `)
        .eq('salon_id', facilityAccess.salon_id)
        .eq('status', 'pending')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })

      if (error) throw error
      setPendingBookings(data || [])
    } catch (error) {
      console.error('Error fetching pending bookings:', error)
      toast.error('Error loading pending bookings')
    }
  }

  const fetchData = async () => {
    try {
      if (initialLoad) {
        setLoading(true)
      } else {
        setDayLoading(true)
      }

      // Fetch specialists
      const { data: specialistsData, error: specialistsError } = await supabase
        .from('specialists')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .order('name')

      if (specialistsError) throw specialistsError
      setSpecialists(specialistsData || [])

      // Fetch bookings for selected date
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name, duration_minutes, price),
          specialists(name)
        `)
        .eq('salon_id', facilityAccess.salon_id)
        .eq('booking_date', selectedDate)

      if (bookingsError) throw bookingsError
      setBookings(bookingsData || [])

      // Fetch working hours for the selected day
      const selectedDay = new Date(selectedDate).getDay()
      const { data: hoursData, error: hoursError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .eq('day_of_week', selectedDay)

      if (hoursError) throw hoursError
      setWorkingHours(hoursData || [])

      // Fetch specialist working hours for the selected day
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const selectedDayName = dayNames[selectedDay]

      const { data: specialistHoursData, error: specialistHoursError } = await supabase
        .from('specialist_working_hours')
        .select('*')
        .in('specialist_id', specialistsData.map(s => s.id))
        .eq('day_of_week', selectedDayName)
        .eq('is_closed', false)
        .eq('is_day_off', false)

      if (specialistHoursError) throw specialistHoursError
      setSpecialistWorkingHours(specialistHoursData || [])

      // Generate time slots based on working hours
      if (hoursData && hoursData.length > 0 && !hoursData[0].is_closed) {
        const openTime = hoursData[0].open_time?.substring(0, 5) || '00:00'
        const closeTime = hoursData[0].close_time?.substring(0, 5) || '23:59'
        const slots = generateTimeSlots(openTime, closeTime, timeWindow)
        setTimeSlots(slots)
      } else {
        // If closed or no hours set, show default hours (9 AM - 6 PM)
        const slots = generateTimeSlots('09:00', '18:00', timeWindow)
        setTimeSlots(slots)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error loading calendar: ' + error.message)
    } finally {
      setLoading(false)
      setInitialLoad(false)
      setDayLoading(false)
    }
  }

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.substring(0, 5) // Return 24-hour format HH:MM
  }

  const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    // Format as xxx-xx-xx-xx
    if (digits.length >= 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`
    }
    return phone // Return original if not enough digits
  }

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return 'N/A'
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  const getBookingForSlot = (specialistId, timeSlot) => {
    return bookings.find(booking => {
      if (booking.specialist_id !== specialistId) return false
      if (!booking.booking_time) return false

      const bookingTime = booking.booking_time.substring(0, 5)

      // Convert times to minutes for comparison
      const [slotHour, slotMin] = timeSlot.split(':').map(Number)
      const slotStartMinutes = slotHour * 60 + slotMin
      const slotEndMinutes = slotStartMinutes + timeWindow

      const [bookingHour, bookingMin] = bookingTime.split(':').map(Number)
      const bookingMinutes = bookingHour * 60 + bookingMin

      // Check if booking falls within this time slot's range
      // A booking at 15:30 should appear in the 15:00 slot when using 60-minute windows
      return bookingMinutes >= slotStartMinutes && bookingMinutes < slotEndMinutes
    })
  }

  const isTimeSlotOutsideWorkingHours = (specialistId, timeSlot) => {
    // Find specialist's working hours for this day
    const specialistHours = specialistWorkingHours.find(h => h.specialist_id === specialistId)

    // If no working hours defined, assume they work the full facility hours
    if (!specialistHours) return false

    // Convert time slot to minutes for comparison
    const [slotHour, slotMin] = timeSlot.split(':').map(Number)
    const slotMinutes = slotHour * 60 + slotMin

    // Convert working hours to minutes
    const startTime = specialistHours.start_time || '00:00'
    const endTime = specialistHours.end_time || '23:59'

    const [startHour, startMin] = startTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin

    const [endHour, endMin] = endTime.split(':').map(Number)
    const endMinutes = endHour * 60 + endMin

    // Check if time slot is outside working hours
    return slotMinutes < startMinutes || slotMinutes >= endMinutes
  }

  const calculateBookingOffset = (bookingTime, timeSlot) => {
    // Calculate how far into the time slot the booking starts
    const [slotHour, slotMin] = timeSlot.split(':').map(Number)
    const slotStartMinutes = slotHour * 60 + slotMin

    const [bookingHour, bookingMin] = bookingTime.substring(0, 5).split(':').map(Number)
    const bookingMinutes = bookingHour * 60 + bookingMin

    // How many minutes into the slot does the booking start?
    const minutesIntoSlot = bookingMinutes - slotStartMinutes

    // Convert to pixels based on slot height
    const slotHeight = parseInt(getSizeHeight())
    const pixelOffset = (minutesIntoSlot / timeWindow) * slotHeight

    return pixelOffset + 4 // Add the base top margin
  }

  const calculateBookingHeight = (duration, bookingTime, timeSlot) => {
    // Calculate exact height based on duration in minutes
    const slotHeight = parseInt(getSizeHeight())
    const pixelsPerMinute = slotHeight / timeWindow
    const heightInPixels = duration * pixelsPerMinute

    return heightInPixels - 8 // Subtract small margin for visual spacing
  }

  const changeDate = (days) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + days)
    setSelectedDate(getLocalDateString(currentDate))
  }

  const goToToday = () => {
    setSelectedDate(getLocalDateString())
  }

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString)
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    return `${weekday}, ${day}-${month}`
  }

  const getCurrentTimePosition = () => {
    // Only show the line if viewing today's date
    const today = getLocalDateString()
    if (selectedDate !== today) return null

    const now = currentTime
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const currentMinutes = hours * 60 + minutes

    // Get first and last time slot
    if (timeSlots.length === 0) return null

    const firstSlot = timeSlots[0]
    const [firstHour, firstMin] = firstSlot.split(':').map(Number)
    const startMinutes = firstHour * 60 + firstMin

    // Calculate position
    const minutesSinceStart = currentMinutes - startMinutes
    if (minutesSinceStart < 0) return null // Before first time slot

    const slotHeight = parseInt(getSizeHeight())
    const headerHeight = 80 // Approximate header height with specialist names/images
    const position = headerHeight + (minutesSinceStart / timeWindow) * slotHeight

    return position
  }

  const toggleCalendar = () => {
    if (!isCalendarOpen && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect()
      setCalendarPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
    setIsCalendarOpen(!isCalendarOpen)
  }

  const handleSlotClick = (specialistId, timeSlot) => {
    // Check if slot already has a booking
    const existingBooking = getBookingForSlot(specialistId, timeSlot)
    if (existingBooking) {
      handleBookingClick(existingBooking)
    } else {
      // Open new booking interface with prefilled specialist, date, and time
      setPrefilledSpecialistId(specialistId)
      setPrefilledDateTime({
        date: selectedDate,
        time: timeSlot
      })
      setIsNewBookingOpen(true)
    }
  }

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking)
    setPrefilledSlot(null)
    setIsModalOpen(true)
  }

  const handleNewBooking = () => {
    setPrefilledSpecialistId(null)
    setPrefilledDateTime(null)
    setIsNewBookingOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
    setPrefilledSlot(null)
  }

  const handleModalSave = () => {
    fetchData() // Refresh calendar
    fetchPendingCount()
    fetchPendingBookings()
  }

  const handleNewBookingClose = () => {
    setIsNewBookingOpen(false)
    setPrefilledSpecialistId(null)
    setPrefilledDateTime(null)
    fetchData() // Refresh calendar
  }

  const toggleSettings = () => {
    if (!showSizeSettings && settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect()
      setSettingsPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
    setShowSizeSettings(!showSizeSettings)
  }

  const handlePendingClick = async (e) => {
    e.stopPropagation()
    if (!showPendingPopout) {
      await fetchPendingBookings()
    }
    setShowPendingPopout(!showPendingPopout)
  }

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) throw error

      const statusMessages = {
        confirmed: 'Booking confirmed!',
        completed: 'Booking completed!',
        cancelled: 'Booking cancelled!'
      }

      toast.success(statusMessages[newStatus] || 'Booking updated!')

      // Refresh data
      fetchPendingCount()
      fetchPendingBookings()
      fetchData()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Error updating booking: ' + error.message)
    }
  }

  const handleEditPendingBooking = (booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
    setShowPendingPopout(false)
  }

  const handleSizeChange = (size) => {
    setCalendarSize(size)
    localStorage.setItem('calendarSize', size)
  }

  const handleTimeWindowChange = (minutes) => {
    setTimeWindow(minutes)
    localStorage.setItem('timeWindow', minutes.toString())
  }

  const getSizeHeight = () => {
    switch (calendarSize) {
      case 'small': return '40px'
      case 'medium': return '60px'
      case 'large': return '80px'
      default: return '60px'
    }
  }

  const filteredSpecialists = selectedSpecialistFilter.length === 0
    ? specialists
    : specialists.filter(s => selectedSpecialistFilter.includes(s.id))

  if (initialLoad && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  return (
    <div className="w-[calc(100%+4rem)] -mx-8 -mt-4">
      {/* Date Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 px-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-full transition-all"
          >
            Today
          </button>
          <div className="flex items-center relative">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-l-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              ref={dateButtonRef}
              onClick={toggleCalendar}
              className="px-6 py-2 bg-purple-950/12 border-t border-b border-purple-700/25 text-white text-sm font-semibold w-40 text-center hover:bg-purple-950/20 transition-all cursor-pointer"
            >
              {formatDateDisplay(selectedDate)}
            </button>
            <button
              onClick={() => changeDate(1)}
              className="p-2 text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-r-full transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

              {/* Calendar Popup - Rendered via Portal */}
              {isCalendarOpen && createPortal(
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[99998]"
                    onClick={() => setIsCalendarOpen(false)}
                  />

                  {/* Calendar */}
                  <div
                    className="fixed z-[99999] w-[580px] bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-3"
                    style={{
                      top: `${calendarPosition.top}px`,
                      left: `${calendarPosition.left}px`
                    }}
                  >
                    {/* Header with Navigation and Month Names */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          const newDate = new Date(calendarViewDate)
                          newDate.setMonth(newDate.getMonth() - 1)
                          setCalendarViewDate(newDate)
                        }}
                        className="p-1.5 hover:bg-purple-500/10 rounded-lg transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-purple-300" />
                      </button>

                      <div className="flex items-center flex-1">
                        <div className="flex-1 text-center text-sm font-semibold text-white">
                          {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="w-px h-6 bg-purple-700 mx-4"></div>
                        <div className="flex-1 text-center text-sm font-semibold text-white">
                          {(() => {
                            const nextMonth = new Date(calendarViewDate)
                            nextMonth.setMonth(nextMonth.getMonth() + 1)
                            return nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          })()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newDate = new Date(calendarViewDate)
                          newDate.setMonth(newDate.getMonth() + 1)
                          setCalendarViewDate(newDate)
                        }}
                        className="p-1.5 hover:bg-purple-500/10 rounded-lg transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-purple-300" />
                      </button>
                    </div>

                    {/* Two Months with Single Centered Separator */}
                    <div className="flex gap-4 relative">
                      {/* Current Month */}
                      <div className="flex-1">
                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-1.5 mb-2">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div
                              key={day}
                              className="h-7 w-7 flex items-center justify-center text-[10.5px] font-bold text-white"
                            >
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {(() => {
                            const year = calendarViewDate.getFullYear()
                            const month = calendarViewDate.getMonth()
                            const firstDay = new Date(year, month, 1).getDay()
                            const daysInMonth = new Date(year, month + 1, 0).getDate()
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const selected = new Date(selectedDate)
                            selected.setHours(0, 0, 0, 0)

                            const days = []

                            // Empty cells before first day
                            for (let i = 0; i < firstDay; i++) {
                              days.push(<div key={`empty-${i}`} className="h-8 w-7" />)
                            }

                            // Days of month
                            for (let day = 1; day <= daysInMonth; day++) {
                              const date = new Date(year, month, day)
                              date.setHours(0, 0, 0, 0)
                              const isToday = date.getTime() === today.getTime()
                              const isSelected = date.getTime() === selected.getTime()

                              days.push(
                                <button
                                  key={day}
                                  onClick={() => {
                                    const newDate = new Date(year, month, day)
                                    setSelectedDate(newDate.toISOString().split('T')[0])
                                    setIsCalendarOpen(false)
                                  }}
                                  className={`
                                    h-8 w-7 rounded-lg text-xs font-medium transition-all hover:bg-purple-500/20 cursor-pointer
                                    ${isSelected
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                      : isToday
                                      ? 'bg-purple-900/30 text-purple-300 border border-purple-700'
                                      : 'text-gray-300'
                                    }
                                  `}
                                >
                                  {day}
                                </button>
                              )
                            }

                            return days
                          })()}
                        </div>
                      </div>

                      {/* Centered Separator */}
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-purple-700"></div>

                      {/* Next Month */}
                      <div className="flex-1">
                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-1.5 mb-2">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div
                              key={`next-${day}`}
                              className="h-7 w-7 flex items-center justify-center text-[10.5px] font-bold text-white"
                            >
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {(() => {
                            const nextMonthDate = new Date(calendarViewDate)
                            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
                            const year = nextMonthDate.getFullYear()
                            const month = nextMonthDate.getMonth()
                            const firstDay = new Date(year, month, 1).getDay()
                            const daysInMonth = new Date(year, month + 1, 0).getDate()
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const selected = new Date(selectedDate)
                            selected.setHours(0, 0, 0, 0)

                            const days = []

                            // Empty cells before first day
                            for (let i = 0; i < firstDay; i++) {
                              days.push(<div key={`next-empty-${i}`} className="h-8 w-7" />)
                            }

                            // Days of month
                            for (let day = 1; day <= daysInMonth; day++) {
                              const date = new Date(year, month, day)
                              date.setHours(0, 0, 0, 0)
                              const isToday = date.getTime() === today.getTime()
                              const isSelected = date.getTime() === selected.getTime()

                              days.push(
                                <button
                                  key={`next-${day}`}
                                  onClick={() => {
                                    const newDate = new Date(year, month, day)
                                    setSelectedDate(newDate.toISOString().split('T')[0])
                                    setIsCalendarOpen(false)
                                  }}
                                  className={`
                                    h-8 w-7 rounded-lg text-xs font-medium transition-all hover:bg-purple-500/20 cursor-pointer
                                    ${isSelected
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                      : isToday
                                      ? 'bg-purple-900/30 text-purple-300 border border-purple-700'
                                      : 'text-gray-300'
                                    }
                                  `}
                                >
                                  {day}
                                </button>
                              )
                            }

                            return days
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>,
                document.body
            )}
          </div>
          <MultiSelect
            options={specialists.map(s => ({ value: s.id, label: s.name }))}
            value={selectedSpecialistFilter}
            onChange={setSelectedSpecialistFilter}
            placeholder="All Specialists"
            className="w-[200px] !bg-purple-900/15 !border-purple-700 hover:!bg-purple-900/20 !rounded-full !px-4 !py-2 !text-sm !font-medium"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Bookings List Button with Notification Badge */}
          <button
            onClick={handlePendingClick}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-full transition-all flex items-center gap-2 relative"
            title="View Pending Bookings"
          >
            <List className="w-5 h-5" />
            <span>Bookings</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1.5 text-xs font-bold bg-red-500 text-white rounded-full border-2 border-purple-950">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>

          {/* Calendar Size Settings */}
          <button
            ref={settingsButtonRef}
            onClick={toggleSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-full transition-all"
            title="Calendar Size Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Size Settings Dropdown - Rendered via Portal */}
          {showSizeSettings && createPortal(
            <>
              <div
                className="fixed inset-0 z-[99998]"
                onClick={() => setShowSizeSettings(false)}
              />
              <div
                className="fixed z-[99999] w-44 bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-2"
                style={{
                  top: `${settingsPosition.top}px`,
                  right: `${settingsPosition.right}px`
                }}
              >
                {/* Calendar Size Section */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-white mb-2 px-2 text-center">Calendar Size</div>
                  <button
                    onClick={() => handleSizeChange('small')}
                    className={`w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                      calendarSize === 'small'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-purple-800/25'
                    }`}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => handleSizeChange('medium')}
                    className={`w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                      calendarSize === 'medium'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-purple-800/25'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleSizeChange('large')}
                    className={`w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                      calendarSize === 'large'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-purple-800/25'
                    }`}
                  >
                    Large
                  </button>
                </div>

                {/* Separator */}
                <div className="border-t border-purple-700 my-2"></div>

                {/* Time Window Section */}
                <div>
                  <div className="text-xs font-semibold text-white mb-2 px-2 text-center">Time Window</div>
                  <button
                    onClick={() => handleTimeWindowChange(15)}
                    className={`w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                      timeWindow === 15
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-purple-800/25'
                    }`}
                  >
                    15 minutes
                  </button>
                  <button
                    onClick={() => handleTimeWindowChange(30)}
                    className={`w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                      timeWindow === 30
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-purple-800/25'
                    }`}
                  >
                    30 minutes
                  </button>
                  <button
                    onClick={() => handleTimeWindowChange(60)}
                    className={`w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                      timeWindow === 60
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-purple-800/25'
                    }`}
                  >
                    1 hour
                  </button>
                </div>
              </div>
            </>,
            document.body
          )}

          <button
            onClick={handleNewBooking}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-full transition-all"
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {specialists.length === 0 ? (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 dark:from-purple-900/5 dark:to-violet-900/5 backdrop-blur-xl border-t border-b border-purple-700 p-12 text-center">
          <div className="flex justify-center mb-4">
            <Users className="w-16 h-16 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-[Calibri,sans-serif]">No Specialists Found</h3>
          <p className="text-gray-300">Add specialists first to view the calendar.</p>
        </div>
      ) : (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 dark:from-purple-900/5 dark:to-violet-900/5 backdrop-blur-xl border-t border-b border-purple-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-purple-700">
                    <th className="sticky left-0 z-10 px-3 py-3 text-center text-sm font-semibold text-white w-20">
                    </th>
                    {filteredSpecialists.map((specialist) => (
                      <th
                        key={specialist.id}
                        className="px-4 py-2 text-center text-sm font-semibold text-white"
                        style={{ width: `${100 / filteredSpecialists.length}%` }}
                      >
                        <div className="flex flex-col items-center">
                          {specialist.image_url && (
                            <img
                              src={specialist.image_url}
                              alt={specialist.name}
                              className="w-9 h-9 rounded-full object-cover mb-1.5 border border-purple-500"
                            />
                          )}
                          <span>{specialist.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot, index) => {
                    return (
                      <tr key={timeSlot} className="border-b-2 border-violet-700/25">
                        <td className="sticky left-0 z-10 px-3 pt-2 pb-3 text-sm font-medium border-r border-violet-700/25 text-white w-20 text-center align-top">
                          {formatTime(timeSlot)}
                        </td>
                        {filteredSpecialists.map((specialist) => {
                          const booking = getBookingForSlot(specialist.id, timeSlot)
                          const isOutsideWorkingHours = isTimeSlotOutsideWorkingHours(specialist.id, timeSlot)

                          return (
                            <td
                              key={specialist.id}
                              onClick={() => !isOutsideWorkingHours && handleSlotClick(specialist.id, timeSlot)}
                              className={`px-2 py-2 border-r border-violet-700/25 relative ${
                                isOutsideWorkingHours
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer hover:bg-purple-800/15'
                              }`}
                              style={{
                                height: getSizeHeight(),
                                width: `${100 / filteredSpecialists.length}%`,
                                ...(isOutsideWorkingHours && {
                                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(156,163,175,0.3) 5px, rgba(156,163,175,0.3) 7px)',
                                  opacity: 0.5
                                })
                              }}
                            >
                              {booking && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBookingClick(booking)
                                  }}
                                  className={`absolute inset-x-2 p-2 rounded-lg text-xs cursor-pointer hover:brightness-110 transition-all overflow-hidden ${STATUS_COLORS[booking.status]}`}
                                  style={{
                                    top: `${calculateBookingOffset(booking.booking_time, timeSlot)}px`,
                                    height: `${calculateBookingHeight(booking.services?.duration_minutes || 30, booking.booking_time, timeSlot)}px`,
                                    zIndex: 5
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div className="font-bold truncate flex-1 text-[11px] leading-tight">
                                      {booking.services?.name || 'Service'} • {formatTime(booking.booking_time)} ({booking.services?.duration_minutes || 30}min)
                                    </div>
                                    {booking.created_via === 'mobile' ? (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-white/20 rounded flex-shrink-0" title="Booked via Mobile App">App</span>
                                    ) : booking.created_via === 'web' ? (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-white/20 rounded flex-shrink-0" title="Walk-in booking">Walk-in</span>
                                    ) : null}
                                  </div>
                                  <div className="text-[12px] opacity-90 truncate">
                                    {booking.customer_name || 'Guest'}
                                  </div>
                                  {booking.customer_phone && (
                                    <div className="text-[11px] opacity-80 truncate">
                                      {formatPhoneNumber(booking.customer_phone)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
          </div>

          {/* Current time indicator line */}
          {(() => {
            const position = getCurrentTimePosition()
            if (position === null) return null

            return (
              <div
                className="absolute left-0 right-0 pointer-events-none z-20"
                style={{
                  top: `${position}px`
                }}
              >
                {/* Hexagon with time */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-8 flex items-center justify-center z-30">
                  {/* Red border hexagon */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: '#ef4444',
                      clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)'
                    }}
                  ></div>
                  {/* Inner background hexagon */}
                  <div
                    className="absolute inset-0.5 flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: '#100123',
                      clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                      color: '#ef4444'
                    }}
                  >
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                </div>

                {/* Red line */}
                <div className="h-0.5 shadow-lg" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}></div>
              </div>
            )
          })()}

          {/* Day switching loading overlay */}
          {dayLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <ClassicLoader />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 px-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-br from-amber-900/15 to-yellow-900/15 border-2 border-amber-600/25 rounded shadow-lg shadow-amber-900/10"></div>
            <span className="text-sm text-amber-200 font-medium">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-900/15 to-violet-900/15 border-2 border-purple-500/25 rounded shadow-lg shadow-purple-900/15"></div>
            <span className="text-sm text-purple-100 font-medium">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-br from-emerald-900/15 to-green-900/15 border-2 border-emerald-600/25 rounded shadow-lg shadow-emerald-900/10"></div>
            <span className="text-sm text-emerald-200 font-medium">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-br from-rose-900/15 to-red-900/15 border-2 border-rose-600/25 rounded shadow-lg shadow-rose-900/10"></div>
            <span className="text-sm text-rose-200 font-medium">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Pending Bookings Popout */}
      {showPendingPopout && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99998]"
            onClick={() => setShowPendingPopout(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] w-full max-w-[980px] max-h-[80vh] bg-purple-950/40 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl overflow-hidden">
            <div className="sticky top-0 bg-[#120025] border-b border-purple-700 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white font-[Calibri,sans-serif]">Pending Bookings ({pendingCount})</h2>
              <button
                onClick={() => setShowPendingPopout(false)}
                className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg font-medium transition-all"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  No pending bookings
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Headers Row */}
                  <div className="flex items-center gap-4 px-3 pb-2 border-b border-purple-700/30">
                    <div className="flex items-center justify-center gap-1.5 w-[280px] flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Service by Specialist</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 w-[120px] flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Customer</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 w-[130px] flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Phone</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 w-[100px] flex-shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Date</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 w-[70px] flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Time</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 w-[130px] flex-shrink-0">
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Actions</span>
                    </div>
                  </div>

                  {/* Bookings List */}
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-purple-900/10 border border-purple-700/25 rounded-lg p-3 hover:bg-purple-900/15 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-white font-[Calibri,sans-serif] truncate w-[280px] flex-shrink-0 text-center">
                          <span className="font-semibold">{booking.services?.name || 'Service'}</span>
                          <span className="text-xs font-normal mx-1">by</span>
                          <span className="font-semibold">{booking.specialists?.name || 'Specialist'}</span>
                        </div>
                        <div className="text-sm text-gray-300 truncate w-[120px] flex-shrink-0 text-center">
                          {booking.customer_name || 'Guest'}
                        </div>
                        <div className="text-sm text-gray-400 truncate w-[130px] flex-shrink-0 text-center">
                          {booking.customer_phone || '-'}
                        </div>
                        <div className="text-sm text-gray-300 w-[100px] flex-shrink-0 text-center">
                          {new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-300 w-[70px] flex-shrink-0 text-center">
                          {booking.booking_time?.substring(0, 5)}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 w-[130px] flex-shrink-0">
                          <button
                            onClick={() => handleEditPendingBooking(booking)}
                            className="px-2 py-1 bg-gradient-to-br from-purple-900/15 to-purple-800/15 border border-purple-500/25 text-purple-100 text-xs rounded font-medium transition-all hover:brightness-110"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="px-2 py-1 bg-gradient-to-br from-blue-900/15 to-blue-800/15 border border-blue-500/25 text-blue-100 text-xs rounded font-medium transition-all hover:brightness-110"
                            title="Confirm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="px-2 py-1 bg-gradient-to-br from-rose-900/15 to-red-900/15 border border-rose-600/25 text-rose-200 text-xs rounded font-medium transition-all hover:brightness-110"
                            title="Cancel"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-[#120025] p-4 border-t border-purple-700 flex justify-between items-center">
              <button
                onClick={() => navigate('/bookings')}
                className="px-4 py-2 text-sm text-purple-200 hover:text-white transition-all"
              >
                View All Bookings →
              </button>
              <button
                onClick={() => setShowPendingPopout(false)}
                className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Booking Modal - for editing existing bookings */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        facilityAccess={facilityAccess}
        initialData={selectedBooking}
        prefilledDate={prefilledSlot?.date}
        prefilledTime={prefilledSlot?.time}
        prefilledSpecialistId={prefilledSlot?.specialistId}
      />

      {/* New Booking Interface - for creating new bookings */}
      <NewBookingInterface
        isOpen={isNewBookingOpen}
        onClose={handleNewBookingClose}
        facilityId={facilityAccess?.salon_id}
        prefilledSpecialistId={prefilledSpecialistId}
        prefilledDateTime={prefilledDateTime}
      />
    </div>
  )
}
