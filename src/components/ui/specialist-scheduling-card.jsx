import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, MapPin, Clock, Check, X, Coins } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * SpecialistSchedulingCard - An interactive scheduling component for booking salon appointments
 * @param {Object} props
 * @param {string} props.specialistId - The specialist's ID
 * @param {Function} props.onBookingComplete - Callback when booking is completed
 * @param {string} props.facilityId - The salon/facility ID
 * @param {Object} props.prefilledDateTime - Optional prefilled date and time {date: string, time: string}
 * @param {Object} props.initialBookingData - Optional existing booking data for editing
 */
export function SpecialistSchedulingCard({ specialistId, onBookingComplete, facilityId, prefilledDateTime = null, initialBookingData = null }) {
  const [specialist, setSpecialist] = useState(null)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [availableSlots, setAvailableSlots] = useState({})
  const [loading, setLoading] = useState(true)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [timeSlotInterval, setTimeSlotInterval] = useState(30) // Default 30 minutes
  const [defaultTimeSlots, setDefaultTimeSlots] = useState([])
  const [workingHoursCache, setWorkingHoursCache] = useState(null)

  // Customer information
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customers, setCustomers] = useState([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState([])

  // Booking status (only for editing)
  const [bookingStatus, setBookingStatus] = useState('confirmed')

  useEffect(() => {
    if (specialistId && facilityId) {
      fetchSpecialistData()
      fetchServices()
      fetchCustomers()
      fetchCalendarSettings()
    }
  }, [specialistId, facilityId])

  useEffect(() => {
    if (timeSlotInterval > 0) {
      generateDefaultTimeSlots()
    }
  }, [timeSlotInterval, workingHoursCache])

  useEffect(() => {
    if (specialist && timeSlotInterval > 0) {
      fetchAvailableSlots()
    }
  }, [currentWeekStart, specialist, selectedService, timeSlotInterval])

  // Handle prefilled date and time
  useEffect(() => {
    if (prefilledDateTime && prefilledDateTime.date && prefilledDateTime.time) {
      const prefilledDate = new Date(prefilledDateTime.date)
      const weekStart = getWeekStart(prefilledDate)

      // Set the week to show the prefilled date
      setCurrentWeekStart(weekStart)

      // Set the selected date and time
      setSelectedDate(prefilledDateTime.date)
      setSelectedTime(prefilledDateTime.time)
    }
  }, [prefilledDateTime])

  // Handle initial booking data for editing
  useEffect(() => {
    if (initialBookingData && services.length > 0) {
      // Set customer info
      setCustomerName(initialBookingData.customer_name || '')
      setCustomerPhone(initialBookingData.customer_phone || '')

      // Set service
      const service = services.find(s => s.id === initialBookingData.service_id)
      if (service) {
        setSelectedService(service)
      }

      // Set date and time
      if (initialBookingData.booking_date) {
        const bookingDate = initialBookingData.booking_date
        const weekStart = getWeekStart(new Date(bookingDate))
        setCurrentWeekStart(weekStart)
        setSelectedDate(bookingDate)
      }

      if (initialBookingData.booking_time) {
        setSelectedTime(initialBookingData.booking_time.substring(0, 5))
      }

      // Set status
      if (initialBookingData.status) {
        setBookingStatus(initialBookingData.status)
      }
    }
  }, [initialBookingData, services])

  /**
   * Get the start of the week (Monday)
   */
  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  /**
   * Fetch specialist data from database
   */
  const fetchSpecialistData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('id', specialistId)
        .single()

      if (error) throw error
      setSpecialist(data)
    } catch (error) {
      console.error('Error fetching specialist:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch available services for this specialist
   */
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', facilityId)
        .order('name')

      if (error) throw error
      setServices(data || [])
      // Don't auto-select first service, let user choose
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  /**
   * Fetch existing customers from bookings
   */
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('customer_name, customer_phone')
        .eq('salon_id', facilityId)
        .not('customer_name', 'is', null)
        .not('customer_phone', 'is', null)

      if (error) throw error

      // Get unique customers based on phone number
      const uniqueCustomers = []
      const seenPhones = new Set()

      data?.forEach(booking => {
        if (!seenPhones.has(booking.customer_phone)) {
          seenPhones.add(booking.customer_phone)
          uniqueCustomers.push({
            name: booking.customer_name,
            phone: booking.customer_phone
          })
        }
      })

      setCustomers(uniqueCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  /**
   * Handle customer name input change
   */
  const handleCustomerNameChange = (value) => {
    setCustomerName(value)

    if (value.trim().length > 0) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCustomers(filtered)
      setShowCustomerDropdown(filtered.length > 0)
    } else {
      setShowCustomerDropdown(false)
      setFilteredCustomers([])
    }
  }

  /**
   * Handle customer selection from dropdown
   */
  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setShowCustomerDropdown(false)
    setFilteredCustomers([])
  }

  /**
   * Fetch calendar settings to get time slot interval
   */
  const fetchCalendarSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('slot_duration')
        .eq('salon_id', facilityId)
        .single()

      if (error) {
        console.log('No calendar settings found, using default 30 minutes')
        setTimeSlotInterval(30)
      } else {
        setTimeSlotInterval(data.slot_duration || 30)
      }

      // Fetch working hours - try specialist hours first, fallback to salon hours
      const { data: specialistHours } = await supabase
        .from('specialist_working_hours')
        .select('*')
        .eq('specialist_id', specialistId)

      let hours = null
      if (specialistHours && specialistHours.length > 0) {
        hours = specialistHours
      } else {
        const { data: salonHours } = await supabase
          .from('working_hours')
          .select('*')
          .eq('salon_id', facilityId)
        hours = salonHours
      }

      setWorkingHoursCache(hours)
    } catch (error) {
      console.error('Error fetching calendar settings:', error)
      setTimeSlotInterval(30) // Default to 30 minutes
    }
  }

  /**
   * Generate default time slots to always display
   */
  const generateDefaultTimeSlots = () => {
    if (!workingHoursCache || workingHoursCache.length === 0) {
      // Default fallback
      const slots = generateTimeSlots('09:00', '18:00', timeSlotInterval)
      setDefaultTimeSlots(slots)
      return
    }

    // Get earliest start and latest end from all working hours
    let earliestStart = '09:00'
    let latestEnd = '18:00'

    workingHoursCache.forEach(hours => {
      if (!hours.is_closed && !hours.is_day_off) {
        const startTime = (hours.start_time || hours.open_time || '09:00').substring(0, 5)
        const endTime = (hours.end_time || hours.close_time || '18:00').substring(0, 5)

        if (startTime < earliestStart) earliestStart = startTime
        if (endTime > latestEnd) latestEnd = endTime
      }
    })

    const slots = generateTimeSlots(earliestStart, latestEnd, timeSlotInterval)
    setDefaultTimeSlots(slots)
  }

  /**
   * Fetch available time slots for the current week
   */
  const fetchAvailableSlots = async () => {
    try {
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart)
        date.setDate(date.getDate() + i)
        return date.toISOString().split('T')[0]
      })

      // Fetch existing bookings for this specialist in the week
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, service_id')
        .eq('specialist_id', specialistId)
        .gte('booking_date', weekDays[0])
        .lte('booking_date', weekDays[6])
        .neq('status', 'cancelled')

      if (bookingsError) throw bookingsError

      // Fetch working hours by specific dates
      const { data: specialistHours } = await supabase
        .from('specialist_working_hours')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('work_date', weekDays[0])
        .lte('work_date', weekDays[6])

      console.log('Specialist working hours for week:', specialistHours)

      // Generate available slots
      const slots = {}
      weekDays.forEach((date) => {
        console.log(`Processing date ${date}`)

        // Find ALL working hours for this specific date
        let dayShifts = []
        if (specialistHours && specialistHours.length > 0) {
          dayShifts = specialistHours.filter(h => {
            const matches = h.work_date === date
            const notClosed = !h.is_closed && !h.is_day_off
            console.log(`  Checking shift: work_date=${h.work_date}, matches=${matches}, notClosed=${notClosed}`)
            return matches && notClosed
          })
        }

        console.log(`  Found ${dayShifts.length} shifts for ${date}:`, dayShifts)

        // Generate time slots from all shifts for this day
        if (dayShifts.length > 0) {
          let allTimeSlots = []

          // Generate time slots for each shift
          dayShifts.forEach(shift => {
            const startTime = shift.start_time || '09:00'
            const endTime = shift.end_time || '18:00'
            console.log(`    Generating slots for shift: ${startTime} - ${endTime}`)
            const shiftSlots = generateTimeSlots(
              startTime.substring(0, 5),
              endTime.substring(0, 5),
              timeSlotInterval
            )
            allTimeSlots = [...allTimeSlots, ...shiftSlots]
          })

          // Remove duplicates and sort
          allTimeSlots = [...new Set(allTimeSlots)].sort()

          // Filter out booked slots (but keep the current booking's time available when editing)
          const bookedTimes = bookings
            ?.filter(b => {
              // Exclude current booking when editing
              if (initialBookingData && b.id === initialBookingData.id) {
                return false
              }
              return b.booking_date === date
            })
            .map(b => b.booking_time.substring(0, 5)) || []

          slots[date] = allTimeSlots.filter(slot => !bookedTimes.includes(slot))
          console.log(`  Final available slots for ${date}:`, slots[date].length, 'slots')
        } else {
          // No working hours defined for this day - no available slots
          slots[date] = []
          console.log(`  No shifts found for ${date}, setting slots to empty`)
        }
      })

      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error fetching available slots:', error)
    }
  }

  /**
   * Generate time slots between start and end time
   */
  function generateTimeSlots(startTime, endTime, durationMinutes) {
    const slots = []
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)

    let current = new Date(start)
    while (current < end) {
      slots.push(current.toTimeString().substring(0, 5))
      current = new Date(current.getTime() + durationMinutes * 60000)
    }

    return slots
  }

  /**
   * Navigate to previous week
   */
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
    setSelectedDate(null)
    setSelectedTime(null)
  }

  /**
   * Navigate to next week
   */
  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
    setSelectedDate(null)
    setSelectedTime(null)
  }

  /**
   * Handle booking confirmation with specific status
   */
  const handleConfirmBooking = async (status = 'confirmed') => {
    if (!selectedDate || !selectedTime || !selectedService) return

    // Validate customer information
    if (!customerName || !customerPhone) {
      alert('Please enter customer name and phone number')
      return
    }

    try {
      setLoading(true)

      const bookingData = {
        salon_id: facilityId,
        specialist_id: specialistId,
        service_id: selectedService.id,
        booking_date: selectedDate,
        booking_time: selectedTime + ':00',
        status: status,
        customer_name: customerName,
        customer_phone: customerPhone,
        created_via: 'web', // Mark bookings from CRM as 'web'
      }

      let error = null

      if (initialBookingData) {
        // UPDATE existing booking
        const result = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', initialBookingData.id)
        error = result.error
      } else {
        // INSERT new booking
        const result = await supabase
          .from('bookings')
          .insert([bookingData])
        error = result.error
      }

      if (error) throw error

      setBookingConfirmed(true)
      setTimeout(() => {
        setBookingConfirmed(false)
        setSelectedDate(null)
        setSelectedTime(null)
        setCustomerName('')
        setCustomerPhone('')
        setShowCustomerDropdown(false)
        setFilteredCustomers([])
        if (onBookingComplete) onBookingComplete()
        fetchAvailableSlots() // Refresh available slots
        fetchCustomers() // Refresh customers list
      }, 2000)
    } catch (error) {
      console.error('Error saving booking:', error)
      alert('Error saving booking: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get weekday name
   */
  function getWeekdayName(date) {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }

  /**
   * Get day number
   */
  function getDayNumber(date) {
    return new Date(date).getDate()
  }

  /**
   * Get month name
   */
  function getMonthName(date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short' })
  }

  /**
   * Check if date is today
   */
  function isToday(date) {
    const today = new Date()
    const checkDate = new Date(date)
    return today.toDateString() === checkDate.toDateString()
  }

  /**
   * Check if date is in the past
   */
  function isPastDate(date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  if (loading && !specialist) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!specialist) {
    return (
      <div className="text-center p-8 text-gray-400">
        Specialist not found
      </div>
    )
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden"
    >
      {/* Specialist Profile Header */}
      <div className="p-4 border-b border-purple-700">
        <div className="grid grid-cols-2 gap-4 divide-x divide-purple-700">
          {/* Left Side: Specialist & Service */}
          <div className="pr-4 space-y-2">
            <div className="flex items-center gap-3">
              {/* Specialist Image */}
              {specialist.image_url && (
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  src={specialist.image_url}
                  alt={specialist.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                />
              )}

              {/* Specialist Info */}
              <div className="flex-1 flex flex-col justify-center">
                <motion.h3
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg font-bold text-white font-[Calibri,sans-serif]"
                >
                  {specialist.name}
                </motion.h3>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-purple-200 text-xs mt-0.5"
                >
                  {specialist.title || 'Specialist'}
                </motion.p>

                {/* Rating */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-1 mt-1"
                >
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-white text-sm font-semibold">
                    {specialist.rating || '5.0'}
                  </span>
                  <span className="text-purple-300 text-xs ml-1">
                    ({specialist.reviews_count || '0'})
                  </span>
                </motion.div>
              </div>

              {/* Service Selector - Next to specialist */}
              {services.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-48"
                >
                  <select
                    value={selectedService?.id || ''}
                    onChange={(e) => {
                      const service = services.find(s => s.id === e.target.value)
                      setSelectedService(service)
                    }}
                    className="w-full px-3 py-1.5 text-sm bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-9"
                  >
                    <option value="" disabled className="bg-purple-950 text-gray-400">Select Service *</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id} className="bg-purple-950">
                        {service.name}
                      </option>
                    ))}
                  </select>

                  {/* Service Details */}
                  {selectedService && (
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
                      <div className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-purple-950/25 border border-purple-700/50 rounded-md text-purple-300">
                        <Coins className="w-4 h-4" />
                        <span>{selectedService.price} ₾</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-purple-950/25 border border-purple-700/50 rounded-md text-purple-300">
                        <Clock className="w-4 h-4" />
                        <span>{selectedService.duration_minutes} min</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Side: Customer Information */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pl-4 flex flex-col justify-center space-y-2"
          >
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                onFocus={() => {
                  if (customerName.trim().length > 0 && filteredCustomers.length > 0) {
                    setShowCustomerDropdown(true)
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on dropdown
                  setTimeout(() => setShowCustomerDropdown(false), 200)
                }}
                placeholder="Customer Name *"
                className="w-full px-3 py-1.5 text-sm bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 h-9"
                autoComplete="off"
              />

              {/* Customer Dropdown */}
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-purple-950/95 border border-purple-700 rounded-lg shadow-xl max-h-32 overflow-y-auto">
                  {filteredCustomers.map((customer, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-2 py-1.5 text-left text-xs text-white hover:bg-purple-800/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-purple-300 text-[10px]">{customer.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone Number *"
                className="w-full px-3 py-1.5 text-sm bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 h-9"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Combined Date & Time Selection */}
      <div className="p-4">
        {/* Week Navigation Header */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <button
            onClick={goToPreviousWeek}
            className="p-1.5 rounded-full bg-purple-900/30 border border-purple-700 text-white hover:bg-purple-900/50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <motion.div
            key={currentWeekStart.toISOString()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-white text-sm font-semibold font-[Calibri,sans-serif]">
              {getMonthName(weekDays[0])} {getDayNumber(weekDays[0])} - {getMonthName(weekDays[6])} {getDayNumber(weekDays[6])}
            </div>
          </motion.div>

          <button
            onClick={goToNextWeek}
            className="p-1.5 rounded-full bg-purple-900/30 border border-purple-700 text-white hover:bg-purple-900/50 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Week Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((date, index) => {
            const isSelected = selectedDate === date
            const disabled = isPastDate(date)
            const slotsCount = availableSlots[date]?.length || 0

            return (
              <motion.button
                key={date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (!disabled && slotsCount > 0) {
                    setSelectedDate(date)
                    setSelectedTime(null)
                  }
                }}
                disabled={disabled || slotsCount === 0}
                className={`
                  p-2 rounded-lg border-2 transition-all text-center
                  ${isSelected
                    ? 'border-purple-500 bg-purple-900/40 shadow-lg shadow-purple-500/30'
                    : disabled || slotsCount === 0
                      ? 'border-purple-700/30 bg-purple-950/10'
                      : 'border-purple-700/50 bg-purple-950/25 hover:border-purple-600'
                  }
                  ${disabled || slotsCount === 0
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                  ${isToday(date) ? 'ring-2 ring-purple-400' : ''}
                `}
              >
                <div className={`text-[10px] font-medium mb-0.5 ${disabled || slotsCount === 0 ? 'text-purple-400/40' : 'text-purple-300'}`}>
                  {getWeekdayName(date)}
                </div>
                <div className={`text-lg font-bold ${disabled || slotsCount === 0 ? 'text-purple-400/40' : 'text-white'}`}>
                  {getDayNumber(date)}
                </div>
                <div className={`text-[10px] mt-0.5 ${disabled || slotsCount === 0 ? 'text-purple-400/40' : 'text-purple-300'}`}>
                  {slotsCount > 0 ? `${slotsCount}` : 'Full'}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Time Slots - Only show available slots */}
        {selectedDate && (
          <div className="border-t border-purple-700 pt-3 mt-3">
            {availableSlots[selectedDate] && availableSlots[selectedDate].length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                {availableSlots[selectedDate].map((time) => {
                  const isSelected = selectedTime === time

                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`
                        px-2 py-1.5 rounded-lg border-2 transition-all text-xs font-medium cursor-pointer
                        ${isSelected
                          ? 'border-purple-500 bg-purple-900/40 text-white shadow-lg shadow-purple-500/30'
                          : 'border-purple-700/50 bg-purple-950/25 text-purple-200 hover:border-purple-600'
                        }
                      `}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-purple-300">
                No available time slots for this date
              </div>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="border-t border-purple-700 pt-3 mt-3">
            <div className="text-center py-8 text-purple-300">
              Select a date to view available times
            </div>
          </div>
        )}

        {/* Booking Summary & Confirmation */}
        <AnimatePresence mode="wait">
          {selectedDate && selectedTime && selectedService && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="border-t border-purple-700 pt-3 mt-3 pb-0"
            >
              <div className="grid grid-cols-3 gap-2 text-purple-200 text-xs mb-3">
                <div className="flex items-center gap-1.5 justify-start">
                  <Star className="w-3 h-3 text-purple-400" />
                  <span><strong className="text-white">{selectedService.name}</strong> with {specialist.name}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>{getWeekdayName(selectedDate)}, {getMonthName(selectedDate)} {getDayNumber(selectedDate)} at {selectedTime}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Coins className="w-3 h-3 text-purple-400" />
                  <span>{selectedService.price} ₾ ({selectedService.duration_minutes} min)</span>
                </div>
              </div>

              {initialBookingData ? (
                // Edit mode: Show 4 status buttons
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleConfirmBooking('pending')}
                    disabled={loading}
                    className="px-3 py-2 bg-gradient-to-br from-yellow-800/60 to-yellow-900/60 border border-yellow-400/60 text-yellow-50 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all text-xs font-medium"
                  >
                    {loading ? 'Saving...' : 'Pending'}
                  </button>
                  <button
                    onClick={() => handleConfirmBooking('confirmed')}
                    disabled={loading}
                    className="px-3 py-2 bg-gradient-to-br from-blue-900/60 to-blue-800/60 border border-blue-500/50 text-blue-100 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all text-xs font-medium"
                  >
                    {loading ? 'Saving...' : 'Confirmed'}
                  </button>
                  <button
                    onClick={() => handleConfirmBooking('completed')}
                    disabled={loading}
                    className="px-3 py-2 bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-600/50 text-emerald-200 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all text-xs font-medium"
                  >
                    {loading ? 'Saving...' : 'Completed'}
                  </button>
                  <button
                    onClick={() => handleConfirmBooking('cancelled')}
                    disabled={loading}
                    className="px-3 py-2 bg-gradient-to-br from-rose-900/40 to-red-900/40 border border-rose-600/50 text-rose-200 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all text-xs font-medium"
                  >
                    {loading ? 'Saving...' : 'Cancelled'}
                  </button>
                </div>
              ) : (
                // New booking mode: Show Cancel and Confirm buttons
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDate(null)
                      setSelectedTime(null)
                    }}
                    className="flex-1 px-3 py-1.5 border border-purple-700 text-purple-200 rounded-lg hover:bg-purple-800/30 transition-all flex items-center justify-center gap-1 text-xs"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmBooking('confirmed')}
                    disabled={loading}
                    className="flex-1 px-3 py-1.5 bg-blue-600 border border-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1 text-xs"
                  >
                    <Check className="w-3 h-3" />
                    {loading ? 'Confirming...' : 'Confirm'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Confirmed Animation */}
      <AnimatePresence>
        {bookingConfirmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-r from-purple-900/95 to-violet-900/95 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <Check className="w-7 h-7 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold text-white mb-1 font-[Calibri,sans-serif]">
                {initialBookingData ? 'Edit saved' : 'Booking Confirmed!'}
              </h3>
              <p className="text-purple-200 text-sm">
                {initialBookingData ? 'Changes have been saved' : 'Your appointment has been scheduled'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
