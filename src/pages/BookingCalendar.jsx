import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'
import NewBookingInterface from '../components/NewBookingInterface'
import ClassicLoader from '../components/ui/loader'
import { useToast } from '../contexts/ToastContext'
import { Users, Clock, ChevronLeft, ChevronRight, Settings, Smartphone, Monitor, List, User, Phone, Calendar as CalendarIcon, CheckCircle, XCircle, Edit, DollarSign, Tag, FileText, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MultiSelect } from '../components/ui/multi-select'
import CompletionModal from '../components/ui/CompletionModal'
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
  pending: 'bg-gradient-to-br from-yellow-700/35 to-yellow-800/35 border-2 border-yellow-400/60 text-yellow-50 shadow-lg shadow-yellow-900/20',
  confirmed: 'bg-gradient-to-br from-blue-800/35 to-blue-700/35 border-2 border-blue-400/60 text-blue-100 shadow-lg shadow-blue-900/25',
  in_progress: 'bg-gradient-to-br from-emerald-700/35 to-blue-700/35 border-2 border-emerald-400/60 text-emerald-100 shadow-lg shadow-emerald-900/25',
  completed: 'bg-gradient-to-br from-emerald-800/35 to-green-800/35 border-2 border-emerald-500/60 text-emerald-200 shadow-lg shadow-emerald-900/20',
  cancelled: 'bg-gradient-to-br from-rose-800/35 to-red-800/35 border-2 border-rose-500/60 text-rose-200 shadow-lg shadow-rose-900/20',
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
  const [slotDuration, setSlotDuration] = useState(null)
  const [showSizeSettings, setShowSizeSettings] = useState(false)
  const [settingsPosition, setSettingsPosition] = useState({ top: 0, right: 0 })
  const settingsButtonRef = useRef(null)
  const theadRef = useRef(null)
  const tableContainerRef = useRef(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [prefilledSlot, setPrefilledSlot] = useState(null)

  // Started bookings (derived from status)
  const [startedBookings, setStartedBookings] = useState(new Set())

  // Closed periods
  const [isDateClosed, setIsDateClosed] = useState(false)
  const [closedReason, setClosedReason] = useState('')

  // Breaks
  const [breaks, setBreaks] = useState([])
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [breakForm, setBreakForm] = useState({ specialistId: null, startTime: '', endTime: '', label: 'Break' })

  // Use currentTime (updates every minute) to make this reactive
  const isBookingLive = (booking) => {
    if (booking.status !== 'confirmed' && booking.status !== 'in_progress') return false
    const now = currentTime
    const today = now.toISOString().split('T')[0]
    const bookingDate = (booking.booking_date || '').substring(0, 10)
    if (bookingDate !== today) return false
    const timeParts = (booking.booking_time || '00:00:00').substring(0, 5).split(':')
    const h = parseInt(timeParts[0])
    const m = parseInt(timeParts[1])
    const bookingStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
    const duration = booking.services?.duration_minutes || 30
    const bookingEnd = new Date(bookingStart.getTime() + duration * 60000)
    const minutesBefore = (bookingStart - now) / 60000
    return minutesBefore <= 60 && now <= bookingEnd
  }

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionBooking, setCompletionBooking] = useState(null)

  // Hover tooltip state
  const [hoveredBooking, setHoveredBooking] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef(null)

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

  // Fetch slot duration from calendar_settings
  useEffect(() => {
    if (facilityAccess?.salon_id) {
      supabase
        .from('calendar_settings')
        .select('slot_duration')
        .eq('salon_id', facilityAccess.salon_id)
        .single()
        .then(({ data }) => {
          if (data?.slot_duration) {
            setSlotDuration(data.slot_duration)
          }
        })
    }
  }, [facilityAccess])

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
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().substring(0, 8)

      const { count: pendingCount, error: pendingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', facilityAccess.salon_id)
        .eq('status', 'pending')

      if (pendingError) throw pendingError

      // Count overdue confirmed bookings
      const { data: confirmedData, error: confirmedError } = await supabase
        .from('bookings')
        .select('booking_date, booking_time')
        .eq('salon_id', facilityAccess.salon_id)
        .eq('status', 'confirmed')
        .lte('booking_date', today)

      if (confirmedError) throw confirmedError

      const overdueCount = (confirmedData || []).filter(b => {
        if (b.booking_date < today) return true
        if (b.booking_date === today && b.booking_time < currentTime) return true
        return false
      }).length

      setPendingCount((pendingCount || 0) + overdueCount)
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }

  const fetchPendingBookings = async () => {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().substring(0, 8)

      // Fetch all pending bookings
      const { data: pendingData, error: pendingError } = await supabase
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

      if (pendingError) throw pendingError

      // Fetch confirmed bookings and filter to overdue ones client-side
      const { data: confirmedData, error: confirmedError } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name, duration_minutes, price),
          specialists(name)
        `)
        .eq('salon_id', facilityAccess.salon_id)
        .eq('status', 'confirmed')
        .lte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })

      if (confirmedError) throw confirmedError

      const overdueConfirmed = (confirmedData || []).filter(b => {
        if (b.booking_date < today) return true
        if (b.booking_date === today && b.booking_time < currentTime) return true
        return false
      })

      const data = [...overdueConfirmed, ...(pendingData || [])]
      setPendingBookings(data)
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
          specialists(name),
          customers(preferred_language)
        `)
        .eq('salon_id', facilityAccess.salon_id)
        .eq('booking_date', selectedDate)

      if (bookingsError) throw bookingsError

      // Fetch additional services for these bookings
      const bookingIds = (bookingsData || []).map(b => b.id)
      let additionalServicesMap = {}
      if (bookingIds.length > 0) {
        const { data: addSvcData } = await supabase
          .from('booking_additional_services')
          .select('*')
          .in('booking_id', bookingIds)
        if (addSvcData) {
          addSvcData.forEach(s => {
            if (!additionalServicesMap[s.booking_id]) additionalServicesMap[s.booking_id] = []
            additionalServicesMap[s.booking_id].push(s)
          })
        }
      }

      // Attach additional services to bookings
      const bookingsWithExtras = (bookingsData || []).map(b => ({
        ...b,
        additional_services: additionalServicesMap[b.id] || []
      }))
      setBookings(bookingsWithExtras)

      // Populate started bookings from status
      const inProgress = new Set(bookingsWithExtras.filter(b => b.status === 'in_progress').map(b => b.id))
      setStartedBookings(inProgress)

      // Check if selected date is in a closed period
      const { data: closedData } = await supabase
        .from('closed_periods')
        .select('reason')
        .eq('salon_id', facilityAccess.salon_id)
        .lte('start_date', selectedDate)
        .gte('end_date', selectedDate)
        .limit(1)

      // Fetch breaks for the selected date
      const { data: breaksData } = await supabase
        .from('specialist_breaks')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .eq('break_date', selectedDate)
      setBreaks(breaksData || [])

      // Fetch working hours for the selected day
      const selectedDay = new Date(selectedDate).getDay()
      const { data: hoursData, error: hoursError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .eq('day_of_week', selectedDay)

      if (hoursError) throw hoursError
      setWorkingHours(hoursData || [])

      // Check if closed period or facility closed day
      const isFacilityClosed = hoursData && hoursData.length > 0 && hoursData[0].is_closed
      const isClosedPeriod = closedData && closedData.length > 0
      setIsDateClosed(isFacilityClosed || isClosedPeriod)
      setClosedReason(isClosedPeriod ? closedData[0].reason : isFacilityClosed ? 'Salon closed on this day' : '')

      // Fetch specialist working hours for the selected day
      // Try specific work_date first, then fall back to day_of_week
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const selectedDayName = dayNames[selectedDay]

      const [{ data: dateHours, error: dateHoursError }, { data: dayHours, error: dayHoursError }] = await Promise.all([
        supabase
          .from('specialist_working_hours')
          .select('*')
          .in('specialist_id', specialistsData.map(s => s.id))
          .eq('work_date', selectedDate)
          .eq('is_closed', false)
          .eq('is_day_off', false),
        supabase
          .from('specialist_working_hours')
          .select('*')
          .in('specialist_id', specialistsData.map(s => s.id))
          .eq('day_of_week', selectedDayName)
          .eq('is_closed', false)
          .eq('is_day_off', false)
      ])

      if (dateHoursError) throw dateHoursError
      if (dayHoursError) throw dayHoursError

      // Check for day-off on this specific date
      const { data: dayOffData } = await supabase
        .from('specialist_working_hours')
        .select('specialist_id')
        .in('specialist_id', specialistsData.map(s => s.id))
        .eq('work_date', selectedDate)
        .eq('is_day_off', true)

      const dayOffIds = new Set((dayOffData || []).map(d => d.specialist_id))

      // Use date-specific hours if available per specialist, otherwise day-of-week
      const dateSpecialistIds = new Set((dateHours || []).map(h => h.specialist_id))
      const mergedHours = [
        ...(dateHours || []),
        ...(dayHours || []).filter(h => !dateSpecialistIds.has(h.specialist_id))
      ].filter(h => !dayOffIds.has(h.specialist_id))

      setSpecialistWorkingHours(mergedHours)

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

    if (timeSlots.length === 0) return null

    const firstSlot = timeSlots[0]
    const [firstHour, firstMin] = firstSlot.split(':').map(Number)
    const startMinutes = firstHour * 60 + firstMin

    const minutesSinceStart = currentMinutes - startMinutes
    if (minutesSinceStart < 0) return null

    // Measure actual row height from DOM
    const tbody = tableContainerRef.current?.querySelector('tbody')
    const firstRow = tbody?.querySelector('tr')
    if (!firstRow) return null

    const rowHeight = firstRow.offsetHeight
    const headerHeight = theadRef.current?.offsetHeight || 0
    const position = headerHeight + (minutesSinceStart / timeWindow) * rowHeight

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

  const [slotMenu, setSlotMenu] = useState(null) // { specialistId, timeSlot, x, y }

  const handleSlotClick = (specialistId, timeSlot, e) => {
    if (isDateClosed) return
    const existingBooking = getBookingForSlot(specialistId, timeSlot)
    if (existingBooking) {
      if (existingBooking.status !== 'completed') handleBookingClick(existingBooking)
    } else {
      setSlotMenu({
        specialistId,
        timeSlot,
        x: e?.clientX || 0,
        y: e?.clientY || 0
      })
    }
  }

  const handleSlotNewBooking = () => {
    if (!slotMenu) return
    setPrefilledSpecialistId(slotMenu.specialistId)
    setPrefilledDateTime({ date: selectedDate, time: slotMenu.timeSlot })
    setIsNewBookingOpen(true)
    setSlotMenu(null)
  }

  const handleSlotAddBreak = () => {
    if (!slotMenu) return
    const startTime = slotMenu.timeSlot.substring(0, 5)
    const [h, m] = startTime.split(':').map(Number)
    const endMinutes = h * 60 + m + 30
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    setBreakForm({ specialistId: slotMenu.specialistId, startTime, endTime, label: 'Break' })
    setShowBreakModal(true)
    setSlotMenu(null)
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
      if (newStatus === 'cancelled') {
        // Check if booking is in the past or future
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('booking_date, booking_time')
          .eq('id', bookingId)
          .single()

        const now = new Date()
        const bookingDateTime = new Date(`${bookingData.booking_date}T${bookingData.booking_time}`)

        if (bookingDateTime > now) {
          // Future booking → delete entirely
          const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
          if (error) throw error
          toast.success('Future booking deleted!')
        } else {
          // Past booking → mark as cancelled
          const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
          if (error) throw error
          toast.success('Booking cancelled!')
        }
      } else {
        const { error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', bookingId)

        if (error) throw error

        const statusMessages = {
          confirmed: 'Booking confirmed!',
          completed: 'Booking completed!',
        }
        toast.success(statusMessages[newStatus] || 'Booking updated!')
      }

      // Refresh data
      fetchPendingCount()
      fetchPendingBookings()
      fetchData()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Error updating booking: ' + error.message)
    }
  }

  const addBreak = async () => {
    if (!breakForm.specialistId || !breakForm.startTime || !breakForm.endTime) {
      toast.error('Please fill all fields')
      return
    }
    try {
      const { error } = await supabase.from('specialist_breaks').insert([{
        specialist_id: breakForm.specialistId,
        salon_id: facilityAccess.salon_id,
        break_date: selectedDate,
        start_time: breakForm.startTime + ':00',
        end_time: breakForm.endTime + ':00',
        label: breakForm.label || 'Break'
      }])
      if (error) throw error
      toast.success('Break added!')
      setShowBreakModal(false)
      setBreakForm({ specialistId: null, startTime: '', endTime: '', label: 'Break' })
      fetchData()
    } catch (error) {
      console.error('Error adding break:', error)
      toast.error('Error adding break')
    }
  }

  const deleteBreak = async (breakId) => {
    try {
      const { error } = await supabase.from('specialist_breaks').delete().eq('id', breakId)
      if (error) throw error
      toast.success('Break removed')
      fetchData()
    } catch (error) {
      toast.error('Error removing break')
    }
  }

  const getBreaksForSlot = (specialistId, timeSlot) => {
    return breaks.filter(b => {
      if (b.specialist_id !== specialistId) return false
      const breakStart = b.start_time?.substring(0, 5)
      const breakEnd = b.end_time?.substring(0, 5)
      return breakStart === timeSlot.substring(0, 5)
    })
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

  const handleSlotDurationChange = async (minutes) => {
    setSlotDuration(minutes)
    const salonId = facilityAccess?.salon_id
    if (!salonId) return
    const { error } = await supabase
      .from('calendar_settings')
      .upsert({ salon_id: salonId, slot_duration: minutes }, { onConflict: 'salon_id' })
    if (error) {
      console.error('Error saving slot duration:', error)
      toast.error('Failed to save slot duration')
    } else {
      toast.success(`Slot duration set to ${minutes} minutes`)
    }
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-full transition-all"
          >
            Today
          </button>
          <div className="flex items-center relative">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 text-white bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-l-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              ref={dateButtonRef}
              onClick={toggleCalendar}
              className="px-6 py-2 bg-purple-950/12 border-t border-b border-purple-500/10 text-white text-sm font-semibold w-40 text-center hover:bg-purple-950/20 transition-all cursor-pointer"
            >
              {formatDateDisplay(selectedDate)}
            </button>
            <button
              onClick={() => changeDate(1)}
              className="p-2 text-white bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-r-full transition-all"
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
                    className="fixed z-[99999] w-[580px] bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-3"
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
                        className="p-1.5 hover:bg-purple-500/50/10 rounded-lg transition-all"
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
                        className="p-1.5 hover:bg-purple-500/50/10 rounded-lg transition-all"
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
                                    h-8 w-7 rounded-lg text-xs font-medium transition-all hover:bg-purple-500/50/20 cursor-pointer
                                    ${isSelected
                                      ? 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20'
                                      : isToday
                                      ? 'bg-purple-900/30 text-purple-300 border border-purple-500/10'
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
                                    h-8 w-7 rounded-lg text-xs font-medium transition-all hover:bg-purple-500/50/20 cursor-pointer
                                    ${isSelected
                                      ? 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20'
                                      : isToday
                                      ? 'bg-purple-900/30 text-purple-300 border border-purple-500/10'
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
            className="w-[200px] !bg-purple-900/15 !border-purple-500/10 hover:!bg-purple-900/20 !rounded-full !px-4 !py-2 !text-sm !font-medium"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Bookings List Button with Notification Badge */}
          <button
            onClick={handlePendingClick}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-full transition-all flex items-center gap-2 relative"
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-full transition-all"
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
                className="fixed z-[99999] w-44 bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-2"
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
                <div className="border-t border-purple-500/10 my-2"></div>

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

                {/* Separator */}
                <div className="border-t border-purple-500/10 my-2"></div>

                {/* Slot Duration Section */}
                <div>
                  <div className="text-xs font-semibold text-white mb-2 px-2 text-center">Slot Duration</div>
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleSlotDurationChange(mins)}
                      className={`w-full text-center px-3 py-2 text-sm rounded-lg transition-all ${
                        slotDuration === mins
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-purple-800/25'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body
          )}

          <button
            onClick={handleNewBooking}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-full transition-all"
          >
            + New Booking
          </button>
        </div>
      </div>


      {/* Closed Banner */}
      {isDateClosed && (
        <div className="bg-gradient-to-r from-red-900/25 to-rose-900/25 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-300">Salon Closed — {closedReason}</p>
            <p className="text-[10px] text-red-400/60">Bookings are blocked for this date. App users cannot book either.</p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {isDateClosed ? null : specialists.length === 0 ? (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl border-t border-b border-purple-500/10 p-12 text-center">
          <div className="flex justify-center mb-4">
            <Users className="w-16 h-16 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-[Inter]">No Specialists Found</h3>
          <p className="text-gray-300">Add specialists first to view the calendar.</p>
        </div>
      ) : (
        <div ref={tableContainerRef} className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl border-t border-b border-purple-500/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
                <thead ref={theadRef}>
                  <tr className="border-b border-purple-500/10">
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
                {!isDateClosed && <tbody>
                  {timeSlots.map((timeSlot, index) => {
                    return (
                      <tr key={timeSlot} className="border-b-2 border-violet-700/25">
                        <td className="sticky left-0 z-10 px-3 pt-2 pb-3 text-sm font-medium border-r border-violet-700/25 text-white w-20 text-center align-top">
                          {formatTime(timeSlot)}
                        </td>
                        {filteredSpecialists.map((specialist) => {
                          const booking = getBookingForSlot(specialist.id, timeSlot)
                          const isOutsideWorkingHours = isTimeSlotOutsideWorkingHours(specialist.id, timeSlot)

                          // Calculate best subdivision that fits the cell height
                          const pixelHeight = parseInt(getSizeHeight())
                          const minSubHeight = 18
                          const maxSubs = Math.floor(pixelHeight / minSubHeight)
                          const intervalOptions = timeWindow === 60 ? [10, 15, 20, 30] : timeWindow === 30 ? [5, 10, 15] : [5, 15]
                          let subInterval = timeWindow
                          for (const iv of intervalOptions) {
                            if (Math.floor(timeWindow / iv) <= maxSubs) { subInterval = iv; break }
                          }
                          const subCount = Math.floor(timeWindow / subInterval)
                          const [slotH, slotM] = timeSlot.split(':').map(Number)

                          return (
                            <td
                              key={specialist.id}
                              className={`px-2 py-0 border-r border-violet-700/25 relative group/slot ${
                                isOutsideWorkingHours
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer'
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
                              {/* Time subdivisions on hover */}
                              {!isOutsideWorkingHours && !booking && (
                                <div className="absolute inset-0 flex flex-col opacity-0 group-hover/slot:opacity-100 transition-opacity z-[3]">
                                  {Array.from({ length: subCount }, (_, i) => {
                                    const totalMin = slotH * 60 + slotM + i * subInterval
                                    const subH = Math.floor(totalMin / 60)
                                    const subM = totalMin % 60
                                    const subTime = `${String(subH).padStart(2, '0')}:${String(subM).padStart(2, '0')}`
                                    return (
                                      <div
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSlotClick(specialist.id, subTime, e)
                                        }}
                                        className={`flex-1 flex items-center justify-center border-b border-purple-500/10 last:border-b-0 hover:bg-purple-700/25 transition-all cursor-pointer ${pixelHeight / subCount < 22 ? 'px-0.5' : 'px-1'}`}
                                      >
                                        <span className={`${pixelHeight / subCount < 22 ? 'text-[10px]' : 'text-xs'} font-bold text-white/70 hover:text-white transition-colors select-none`}>{subTime}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {booking && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (booking.status !== 'completed') handleBookingClick(booking)
                                  }}
                                  onMouseEnter={(e) => {
                                    clearTimeout(hoverTimeoutRef.current)
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    hoverTimeoutRef.current = setTimeout(() => {
                                      const tooltipWidth = 288 + 8 // w-72 (288px) + gap
                                      const fitsRight = rect.right + tooltipWidth < window.innerWidth
                                      setTooltipPos({
                                        x: fitsRight ? rect.right + 8 : rect.left - tooltipWidth,
                                        y: rect.top
                                      })
                                      setHoveredBooking(booking)
                                    }, 200)
                                  }}
                                  onMouseLeave={() => {
                                    clearTimeout(hoverTimeoutRef.current)
                                    setHoveredBooking(null)
                                  }}
                                  className={`absolute inset-x-2 p-2 rounded-lg text-xs cursor-pointer hover:brightness-110 transition-all overflow-hidden ${STATUS_COLORS[booking.status]}`}
                                  style={{
                                    top: `${calculateBookingOffset(booking.booking_time, timeSlot)}px`,
                                    height: `${calculateBookingHeight(booking.services?.duration_minutes || 30, booking.booking_time, timeSlot)}px`,
                                    zIndex: 5,
                                    ...(startedBookings.has(booking.id) && {
                                      backgroundImage: 'repeating-linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.15) 4px, rgba(59,130,246,0.15) 4px, rgba(59,130,246,0.15) 8px)',
                                      borderColor: 'rgba(16,185,129,0.6)',
                                      boxShadow: '0 0 12px rgba(16,185,129,0.2)'
                                    })
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div className="font-bold truncate flex-1 text-[11px] leading-tight text-white">
                                      {booking.services?.name || 'Service'} • {formatTime(booking.booking_time)} ({booking.services?.duration_minutes || 30}min)
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {isBookingLive(booking) && !startedBookings.has(booking.id) && (
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            await supabase.from('bookings').update({ status: 'in_progress' }).eq('id', booking.id)
                                            setStartedBookings(prev => new Set([...prev, booking.id]))
                                          }}
                                          className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/40 border border-emerald-400/60 rounded text-emerald-100 hover:bg-emerald-500/60 transition-all"
                                        >
                                          Start
                                        </button>
                                      )}
                                      {startedBookings.has(booking.id) && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 rounded text-emerald-200 animate-pulse">
                                          In Progress
                                        </span>
                                      )}
                                      {booking.created_via === 'mobile' ? (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-white/20 rounded text-white" title="Booked via Mobile App">App</span>
                                      ) : booking.created_via === 'web' ? (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-white/20 rounded text-white" title="Walk-in booking">Walk-in</span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="text-[12px] opacity-90 truncate text-white">
                                    {booking.customer_name || 'Guest'}
                                  </div>
                                  {booking.customer_phone && (
                                    <div className="text-[11px] opacity-80 truncate text-white">
                                      {formatPhoneNumber(booking.customer_phone)}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Break blocks */}
                              {getBreaksForSlot(specialist.id, timeSlot).map(brk => (
                                <div
                                  key={brk.id}
                                  className="absolute inset-x-2 rounded-lg text-xs overflow-hidden flex items-center justify-center cursor-pointer group"
                                  style={{
                                    top: `${calculateBookingOffset(brk.start_time, timeSlot)}px`,
                                    height: `${calculateBookingHeight(
                                      ((parseInt(brk.end_time?.substring(0, 2)) * 60 + parseInt(brk.end_time?.substring(3, 5))) -
                                       (parseInt(brk.start_time?.substring(0, 2)) * 60 + parseInt(brk.start_time?.substring(3, 5)))),
                                      brk.start_time, timeSlot
                                    )}px`,
                                    zIndex: 4,
                                    backgroundImage: 'repeating-linear-gradient(135deg, rgba(156,163,175,0.15), rgba(156,163,175,0.15) 4px, rgba(107,114,128,0.1) 4px, rgba(107,114,128,0.1) 8px)',
                                    border: '1.5px dashed rgba(156,163,175,0.4)',
                                    borderRadius: '8px'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[10px] font-medium text-gray-400">{brk.label}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteBreak(brk.id)
                                    }}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/50 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>}
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
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] w-full max-w-[980px] max-h-[80vh] bg-purple-950/40 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl overflow-hidden">
            <div className="sticky top-0 bg-black border-b border-purple-500/10 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white font-[Inter]">Pending Bookings ({pendingCount})</h2>
              <button
                onClick={() => setShowPendingPopout(false)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition-all"
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
                  <div className="flex items-center gap-4 px-3 pb-2 border-b border-purple-500/[0.06]">
                    <div className="flex-[3] text-center text-xs font-semibold text-purple-300 uppercase tracking-wide">Service / Specialist</div>
                    <div className="flex-[2] text-center text-xs font-semibold text-purple-300 uppercase tracking-wide">Customer</div>
                    <div className="flex-[1.5] text-center text-xs font-semibold text-purple-300 uppercase tracking-wide">Date</div>
                    <div className="flex-[1] text-center text-xs font-semibold text-purple-300 uppercase tracking-wide">Time</div>
                    <div className="flex-[2.5] text-center text-xs font-semibold text-purple-300 uppercase tracking-wide">Actions</div>
                  </div>

                  {/* Bookings List */}
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`relative overflow-hidden border rounded-lg p-3 hover:brightness-110 transition-all ${
                        booking.status === 'pending'
                          ? 'bg-gradient-to-r from-yellow-500/15 to-transparent border-yellow-500/25'
                          : 'bg-gradient-to-r from-blue-500/15 to-transparent border-blue-500/25'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-[3] text-center truncate">
                          <span className="text-sm font-semibold text-white">{booking.services?.name || 'Service'}</span>
                          <span className="text-[10px] text-gray-400 mx-1">by</span>
                          <span className="text-sm font-semibold text-white">{booking.specialists?.name || '—'}</span>
                        </div>
                        <div className="flex-[2] text-center truncate">
                          <div className="text-sm text-gray-300">{booking.customer_name || 'Guest'}</div>
                          <div className="text-[10px] text-gray-500">{booking.customer_phone || ''}</div>
                        </div>
                        <div className="flex-[1.5] text-sm text-gray-300 text-center">
                          {new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-[1] text-sm text-gray-300 text-center">
                          {booking.booking_time?.substring(0, 5)}
                        </div>
                        <div className="flex-[2.5] flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditPendingBooking(booking)}
                            className="px-3 py-1.5 bg-purple-600/40 border border-purple-400/50 text-purple-100 rounded-md transition-all hover:bg-purple-600/60"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="px-3 py-1.5 bg-blue-600/40 border border-blue-400/50 text-blue-100 rounded-md transition-all hover:bg-blue-600/60"
                            title="Confirm"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setCompletionBooking(booking)
                              setShowCompletionModal(true)
                            }}
                            className="px-3 py-1.5 bg-emerald-600/40 border border-emerald-400/50 text-emerald-100 rounded-md transition-all hover:bg-emerald-600/60"
                            title="Complete"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="px-3 py-1.5 bg-rose-600/40 border border-rose-400/50 text-rose-100 rounded-md transition-all hover:bg-rose-600/60"
                            title="Cancel"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-[#120025] p-4 border-t border-purple-500/10 flex justify-between items-center">
              <button
                onClick={() => navigate('/bookings')}
                className="px-4 py-2 text-sm text-purple-200 hover:text-white  transition-all"
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

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false)
          setCompletionBooking(null)
        }}
        onComplete={() => {
          setShowCompletionModal(false)
          setCompletionBooking(null)
          updateBookingStatus(completionBooking?.id, 'completed')
        }}
        booking={completionBooking ? {
          id: completionBooking.id,
          bookingId: completionBooking.id,
          customer_name: completionBooking.customer_name,
          customerName: completionBooking.customer_name,
          services: completionBooking.services,
          serviceName: completionBooking.services?.name,
          servicePrice: completionBooking.services?.price,
          final_price: completionBooking.final_price || completionBooking.services?.price,
          user_id: completionBooking.user_id
        } : null}
        facilityId={facilityAccess?.salon_id}
        specialistId={completionBooking?.specialist_id}
      />

      {/* Slot Menu (Booking or Break) */}
      {slotMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[99997]" onClick={() => setSlotMenu(null)} />
          <div
            className="fixed z-[99998] bg-gray-900/95 border border-purple-500/30 rounded-lg shadow-2xl p-1.5 flex flex-col gap-1"
            style={{ top: slotMenu.y + 4, left: slotMenu.x + 4 }}
          >
            <button
              onClick={handleSlotNewBooking}
              className="px-4 py-2 text-xs font-medium text-white bg-purple-600/30 border border-purple-500/30 rounded-md hover:bg-purple-600/50 transition-all text-left"
            >
              + New Booking
            </button>
            <button
              onClick={handleSlotAddBreak}
              className="px-4 py-2 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-all text-left"
            >
              + Add Break
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Break Modal */}
      {showBreakModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999999] p-4" onClick={() => setShowBreakModal(false)}>
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-xs p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-4">Add Break</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Label</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['Break', 'Lunch', 'Personal', 'Meeting'].map(l => (
                    <button
                      key={l}
                      onClick={() => setBreakForm(prev => ({ ...prev, label: l }))}
                      className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-all ${
                        breakForm.label === l
                          ? 'bg-purple-600/30 border-purple-500/50 text-white'
                          : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-purple-500/30'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Start</label>
                  <input
                    type="time"
                    value={breakForm.startTime}
                    onChange={e => setBreakForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-purple-950/40 border border-purple-500/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">End</label>
                  <input
                    type="time"
                    value={breakForm.endTime}
                    onChange={e => setBreakForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-purple-950/40 border border-purple-500/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowBreakModal(false)} className="flex-1 py-2 text-xs text-gray-400 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-all">Cancel</button>
                <button onClick={addBreak} className="flex-1 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-all">Add Break</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Booking Hover Tooltip */}
      {hoveredBooking && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, duration: 0.15 }}
            className="fixed z-[9999] w-72 bg-gray-900/95 backdrop-blur-xl border border-purple-500/40 rounded-xl shadow-2xl shadow-purple-900/30 p-4 pointer-events-none"
            style={{
              top: Math.min(tooltipPos.y, window.innerHeight - 340),
              left: Math.min(tooltipPos.x, window.innerWidth - 300),
            }}
          >
            {/* Service name + Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  hoveredBooking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  hoveredBooking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  hoveredBooking.status === 'in_progress' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  hoveredBooking.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {hoveredBooking.status}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-white font-bold text-sm">{hoveredBooking.services?.name || 'Service'}</span>
              </div>
              {hoveredBooking.created_via && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  {hoveredBooking.created_via === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                  {hoveredBooking.created_via === 'mobile' ? 'App' : 'Walk-in'}
                </span>
              )}
            </div>

            {/* Details grid */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="text-gray-400">Customer</span>
                <span className="text-white ml-auto font-medium">
                  {hoveredBooking.customers?.preferred_language === 'en' ? '🇬🇧 ' : hoveredBooking.customers?.preferred_language === 'ru' ? '🇷🇺 ' : '🇬🇪 '}
                  {hoveredBooking.customer_name || 'Guest'}
                </span>
              </div>

              {hoveredBooking.customer_phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-400">Phone</span>
                  <span className="text-white ml-auto font-medium">{formatPhoneNumber(hoveredBooking.customer_phone)}</span>
                </div>
              )}

              {hoveredBooking.customer_email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-400">Email</span>
                  <span className="text-white ml-auto font-medium truncate max-w-[140px]">{hoveredBooking.customer_email}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="text-gray-400">Time</span>
                <span className="text-white ml-auto font-medium">{formatTime(hoveredBooking.booking_time)} · {hoveredBooking.services?.duration_minutes || 30} min</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Users className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="text-gray-400">Specialist</span>
                <span className="text-white ml-auto font-medium">{hoveredBooking.specialists?.name || '—'}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="text-gray-400">Price</span>
                <span className="text-white ml-auto font-medium">
                  {hoveredBooking.final_price || hoveredBooking.services?.price || 0} GEL
                  {hoveredBooking.discount_amount > 0 && (
                    <span className="text-green-400 ml-1">(-{hoveredBooking.discount_amount})</span>
                  )}
                </span>
              </div>

              {hoveredBooking.additional_services?.length > 0 && (
                <div className="pt-1.5 mt-1 border-t border-purple-500/15 space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Additional Services</span>
                  {hoveredBooking.additional_services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">+ {s.service_name}</span>
                      <span className="text-purple-400 font-medium">{s.price} GEL</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 text-xs">
                <FileText className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">Notes</span>
                <span className="text-gray-300 ml-auto font-medium max-w-[160px] text-right leading-relaxed">{hoveredBooking.notes || '—'}</span>
              </div>

              {hoveredBooking.promo_code && (
                <div className="flex items-center gap-2 text-xs">
                  <Tag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-400">Promo</span>
                  <span className="text-green-300 ml-auto font-medium">{hoveredBooking.promo_code}</span>
                </div>
              )}

              {hoveredBooking.created_at && (
                <div className="flex items-center gap-2 text-xs pt-2 border-t border-purple-500/20">
                  <CalendarIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-400">Booked on</span>
                  <span className="text-white/60 ml-auto font-medium">{new Date(hoveredBooking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
