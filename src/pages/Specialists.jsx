import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import { NativeDelete } from '../components/ui/delete-button'
import ClassicLoader from '../components/ui/loader'
import TimePickerModal from '../components/ui/TimePickerModal'
import { Users, Edit, Plus, Trash2, X, LayoutGrid, List, Star, Briefcase, Clock, DollarSign, Plane, Copy, ChevronLeft, ChevronRight, Ban, Save } from 'lucide-react'

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
]

export default function Specialists() {
  const { facilityAccess } = useAuth()
  const toast = useToast()
  const [specialists, setSpecialists] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSpecialist, setEditingSpecialist] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'grid' or 'list'
  const [activeTab, setActiveTab] = useState('specialists') // 'specialists', 'hours', 'salaries'

  // Salary/commission management
  const [commissions, setCommissions] = useState({})
  const [salaryData, setSalaryData] = useState({})
  const [salaryLoading, setSalaryLoading] = useState(false)
  const [salaryPeriod, setSalaryPeriod] = useState('month') // day, week, month
  const [salarySearch, setSalarySearch] = useState('')

  // Working hours management - grid format
  const [allSpecialistsWorkingHours, setAllSpecialistsWorkingHours] = useState({})
  const [notWorkingDays, setNotWorkingDays] = useState({})
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    // Get current week's Monday
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day // Adjust when day is Sunday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  })
  const [timePickerModal, setTimePickerModal] = useState({
    isOpen: false,
    specialistId: null,
    shiftId: null,
    day: null,
    openTime: '09:00',
    closeTime: '18:00'
  })

  // Utilisation state
  const [utilisationData, setUtilisationData] = useState({})
  const [workingHours, setWorkingHours] = useState([])

  // Form fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState(['ka'])
  const [selectedServices, setSelectedServices] = useState([])

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchServices()
      fetchSpecialists()
      fetchWorkingHours()
    } else {
      setLoading(false)
    }
  }, [facilityAccess])

  // Calculate utilisation when specialists change
  useEffect(() => {
    if (specialists.length > 0 && workingHours.length > 0) {
      calculateUtilisation()
    }
  }, [specialists, workingHours])

  // Fetch all specialists working hours when specialists are loaded or week changes
  useEffect(() => {
    if (specialists.length > 0) {
      fetchAllSpecialistsWorkingHours()
    }
  }, [specialists, selectedWeekStart])

  // Fetch salary data when salaries tab is active or period changes
  useEffect(() => {
    if (activeTab === 'salaries' && specialists.length > 0) {
      fetchCommissions()
      fetchSalaryData()
    }
  }, [activeTab, specialists, salaryPeriod])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchSpecialists = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('specialists')
        .select('*, specialist_services(service_id, services(name))')
        .eq('salon_id', facilityAccess.salon_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch real ratings from reviews
      const specialistIds = (data || []).map(s => s.id)
      let ratingsMap = {}
      let countMap = {}
      if (specialistIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('specialist_id, rating')
          .in('specialist_id', specialistIds)

        if (reviewsData) {
          const grouped = {}
          reviewsData.forEach(r => {
            if (!grouped[r.specialist_id]) grouped[r.specialist_id] = []
            grouped[r.specialist_id].push(r.rating)
          })
          Object.entries(grouped).forEach(([id, ratings]) => {
            ratingsMap[id] = parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
            countMap[id] = ratings.length
          })
        }
      }

      const specialistsWithRatings = (data || []).map(s => ({
        ...s,
        rating: ratingsMap[s.id] ?? null,
        reviewCount: countMap[s.id] || 0
      }))

      setSpecialists(specialistsWithRatings)
    } catch (error) {
      console.error('Error fetching specialists:', error)
      toast.error('Error loading specialists: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)

      if (error) throw error
      setWorkingHours(data || [])
    } catch (error) {
      console.error('Error fetching working hours:', error)
    }
  }

  const calculateUtilisation = async () => {
    try {
      // Fetch all bookings for this salon with specialist info
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('specialist_id, services(duration_minutes), status, created_at')
        .eq('salon_id', facilityAccess.salon_id)
        .in('status', ['completed', 'confirmed'])

      if (error) throw error

      // Calculate total available hours per week from working hours
      let totalWeeklyHours = 0
      workingHours.forEach(wh => {
        if (!wh.is_closed && wh.open_time && wh.close_time) {
          const [openHour, openMin] = wh.open_time.substring(0, 5).split(':').map(Number)
          const [closeHour, closeMin] = wh.close_time.substring(0, 5).split(':').map(Number)
          const dailyHours = (closeHour * 60 + closeMin - (openHour * 60 + openMin)) / 60
          totalWeeklyHours += dailyHours
        }
      })

      // Calculate utilisation for each specialist
      const utilisationMap = {}

      specialists.forEach(specialist => {
        // Get bookings for this specialist
        const specialistBookings = (bookings || []).filter(b => b.specialist_id === specialist.id)

        // Sum up worked hours (duration of all bookings in minutes, convert to hours)
        const workedMinutes = specialistBookings.reduce((sum, booking) => {
          return sum + (booking.services?.duration_minutes || 0)
        }, 0)
        const workedHours = workedMinutes / 60

        // Calculate weeks since specialist was created (or last 4 weeks as default)
        const createdAt = new Date(specialist.created_at)
        const now = new Date()
        const weeksSinceCreated = Math.max(1, Math.ceil((now - createdAt) / (7 * 24 * 60 * 60 * 1000)))
        const weeksToConsider = Math.min(4, weeksSinceCreated) // Consider last 4 weeks

        // Calculate available hours for this specialist
        const availableHours = totalWeeklyHours * weeksToConsider

        // Calculate utilisation rate as percentage
        const utilisationRate = availableHours > 0 ? (workedHours / availableHours) * 100 : 0

        utilisationMap[specialist.id] = {
          workedHours: workedHours.toFixed(1),
          availableHours: availableHours.toFixed(1),
          rate: Math.min(100, utilisationRate.toFixed(1)) // Cap at 100%
        }
      })

      setUtilisationData(utilisationMap)
    } catch (error) {
      console.error('Error calculating utilisation:', error)
    }
  }

  const resetForm = () => {
    setName('')
    setBio('')
    setImageFile(null)
    setImagePreview('')
    setExperienceYears('')
    setSelectedLanguages(['ka'])
    setSelectedServices([])
    setEditingSpecialist(null)
    setShowAddForm(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowAddForm(true)
  }

  const handleEdit = (specialist) => {
    setName(specialist.name)
    setBio(specialist.bio || '')
    setImagePreview(specialist.image_url || '')
    setExperienceYears(specialist.experience_years?.toString() || '')
    setSelectedLanguages(specialist.languages || ['ka'])

    // Set selected services
    const serviceIds = specialist.specialist_services?.map(ss => ss.service_id) || []
    setSelectedServices(serviceIds)

    setEditingSpecialist(specialist)
    setShowAddForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `specialists/${facilityAccess.salon_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('salon-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('salon-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!facilityAccess?.salon_id) {
      toast.error('No facility found')
      return
    }

    if (selectedLanguages.length === 0) {
      toast.error('Select at least one language')
      return
    }

    try {
      setUploading(true)

      // Upload image if provided
      let imageUrl = imagePreview
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const specialistData = {
        salon_id: facilityAccess.salon_id,
        name,
        bio,
        image_url: imageUrl || 'https://via.placeholder.com/150?text=' + encodeURIComponent(name),
        experience_years: experienceYears ? parseInt(experienceYears) : 0,
        rating: editingSpecialist ? editingSpecialist.rating : 5.0,
        languages: selectedLanguages,
      }

      let specialistId

      if (editingSpecialist) {
        // Update existing specialist
        const { error } = await supabase
          .from('specialists')
          .update(specialistData)
          .eq('id', editingSpecialist.id)

        if (error) throw error
        specialistId = editingSpecialist.id

        // Delete existing service assignments
        await supabase
          .from('specialist_services')
          .delete()
          .eq('specialist_id', specialistId)

      } else {
        // Create new specialist
        const { data, error } = await supabase
          .from('specialists')
          .insert([specialistData])
          .select()
          .single()

        if (error) throw error
        specialistId = data.id
      }

      // Insert new service assignments
      if (selectedServices.length > 0) {
        const serviceAssignments = selectedServices.map(serviceId => ({
          specialist_id: specialistId,
          service_id: serviceId
        }))

        const { error: servicesError } = await supabase
          .from('specialist_services')
          .insert(serviceAssignments)

        if (servicesError) throw servicesError
      }

      toast.success(editingSpecialist ? 'Specialist updated successfully!' : 'Specialist created successfully!')
      resetForm()
      fetchSpecialists()
    } catch (error) {
      console.error('Error saving specialist:', error)
      toast.error('Error saving specialist: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleDelete = async (specialistId) => {
    try {
      const { error } = await supabase
        .from('specialists')
        .delete()
        .eq('id', specialistId)

      if (error) throw error
      toast.success('Specialist deleted successfully!')
      fetchSpecialists()
    } catch (error) {
      console.error('Error deleting specialist:', error)
      toast.error('Error deleting specialist: ' + error.message)
    }
  }

  // Fetch all specialists working hours for grid view (supports multiple shifts)
  const fetchAllSpecialistsWorkingHours = async () => {
    try {
      // Get the week date range
      const weekDates = getWeekDates(selectedWeekStart)
      const startDate = toLocalDateStr(weekDates[0])
      const endDate = toLocalDateStr(weekDates[6])

      const [{ data, error }, { data: facilityHours }] = await Promise.all([
        supabase
          .from('specialist_working_hours')
          .select('*')
          .in('specialist_id', specialists.map(s => s.id))
          .gte('work_date', startDate)
          .lte('work_date', endDate)
          .order('work_date')
          .order('start_time'),
        supabase
          .from('working_hours')
          .select('day_of_week, is_closed')
          .eq('salon_id', facilityAccess.salon_id)
      ])

      // Build set of closed day-of-week numbers (0=Sun, 1=Mon, etc.)
      const closedDays = new Set()
      ;(facilityHours || []).forEach(h => {
        if (h.is_closed) closedDays.add(h.day_of_week)
      })

      if (error) throw error

      // Organize data by specialist_id -> day_index (0-6) -> array of shifts
      const hoursMap = {}
      specialists.forEach(specialist => {
        hoursMap[specialist.id] = {}
        for (let i = 0; i < 7; i++) {
          hoursMap[specialist.id][i] = [{
            id: null,
            open_time: '09:00',
            close_time: '18:00',
            work_date: null
          }]
        }
      })

      // Build date-to-index lookup from the displayed week
      const dateToIndex = {}
      for (let i = 0; i < 7; i++) {
        dateToIndex[toLocalDateStr(weekDates[i])] = i
      }

      // Override with actual data from database (group by specialist + day)
      const dayOffMap = {}
      data?.forEach(record => {
        const workDate = (record.work_date || '').substring(0, 10)
        const dayIndex = dateToIndex[workDate]
        if (dayIndex === undefined) return

        if (hoursMap[record.specialist_id]) {
          // Track day-off status
          if (record.is_day_off || record.is_closed) {
            dayOffMap[`${record.specialist_id}-${dayIndex}`] = true
            hoursMap[record.specialist_id][dayIndex] = []
            return
          }

          // If this is the first record for this day, replace the default
          if (hoursMap[record.specialist_id][dayIndex].length === 1 && hoursMap[record.specialist_id][dayIndex][0].id === null) {
            hoursMap[record.specialist_id][dayIndex] = []
          }
          // Add this shift
          hoursMap[record.specialist_id][dayIndex].push({
            id: record.id,
            open_time: record.start_time?.substring(0, 5) || '09:00',
            close_time: record.end_time?.substring(0, 5) || '18:00',
            work_date: record.work_date,
            is_exception: record.is_exception || false
          })
        }
      })

      // Mark facility closed days as not working for all specialists
      if (closedDays.size > 0) {
        for (let i = 0; i < 7; i++) {
          const dayOfWeek = weekDates[i].getDay()
          if (closedDays.has(dayOfWeek)) {
            specialists.forEach(s => {
              dayOffMap[`${s.id}-${i}`] = true
              hoursMap[s.id][i] = []
            })
          }
        }
      }

      setAllSpecialistsWorkingHours(hoursMap)
      setNotWorkingDays(dayOffMap)
    } catch (error) {
      console.error('Error fetching all specialists working hours:', error)
    }
  }

  // Helper function to check if two time ranges overlap
  const doTimesOverlap = (start1, end1, start2, end2) => {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const start1Min = timeToMinutes(start1)
    const end1Min = timeToMinutes(end1)
    const start2Min = timeToMinutes(start2)
    const end2Min = timeToMinutes(end2)

    return start1Min < end2Min && end1Min > start2Min
  }

  // Add a new shift to a specialist's day
  const addShiftToDay = async (specialistId, dayIndex) => {
    try {
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const dayLabel = dayNames[dayIndex]

      // Calculate the specific date for this day in the selected week
      const weekDates = getWeekDates(selectedWeekStart)
      const specificDate = toLocalDateStr(weekDates[dayIndex])

      // Check for overlaps with existing shifts
      const existingShifts = allSpecialistsWorkingHours[specialistId]?.[dayIndex] || []
      const newStart = '09:00'
      const newEnd = '18:00'

      for (const shift of existingShifts) {
        if (shift.id && doTimesOverlap(newStart, newEnd, shift.open_time, shift.close_time)) {
          toast.error('New shift overlaps with existing shift. Please adjust times after adding.')
          // Still add the shift but warn the user
          break
        }
      }

      // Insert new shift record with specific date
      const { data, error } = await supabase
        .from('specialist_working_hours')
        .insert([{
          specialist_id: specialistId,
          work_date: specificDate,
          day_of_week: dayLabel,
          start_time: '09:00:00',
          end_time: '18:00:00',
          is_closed: false,
          is_day_off: false
        }])
        .select()
        .single()

      if (error) throw error

      // Refetch to get accurate state from DB
      await fetchAllSpecialistsWorkingHours()

      // Automatically open time picker for the new shift
      openTimePicker(specialistId, dayIndex, data.id, {
        open_time: '09:00',
        close_time: '18:00'
      })

      toast.success('Shift added! Set the time.')
    } catch (error) {
      console.error('Error adding shift:', error)
      toast.error('Error adding shift: ' + error.message)
    }
  }

  // Update a specific shift
  const updateShift = async (shiftId, specialistId, dayIndex, openTime, closeTime) => {
    try {
      // Check for overlaps with other shifts (excluding the current shift being edited)
      const existingShifts = allSpecialistsWorkingHours[specialistId]?.[dayIndex] || []

      for (const shift of existingShifts) {
        // Skip the shift being edited
        if (shift.id === shiftId) continue

        if (shift.id && doTimesOverlap(openTime, closeTime, shift.open_time, shift.close_time)) {
          toast.error(`Shift overlaps with existing shift (${shift.open_time} - ${shift.close_time})`)
          return // Don't save the overlapping shift
        }
      }

      if (!shiftId) {
        // This is a new shift that hasn't been saved yet
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const dayLabel = dayNames[dayIndex]

        // Calculate the specific date for this day in the selected week
        const weekDates = getWeekDates(selectedWeekStart)
        const specificDate = toLocalDateStr(weekDates[dayIndex])

        const { data, error } = await supabase
          .from('specialist_working_hours')
          .insert([{
            specialist_id: specialistId,
            work_date: specificDate,
            day_of_week: dayLabel,
            start_time: openTime + ':00',
            end_time: closeTime + ':00',
            is_closed: false,
            is_day_off: false
          }])
          .select()
          .single()

        if (error) throw error

        // Update local state with new id
        setAllSpecialistsWorkingHours(prev => ({
          ...prev,
          [specialistId]: {
            ...prev[specialistId],
            [dayIndex]: prev[specialistId][dayIndex].map(shift =>
              shift.id === null ? { id: data.id, open_time: openTime, close_time: closeTime, work_date: specificDate } : shift
            )
          }
        }))
      } else {
        // Update existing shift
        const { error } = await supabase
          .from('specialist_working_hours')
          .update({
            start_time: openTime + ':00',
            end_time: closeTime + ':00'
          })
          .eq('id', shiftId)

        if (error) throw error

        // Update local state
        setAllSpecialistsWorkingHours(prev => ({
          ...prev,
          [specialistId]: {
            ...prev[specialistId],
            [dayIndex]: prev[specialistId][dayIndex].map(shift =>
              shift.id === shiftId ? { ...shift, open_time: openTime, close_time: closeTime } : shift
            )
          }
        }))
      }

      toast.success('Working hours updated!')
    } catch (error) {
      console.error('Error updating shift:', error)
      toast.error('Error updating shift: ' + error.message)
    }
  }

  // Delete a shift
  const deleteShift = async (shiftId, specialistId, dayIndex) => {
    try {
      if (!shiftId) {
        // Just remove from local state if it hasn't been saved
        setAllSpecialistsWorkingHours(prev => ({
          ...prev,
          [specialistId]: {
            ...prev[specialistId],
            [dayIndex]: prev[specialistId][dayIndex].filter(shift => shift.id !== null)
          }
        }))
        return
      }

      const { error } = await supabase
        .from('specialist_working_hours')
        .delete()
        .eq('id', shiftId)

      if (error) throw error

      // Update local state
      setAllSpecialistsWorkingHours(prev => ({
        ...prev,
        [specialistId]: {
          ...prev[specialistId],
          [dayIndex]: prev[specialistId][dayIndex].filter(shift => shift.id !== shiftId)
        }
      }))

      toast.success('Shift deleted!')
    } catch (error) {
      console.error('Error deleting shift:', error)
      toast.error('Error deleting shift: ' + error.message)
    }
  }

  // Toggle not working state for a specific day
  const toggleNotWorking = async (specialistId, dayIndex) => {
    const key = `${specialistId}-${dayIndex}`
    const isCurrentlyOff = notWorkingDays[key] || false
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayLabel = dayNames[dayIndex]
    const weekDates = getWeekDates(selectedWeekStart)
    const specificDate = toLocalDateStr(weekDates[dayIndex])

    try {
      if (!isCurrentlyOff) {
        // Mark as day off: delete existing shifts for this day, then insert a day-off record
        const existingShifts = allSpecialistsWorkingHours[specialistId]?.[dayIndex] || []
        const shiftIds = existingShifts.filter(s => s.id).map(s => s.id)
        if (shiftIds.length > 0) {
          await supabase.from('specialist_working_hours').delete().in('id', shiftIds)
        }
        await supabase.from('specialist_working_hours').insert([{
          specialist_id: specialistId,
          work_date: specificDate,
          day_of_week: dayLabel,
          start_time: '00:00:00',
          end_time: '00:00:00',
          is_closed: false,
          is_day_off: true
        }])
        toast.success('Marked as day off')
      } else {
        // Remove day off: delete the day-off record
        await supabase
          .from('specialist_working_hours')
          .delete()
          .eq('specialist_id', specialistId)
          .eq('work_date', specificDate)
          .eq('is_day_off', true)
        toast.success('Day off removed')
      }

      // Refetch to sync state
      await fetchAllSpecialistsWorkingHours()
    } catch (error) {
      console.error('Error toggling day off:', error)
      toast.error('Error updating day off status')
    }
  }

  // Check if a specialist is marked as not working on a specific day
  const isNotWorking = (specialistId, dayIndex) => {
    const key = `${specialistId}-${dayIndex}`
    return notWorkingDays[key] || false
  }

  // Time picker modal handlers for grid
  const openTimePicker = (specialistId, day, shiftId, shift) => {
    setTimePickerModal({
      isOpen: true,
      specialistId,
      shiftId,
      day,
      openTime: shift?.open_time || '09:00',
      closeTime: shift?.close_time || '18:00'
    })
  }

  const closeTimePicker = () => {
    setTimePickerModal({
      isOpen: false,
      specialistId: null,
      shiftId: null,
      day: null,
      openTime: '09:00',
      closeTime: '18:00'
    })
  }

  // Pending time change — stored until user picks "this day" or "all days"
  const [pendingTimeChange, setPendingTimeChange] = useState(null)

  const handleTimePickerConfirm = ({ openTime, closeTime }) => {
    const [openHour, openMin] = openTime.split(':').map(Number)
    const [closeHour, closeMin] = closeTime.split(':').map(Number)
    if (openHour * 60 + openMin >= closeHour * 60 + closeMin) {
      toast.error('Opening time must be before closing time')
      return
    }

    // Store the pending change and show save options
    setPendingTimeChange({ openTime, closeTime })
  }

  const saveThisDayOnly = async () => {
    if (!pendingTimeChange || !timePickerModal.specialistId) return
    await updateShift(timePickerModal.shiftId, timePickerModal.specialistId, timePickerModal.day, pendingTimeChange.openTime, pendingTimeChange.closeTime)
    // Mark as exception
    if (timePickerModal.shiftId) {
      await supabase.from('specialist_working_hours').update({ is_exception: true }).eq('id', timePickerModal.shiftId)
    }
    setPendingTimeChange(null)
    closeTimePicker()
    fetchAllSpecialistsWorkingHours()
  }

  const saveAllSameDays = async () => {
    if (!pendingTimeChange || !timePickerModal.specialistId) return
    const { openTime, closeTime } = pendingTimeChange
    const specialistId = timePickerModal.specialistId
    const dayIndex = timePickerModal.day
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayLabel = dayNames[dayIndex]

    try {
      // Update all future records for this day-of-week
      const today = toLocalDateStr(new Date())
      const { data: existingRecords } = await supabase
        .from('specialist_working_hours')
        .select('id, work_date')
        .eq('specialist_id', specialistId)
        .eq('day_of_week', dayLabel)
        .eq('is_day_off', false)
        .gte('work_date', today)

      if (existingRecords && existingRecords.length > 0) {
        const ids = existingRecords.map(r => r.id)
        await supabase
          .from('specialist_working_hours')
          .update({ start_time: openTime + ':00', end_time: closeTime + ':00', is_exception: false })
          .in('id', ids)
      }

      // Also save the current day's shift
      await updateShift(timePickerModal.shiftId, specialistId, dayIndex, openTime, closeTime)

      toast.success(`Updated all future ${dayLabel}s`)
      setPendingTimeChange(null)
      closeTimePicker()
      fetchAllSpecialistsWorkingHours()
    } catch (error) {
      console.error('Error updating all days:', error)
      toast.error('Error updating shifts')
    }
  }

  const cancelTimeChange = () => {
    setPendingTimeChange(null)
  }

  // Save all currently displayed working hours to database for next 2 months
  const saveAllWorkingHoursToDatabase = async () => {
    try {
      toast.info('Saving working hours for next 2 months...')

      let totalSaved = 0

      // Calculate date range: today to 2 months from now
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 2)

      // Fetch closed periods to preserve them
      const { data: closedPeriods } = await supabase
        .from('closed_periods')
        .select('start_date, end_date')
        .eq('salon_id', facilityAccess.salon_id)

      const isDateInClosedPeriod = (dateStr) => {
        return (closedPeriods || []).some(p => dateStr >= p.start_date && dateStr <= p.end_date)
      }

      for (const specialistId of Object.keys(allSpecialistsWorkingHours)) {
        const specialistHours = allSpecialistsWorkingHours[specialistId]

        // Delete existing future hours EXCEPT day-off records from closed periods
        await supabase
          .from('specialist_working_hours')
          .delete()
          .eq('specialist_id', specialistId)
          .eq('is_day_off', false)
          .gte('work_date', toLocalDateStr(startDate))

        const hoursToInsert = []
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateString = toLocalDateStr(currentDate)
          const dayOfWeek = currentDate.getDay()
          const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          const dayName = dayNames[dayIndex]

          // Skip dates in closed periods — they already have day-off records
          if (!isDateInClosedPeriod(dateString)) {
            // Check if this day is marked as not working in current view
            const isOff = notWorkingDays[`${specialistId}-${dayIndex}`]

            if (isOff) {
              hoursToInsert.push({
                specialist_id: specialistId,
                work_date: dateString,
                day_of_week: dayName,
                start_time: '00:00:00',
                end_time: '00:00:00',
                is_closed: false,
                is_day_off: true
              })
            } else {
              const shifts = specialistHours[dayIndex] || []
              shifts.forEach(shift => {
                if (shift.open_time && shift.close_time) {
                  hoursToInsert.push({
                    specialist_id: specialistId,
                    work_date: dateString,
                    day_of_week: dayName,
                    start_time: shift.open_time + ':00',
                    end_time: shift.close_time + ':00',
                    is_closed: false,
                    is_day_off: false
                  })
                }
              })
            }
          }

          currentDate.setDate(currentDate.getDate() + 1)
        }

        if (hoursToInsert.length > 0) {
          // Insert in batches
          const batchSize = 100
          for (let i = 0; i < hoursToInsert.length; i += batchSize) {
            const { error } = await supabase
              .from('specialist_working_hours')
              .insert(hoursToInsert.slice(i, i + batchSize))
            if (error) throw error
          }
          totalSaved += hoursToInsert.length
        }
      }

      toast.success(`Successfully saved ${totalSaved} working hour entries for the next 2 months!`)

      // Refresh the data
      fetchAllSpecialistsWorkingHours()
    } catch (error) {
      console.error('Error saving all working hours:', error)
      toast.error('Error saving working hours: ' + error.message)
    }
  }

  // Copy facility working hours to specialist
  const copyFacilityHoursToSpecialist = async (specialistId) => {
    try {
      toast.info('Copying facility hours...')

      // Delete existing hours for this specialist
      await supabase
        .from('specialist_working_hours')
        .delete()
        .eq('specialist_id', specialistId)

      // Map facility hours to specialist hours
      const hoursToInsert = workingHours.map(facilityHour => {
        const dayLabel = DAYS_OF_WEEK.find(d => d.value === facilityHour.day_of_week)?.label.toLowerCase()
        return {
          specialist_id: specialistId,
          day_of_week: dayLabel,
          start_time: facilityHour.open_time,
          end_time: facilityHour.close_time,
          is_closed: facilityHour.is_closed || false,
          is_day_off: facilityHour.is_closed || false
        }
      })

      if (hoursToInsert.length > 0) {
        const { error } = await supabase
          .from('specialist_working_hours')
          .insert(hoursToInsert)

        if (error) throw error
      }

      // Update local state
      const updatedHours = {}
      workingHours.forEach(facilityHour => {
        updatedHours[facilityHour.day_of_week] = {
          open_time: facilityHour.open_time?.substring(0, 5) || '09:00',
          close_time: facilityHour.close_time?.substring(0, 5) || '18:00'
        }
      })

      setAllSpecialistsWorkingHours(prev => ({
        ...prev,
        [specialistId]: updatedHours
      }))

      toast.success('Facility hours copied successfully!')
    } catch (error) {
      console.error('Error copying facility hours:', error)
      toast.error('Error copying facility hours: ' + error.message)
    }
  }

  // Week navigation helpers
  const getWeekDates = (weekStart) => {
    const dates = []
    const [y, m, d] = weekStart.split('-').map(Number)
    for (let i = 0; i < 7; i++) {
      const date = new Date(y, m - 1, d + i)
      dates.push(date)
    }
    return dates
  }

  const toLocalDateStr = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const changeWeek = (direction) => {
    const [y, m, d] = selectedWeekStart.split('-').map(Number)
    const current = new Date(y, m - 1, d + direction * 7)
    setSelectedWeekStart(toLocalDateStr(current))
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    setSelectedWeekStart(toLocalDateStr(monday))
  }

  const formatWeekRange = (weekStart) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    const formatDate = (date) => {
      const day = date.getDate()
      const month = date.toLocaleString('default', { month: 'short' })
      return `${day} ${month}`
    }

    return `${formatDate(start)} - ${formatDate(end)}`
  }

  // Fetch commission rates for all specialists
  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_services')
        .select('specialist_id, service_id, commission_rate, services(name, price)')
        .in('specialist_id', specialists.map(s => s.id))

      if (error) throw error

      const map = {}
      ;(data || []).forEach(row => {
        if (!map[row.specialist_id]) map[row.specialist_id] = {}
        map[row.specialist_id][row.service_id] = {
          rate: row.commission_rate ?? 50,
          serviceName: row.services?.name || 'Unknown',
          servicePrice: row.services?.price || 0
        }
      })
      setCommissions(map)
    } catch (error) {
      console.error('Error fetching commissions:', error)
    }
  }

  // Update commission rate
  const updateCommission = async (specialistId, serviceId, newRate) => {
    try {
      const { error } = await supabase
        .from('specialist_services')
        .update({ commission_rate: newRate })
        .eq('specialist_id', specialistId)
        .eq('service_id', serviceId)

      if (error) throw error

      setCommissions(prev => ({
        ...prev,
        [specialistId]: {
          ...prev[specialistId],
          [serviceId]: { ...prev[specialistId][serviceId], rate: newRate }
        }
      }))
    } catch (error) {
      console.error('Error updating commission:', error)
      toast.error('Error updating commission rate')
    }
  }

  // Fetch salary earnings data based on selected period
  const fetchSalaryData = async () => {
    try {
      setSalaryLoading(true)
      const now = new Date()
      const today = toLocalDateStr(now)

      let startDate
      if (salaryPeriod === 'day') {
        startDate = today
      } else if (salaryPeriod === 'week') {
        const dayOfWeek = now.getDay() || 7
        const ws = new Date(now)
        ws.setDate(now.getDate() - dayOfWeek + 1)
        startDate = toLocalDateStr(ws)
      } else {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      }

      const [{ data: bookings, error }, { data: commData }, { data: payments }] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, specialist_id, service_id, booking_date, final_price, status, services(price)')
          .eq('salon_id', facilityAccess.salon_id)
          .eq('status', 'completed')
          .gte('booking_date', startDate),
        supabase
          .from('specialist_services')
          .select('specialist_id, service_id, commission_rate')
          .in('specialist_id', specialists.map(s => s.id)),
        supabase
          .from('payments')
          .select('booking_id, specialist_id, amount_paid, tip_amount, created_at')
          .eq('salon_id', facilityAccess.salon_id)
          .in('specialist_id', specialists.map(s => s.id))
          .gte('created_at', startDate)
      ])

      if (error) throw error

      const rateMap = {}
      ;(commData || []).forEach(r => {
        rateMap[`${r.specialist_id}_${r.service_id}`] = r.commission_rate ?? 50
      })

      const salaryPaymentsMap = {}
      ;(payments || []).forEach(p => {
        if (p.booking_id) salaryPaymentsMap[p.booking_id] = p.amount_paid
      })

      const earnings = {}
      ;(bookings || []).forEach(b => {
        if (!b.specialist_id) return
        if (!earnings[b.specialist_id]) earnings[b.specialist_id] = { salary: 0, tips: 0 }
        const paid = salaryPaymentsMap[b.id]
        const price = paid != null ? paid : (b.final_price || b.services?.price || 0)
        const rate = rateMap[`${b.specialist_id}_${b.service_id}`] ?? 50
        earnings[b.specialist_id].salary += price * (rate / 100)
      })

      ;(payments || []).forEach(p => {
        if (!p.specialist_id || !p.tip_amount) return
        if (!earnings[p.specialist_id]) earnings[p.specialist_id] = { salary: 0, tips: 0 }
        earnings[p.specialist_id].tips += p.tip_amount
      })

      setSalaryData(earnings)
    } catch (error) {
      console.error('Error fetching salary data:', error)
    } finally {
      setSalaryLoading(false)
    }
  }

  const weekDates = getWeekDates(selectedWeekStart)

  // Calculate stats
  const totalSpecialists = specialists.length
  const ratedSpecialists = specialists.filter(s => s.rating !== null)
  const avgRating = ratedSpecialists.length > 0
    ? (ratedSpecialists.reduce((sum, s) => sum + s.rating, 0) / ratedSpecialists.length).toFixed(1)
    : '—'

  // Calculate average utilisation for all specialists
  const avgUtilisation = specialists.length > 0
    ? specialists.reduce((sum, s) => {
        return sum + parseFloat(utilisationData[s.id]?.rate || 0)
      }, 0) / specialists.length
    : 0

  // Count unique services that have at least one specialist assigned
  const uniqueServiceIds = new Set()
  specialists.forEach(s => {
    s.specialist_services?.forEach(ss => {
      uniqueServiceIds.add(ss.service_id)
    })
  })
  const totalServicesAssigned = uniqueServiceIds.size

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  const tabs = [
    { id: 'specialists', label: 'Specialists', Icon: Users },
    { id: 'hours', label: 'Working Hours', Icon: Clock },
    { id: 'vacations', label: 'Vacations', Icon: Plane },
    { id: 'salaries', label: 'Salaries', Icon: DollarSign },
  ]

  return (
    <div className="w-full -mt-4">
      {/* Tabs */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map((tab, index) => {
            const Icon = tab.Icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-900/15 text-gray-800'
                    : 'text-gray-200 hover:text-gray-800 hover:bg-purple-900/5'
                } ${
                  index === 0 ? 'rounded-tl-lg' : ''
                } ${
                  index === tabs.length - 1 ? 'rounded-tr-lg' : ''
                } ${
                  index < tabs.length - 1 ? 'border-r border-purple-500/[0.06]' : ''
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Specialists Tab */}
      {activeTab === 'specialists' && (
        <div>
        {/* Stats Cards */}
        {specialists.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <AnimatedCard className="p-6 h-32 flex flex-col justify-between">
              <div className="text-sm text-purple-200 mb-1">Total Specialists</div>
              <div className="text-3xl font-bold text-gray-800">{totalSpecialists}</div>
            </AnimatedCard>
            <AnimatedCard className="p-6 h-32 flex flex-col justify-between">
              <div className="text-sm text-purple-200 mb-1">Average Rating</div>
              <div className="text-3xl font-bold text-gray-800">{avgRating} ⭐</div>
            </AnimatedCard>
            <AnimatedCard className="p-6 h-32 flex flex-col justify-between">
              <div className="text-sm text-purple-200 mb-1">Utilisation Rate</div>
              <div className="text-3xl font-bold text-gray-800">{avgUtilisation.toFixed(1)}%</div>
            </AnimatedCard>
            <AnimatedCard className="p-6 h-32 flex flex-col justify-between">
              <div className="text-sm text-purple-200 mb-1">Services Covered</div>
              <div className="text-3xl font-bold text-gray-800">{totalServicesAssigned}</div>
            </AnimatedCard>
          </div>
        )}

        {/* View Toggle and Add Button */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-purple-900/15 border border-purple-500/10 text-gray-800 rounded-lg hover:bg-purple-900/20 font-medium transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Specialist</span>
            </button>
            {specialists.length > 0 && (
              <>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all border ${
                    viewMode === 'grid'
                      ? 'bg-purple-900/15 border-purple-500/20 text-gray-800'
                      : 'border-purple-500/[0.06] bg-black/15 text-gray-200 hover:border-purple-500/40'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all border ${
                    viewMode === 'list'
                      ? 'bg-purple-900/15 border-purple-500/20 text-gray-800'
                      : 'border-purple-500/[0.06] bg-black/15 text-gray-200 hover:border-purple-500/40'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Working Hours Tab - Weekly Grid */}
      {activeTab === 'hours' && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center font-[Inter]">
              <Clock className="w-6 h-6 mr-2 text-purple-300" />
              Weekly Schedule
            </h3>

            {/* Week Navigation */}
            <div className="flex items-center space-x-3">
              <button
                onClick={saveAllWorkingHoursToDatabase}
                className="px-4 py-2 text-sm font-medium text-gray-800 bg-green-900/15 border border-green-700 hover:bg-green-900/20 rounded-full transition-all flex items-center gap-2"
                title="Save all displayed hours to database"
              >
                <Save className="w-4 h-4" />
                Save All Hours
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 text-sm font-medium text-gray-800 bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-full transition-all"
              >
                This Week
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => changeWeek(-1)}
                  className="p-2 text-gray-800 bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-l-full transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-6 py-2 bg-purple-950/12 border-t border-b border-purple-500/10 text-gray-800 text-sm font-semibold min-w-[180px] text-center">
                  {formatWeekRange(selectedWeekStart)}
                </div>
                <button
                  onClick={() => changeWeek(1)}
                  className="p-2 text-gray-800 bg-purple-900/15 border border-purple-500/10 hover:bg-purple-900/20 rounded-r-full transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {specialists.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No specialists available. Add specialists first.</p>
            </div>
          ) : (
            <div className="min-w-full">
              {/* Table Header */}
              <div className="grid gap-2 mb-4 sticky top-0 bg-purple-900/25 p-2 rounded-lg" style={{gridTemplateColumns: '200px repeat(7, 1fr)'}}>
                <div className="text-sm font-bold text-purple-200">Specialist</div>
                {weekDates.map((date, index) => {
                  const dayName = DAYS_OF_WEEK[index].short
                  const dayNum = date.getDate()
                  const month = (date.getMonth() + 1).toString().padStart(2, '0')
                  return (
                    <div key={index} className="text-sm font-bold text-purple-200 text-center">
                      <div>{dayName}</div>
                      <div className="text-xs text-purple-300">{dayNum}/{month}</div>
                    </div>
                  )
                })}
              </div>

              {/* Table Body */}
              <div className="space-y-2">
                {specialists.map((specialist) => (
                  <div key={specialist.id} className="grid gap-2 items-center p-2 bg-black/15 border border-purple-500/10 rounded-lg hover:bg-purple-900/10 transition-all" style={{gridTemplateColumns: '200px repeat(7, 1fr)'}}>
                    {/* Specialist Name & Photo */}
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={specialist.image_url}
                          alt={specialist.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-purple-500"
                        />
                        <span className="text-sm font-semibold text-gray-800 truncate">{specialist.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyFacilityHoursToSpecialist(specialist.id)}
                        className="p-1.5 bg-purple-900/15 border border-purple-500/10 text-purple-300 rounded-lg hover:bg-purple-900/25 hover:border-purple-500/40 transition-all flex-shrink-0"
                        title="Copy facility hours"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Days of Week */}
                    {DAYS_OF_WEEK.map((day, dayIndex) => {
                      const shifts = allSpecialistsWorkingHours[specialist.id]?.[dayIndex] || [{id: null, open_time: '09:00', close_time: '18:00'}]
                      const notWorking = isNotWorking(specialist.id, dayIndex)

                      return (
                        <div
                          key={day.value}
                          className={`group p-1.5 rounded-lg space-y-1 min-h-[50px] flex flex-col ${
                            notWorking
                              ? 'bg-black/20 border border-purple-500/[0.06]'
                              : 'bg-purple-950/12 border border-purple-500/10'
                          }`}
                        >
                          {notWorking ? (
                            <div className="flex flex-col items-center justify-center flex-1">
                              <button
                                type="button"
                                onClick={() => toggleNotWorking(specialist.id, dayIndex)}
                                className="w-full px-2 py-2 bg-white/5 border border-purple-500/[0.06] text-gray-400 rounded hover:bg-white/10 hover:border-gray-500 transition-all text-[10px] flex items-center justify-center gap-1"
                                title="Mark as working"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Not Working</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Time Slots */}
                              <div className="flex-1 space-y-1">
                                {shifts.map((shift, shiftIndex) => (
                                  <div key={shift.id || shiftIndex} className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openTimePicker(specialist.id, dayIndex, shift.id, shift)}
                                      className={`flex-1 px-2 py-1.5 border text-gray-800 rounded hover:bg-purple-900/25 hover:border-purple-500/40 transition-all text-xs text-center ${
                                        shift.is_exception
                                          ? 'bg-amber-900/15 border-amber-500/30'
                                          : 'bg-purple-900/15 border-purple-500/[0.06]'
                                      }`}
                                    >
                                      <div className="font-medium whitespace-nowrap flex items-center justify-center gap-1">
                                        {shift.is_exception && <span className="text-amber-400 text-[8px]" title="Exception — different from usual">★</span>}
                                        {shift.open_time} - {shift.close_time}
                                      </div>
                                    </button>
                                    {shifts.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => deleteShift(shift.id, specialist.id, dayIndex)}
                                        className="p-1 bg-red-900/15 border border-red-700/50 text-red-300 rounded hover:bg-red-900/25 hover:border-red-600 transition-all"
                                        title="Delete shift"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => addShiftToDay(specialist.id, dayIndex)}
                                  className="flex-1 px-1.5 py-0.5 bg-green-900/15 border border-green-700/50 text-green-300 rounded hover:bg-green-900/25 hover:border-green-600 transition-all text-[10px] flex items-center justify-center gap-0.5"
                                  title="Add shift"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>Shift</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleNotWorking(specialist.id, dayIndex)}
                                  className="flex-1 px-1.5 py-0.5 bg-black/15 border border-purple-500/[0.06] text-gray-400 rounded hover:bg-black/25 hover:border-purple-500/10 transition-all text-[10px] flex items-center justify-center gap-0.5"
                                  title="Mark as not working"
                                >
                                  <Ban className="w-2.5 h-2.5" />
                                  <span>Off</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vacations Tab */}
      {activeTab === 'vacations' && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center font-[Inter]">
            <Plane className="w-6 h-6 mr-2 text-purple-300" />
            Specialist Vacations
          </h3>
          <p className="text-gray-300 mb-6">
            Manage vacation schedules and time off for your specialists.
          </p>

          {/* Placeholder for vacations management */}
          <div className="text-center py-12 text-gray-400">
            <Plane className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Vacation management coming soon...</p>
          </div>
        </div>
      )}

      {/* Salaries Tab */}
      {activeTab === 'salaries' && (() => {
        const filteredSpecs = specialists.filter(s => !salarySearch || s.name.toLowerCase().includes(salarySearch.toLowerCase()))
        const totalSalary = filteredSpecs.reduce((sum, s) => sum + (salaryData[s.id]?.salary || 0), 0)
        const totalTips = filteredSpecs.reduce((sum, s) => sum + (salaryData[s.id]?.tips || 0), 0)
        const periodLabel = salaryPeriod === 'day' ? 'Today' : salaryPeriod === 'week' ? 'This Week' : 'This Month'

        return (
          <div className="space-y-4">
            {/* Top bar: period + search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {['day', 'week', 'month'].map(p => (
                  <button
                    key={p}
                    onClick={() => setSalaryPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      salaryPeriod === p
                        ? 'bg-purple-600/30 border-purple-500/50 text-gray-800'
                        : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-purple-500/30'
                    }`}
                  >
                    {p === 'day' ? 'Day' : p === 'week' ? 'Week' : 'Month'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search specialist..."
                value={salarySearch}
                onChange={e => setSalarySearch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-purple-950/40 border border-purple-500/10 text-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-gray-500 w-48"
              />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-950/30 border border-purple-500/10 rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Salaries · {periodLabel}</p>
                <p className="text-2xl font-bold text-purple-400">{totalSalary.toFixed(0)} <span className="text-xs text-gray-500">GEL</span></p>
              </div>
              <div className="bg-green-950/20 border border-green-500/10 rounded-xl p-4 text-center">
                <p className="text-[10px] text-green-400/60 uppercase tracking-wide mb-1">Tips · {periodLabel}</p>
                <p className="text-2xl font-bold text-green-400">{totalTips.toFixed(0)} <span className="text-xs text-green-400/40">GEL</span></p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Total · {periodLabel}</p>
                <p className="text-2xl font-bold text-gray-800">{(totalSalary + totalTips).toFixed(0)} <span className="text-xs text-gray-500">GEL</span></p>
              </div>
            </div>

            {/* Specialist cards */}
            {filteredSpecs.map(specialist => {
              const specCommissions = commissions[specialist.id] || {}
              const specEarnings = salaryData[specialist.id] || { salary: 0, tips: 0 }
              const serviceEntries = Object.entries(specCommissions)

              return (
                <div key={specialist.id} className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl px-4 py-3">
                  <div className="flex items-center gap-4">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-2.5 w-[140px] flex-shrink-0">
                      {specialist.image_url ? (
                        <img src={specialist.image_url} alt={specialist.name} className="w-8 h-8 rounded-full object-cover border border-purple-500/30 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-300">{specialist.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-gray-800 font-[Inter] truncate">{specialist.name}</h3>
                        <p className="text-[9px] text-gray-500">{serviceEntries.length} service{serviceEntries.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Commissions - compact inline */}
                    <div className="flex-1 flex items-center gap-1.5 overflow-x-auto min-w-0">
                      {serviceEntries.map(([serviceId, data]) => (
                        <div key={serviceId} className="flex items-center gap-1 bg-purple-950/20 border border-purple-500/[0.06] rounded-md px-2 py-1 flex-shrink-0">
                          <span className="text-[9px] text-gray-400 truncate max-w-[60px]">{data.serviceName}</span>
                          <input
                            type="number" min="0" max="100" value={data.rate}
                            onChange={(e) => {
                              const newRate = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                              setCommissions(prev => ({ ...prev, [specialist.id]: { ...prev[specialist.id], [serviceId]: { ...data, rate: newRate } } }))
                            }}
                            onBlur={() => updateCommission(specialist.id, serviceId, data.rate)}
                            className="w-9 px-1 py-0.5 text-[9px] text-center font-bold text-purple-400 bg-purple-950/40 border border-purple-500/20 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[8px] text-gray-500">%</span>
                        </div>
                      ))}
                    </div>

                    {/* Earnings + Tips + Total */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center w-[70px]">
                        <p className="text-[8px] text-gray-400 uppercase">Earnings</p>
                        <p className="text-sm font-bold text-purple-400">{specEarnings.salary.toFixed(0)} <span className="text-[8px] text-gray-500">GEL</span></p>
                      </div>
                      <div className="text-center w-[60px]">
                        <p className="text-[8px] text-green-400/60 uppercase">Tips</p>
                        <p className="text-sm font-bold text-green-400">{specEarnings.tips.toFixed(0)} <span className="text-[8px] text-green-400/40">GEL</span></p>
                      </div>
                      <div className="text-center w-[70px] bg-white/[0.03] rounded-lg py-1">
                        <p className="text-[8px] text-gray-400 uppercase">Total</p>
                        <p className="text-sm font-bold text-gray-800">{(specEarnings.salary + specEarnings.tips).toFixed(0)} <span className="text-[8px] text-gray-500">GEL</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-6 mb-6 border border-purple-500/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2 font-[Inter]">
              {editingSpecialist ? <Edit className="w-5 h-5 text-purple-300" /> : <Plus className="w-5 h-5 text-purple-300" />}
              <span>{editingSpecialist ? 'Edit Specialist' : 'Add New Specialist'}</span>
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-300 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all placeholder-gray-400"
                  placeholder="e.g., Nino Kapanadze"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all placeholder-gray-400"
                  placeholder="Tell customers about this specialist..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Experience (years)
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all placeholder-gray-400"
                  placeholder="5"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Languages *
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: 'ka', label: '🇬🇪 Georgian' },
                    { val: 'en', label: '🇬🇧 English' },
                    { val: 'ru', label: '🇷🇺 Russian' },
                    { val: 'tr', label: '🇹🇷 Turkish' },
                    { val: 'de', label: '🇩🇪 German' },
                    { val: 'fr', label: '🇫🇷 French' },
                    { val: 'es', label: '🇪🇸 Spanish' },
                    { val: 'ar', label: '🇸🇦 Arabic' },
                  ].map(l => (
                    <button
                      key={l.val}
                      type="button"
                      onClick={() => {
                        setSelectedLanguages(prev =>
                          prev.includes(l.val)
                            ? prev.filter(x => x !== l.val)
                            : [...prev, l.val]
                        )
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        selectedLanguages.includes(l.val)
                          ? 'bg-purple-600/30 border-purple-500/50 text-gray-800'
                          : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-purple-500/30'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center space-x-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-700 file:text-gray-800 hover:file:bg-purple-600"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Upload a photo (max 5MB). Leave empty for default avatar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Selection */}
            {services.length > 0 && (
              <div className="border-t border-purple-500/10 pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Assign Services
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-purple-950/10 rounded-lg border border-purple-500/[0.06]">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center space-x-2 p-2 hover:bg-purple-900/15 rounded cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="w-4 h-4 text-purple-600 border-purple-500 rounded focus:ring-purple-500 bg-purple-950/50"
                      />
                      <span className="text-sm text-gray-200">{service.name}</span>
                    </label>
                  ))}
                </div>
                {selectedServices.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Select at least one service this specialist can perform
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-purple-500/10 text-gray-200 rounded-lg hover:bg-purple-900/15 transition-all"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-purple-900/15 border border-purple-500/10 text-gray-800 rounded-lg hover:bg-purple-900/20 disabled:opacity-50 font-medium transition-all transform hover:scale-105"
                disabled={uploading}
              >
                {uploading ? 'Saving...' : (editingSpecialist ? 'Update Specialist' : 'Add Specialist')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Specialists List */}
      {activeTab === 'specialists' && specialists.length === 0 ? (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-12 text-center border border-purple-500/10">
          <div className="flex justify-center mb-4">
            <Users className="w-16 h-16 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 font-[Inter]">No Specialists Yet</h3>
          <p className="text-gray-300 mb-6">
            Start by adding your first team member to appear in the mobile app
          </p>
          <button
            onClick={handleAdd}
            className="px-8 py-3 bg-purple-900/15 border border-purple-500/10 text-gray-800 rounded-lg hover:bg-purple-900/20 font-medium transition-all transform hover:scale-105"
          >
            Add Your First Specialist
          </button>
        </div>
      ) : activeTab === 'specialists' && viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {specialists.map((specialist) => {
            return (
            <div
              key={specialist.id}
              className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl transition-all p-4"
            >

              {/* Profile Image */}
              <div className="flex justify-center mb-3">
                <img
                  src={specialist.image_url}
                  alt={specialist.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=' + encodeURIComponent(specialist.name)
                  }}
                />
              </div>

              {/* Name and Rating */}
              <div className="text-center mb-3">
                <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-1 font-[Inter]">
                  {specialist.name}
                </h3>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <Star className={`w-4 h-4 ${specialist.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                  <span className="text-sm font-bold text-gray-800">{specialist.rating ?? '—'}</span>
                  <span className="text-xs text-gray-400">({specialist.reviewCount})</span>
                </div>
              </div>

              {/* Bio */}
              {specialist.bio && (
                <p className="text-xs text-gray-300 mb-3 line-clamp-2 h-8 text-center">
                  {specialist.bio}
                </p>
              )}
              {!specialist.bio && (
                <div className="mb-3 h-8"></div>
              )}


              {/* Assigned Services */}
              {specialist.specialist_services && specialist.specialist_services.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-purple-200 mb-2">Services:</div>
                  <div className="flex flex-wrap gap-1">
                    {specialist.specialist_services.map((ss) => (
                      <span
                        key={ss.service_id}
                        className="inline-block px-2 py-1 text-xs bg-purple-950/25 text-purple-200 rounded-full font-medium border border-purple-500/10"
                      >
                        {ss.services?.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(specialist)}
                  className="flex-1 px-3 py-1.5 text-xs border border-purple-600 text-purple-200 rounded-lg hover:bg-purple-800/25 transition-all font-medium flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <NativeDelete
                  onDelete={() => handleDelete(specialist.id)}
                />
              </div>
            </div>
            )
          })}
        </div>
      ) : activeTab === 'specialists' ? (
        /* List/Table View */
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-10 gap-4 px-6 py-4 bg-purple-950/25 border-b border-purple-500/10">
            <div className="col-span-3 text-sm font-bold text-purple-200">Specialist</div>
            <div className="col-span-3 text-sm font-bold text-purple-200">Bio</div>
            <div className="col-span-1 text-sm font-bold text-purple-200 text-center">Rating</div>
            <div className="col-span-2 text-sm font-bold text-purple-200">Services</div>
            <div className="col-span-1 text-sm font-bold text-purple-200 text-center">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-purple-700/30">
            {specialists.map((specialist) => {
              return (
              <div key={specialist.id} className="grid grid-cols-10 gap-4 px-6 py-4 hover:bg-purple-900/15 transition-all">
                <div className="col-span-3 flex items-center space-x-3">
                  <img
                    src={specialist.image_url}
                    alt={specialist.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=' + encodeURIComponent(specialist.name)
                    }}
                  />
                  <span className="text-gray-800 font-medium font-[Inter]">
                    {specialist.name}
                  </span>
                </div>
                <div className="col-span-3 text-gray-300 text-sm flex items-center">
                  <span className="line-clamp-2">{specialist.bio || '-'}</span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center space-x-1">
                    <Star className={`w-4 h-4 ${specialist.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                    <span className="text-gray-800 font-bold">{specialist.rating ?? '—'}</span>
                    <span className="text-xs text-gray-400">({specialist.reviewCount})</span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <div className="flex flex-wrap gap-1">
                    {specialist.specialist_services && specialist.specialist_services.length > 0 ? (
                      specialist.specialist_services.slice(0, 2).map((ss) => (
                        <span
                          key={ss.service_id}
                          className="inline-block px-2 py-1 text-xs bg-purple-950/25 text-purple-200 rounded-full font-medium border border-purple-500/10"
                        >
                          {ss.services?.name || 'Unknown'}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                    {specialist.specialist_services && specialist.specialist_services.length > 2 && (
                      <span className="text-xs text-purple-300">+{specialist.specialist_services.length - 2}</span>
                    )}
                  </div>
                </div>
                <div className="col-span-1 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleEdit(specialist)}
                    className="px-3 py-1.5 text-xs border border-purple-600 text-purple-200 rounded-lg hover:bg-purple-800/25 transition-all font-medium flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <NativeDelete
                    onDelete={() => handleDelete(specialist.id)}
                  />
                </div>
              </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Time Picker Modal */}
      <TimePickerModal
        isOpen={timePickerModal.isOpen && !pendingTimeChange}
        onClose={closeTimePicker}
        openTime={timePickerModal.openTime}
        closeTime={timePickerModal.closeTime}
        onConfirm={handleTimePickerConfirm}
        title="Working Hours"
      />

      {/* Save options after time picker confirm */}
      {pendingTimeChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-xs p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Save Working Hours</h3>
            <p className="text-[11px] text-gray-400 mb-4">
              {pendingTimeChange.openTime} — {pendingTimeChange.closeTime}
            </p>
            <div className="space-y-2">
              <button
                onClick={saveThisDayOnly}
                className="w-full py-2.5 text-xs font-medium text-gray-800 bg-purple-600 rounded-lg hover:bg-purple-500 transition-all"
              >
                Save for this {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][timePickerModal.day]} only
              </button>
              <button
                onClick={saveAllSameDays}
                className="w-full py-2.5 text-xs font-medium text-gray-800 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-all"
              >
                Save for all future {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][timePickerModal.day]}s
              </button>
              <button
                onClick={cancelTimeChange}
                className="w-full py-2 text-xs text-gray-400 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
