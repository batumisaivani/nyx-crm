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
    return monday.toISOString().split('T')[0]
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

  // Fetch all specialists working hours when specialists are loaded
  useEffect(() => {
    if (specialists.length > 0) {
      fetchAllSpecialistsWorkingHours()
    }
  }, [specialists])

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
      setSpecialists(data || [])
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
      const startDate = weekDates[0].toISOString().split('T')[0]
      const endDate = weekDates[6].toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('specialist_working_hours')
        .select('*')
        .in('specialist_id', specialists.map(s => s.id))
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date')
        .order('start_time')

      if (error) throw error

      // Organize data by specialist_id -> day_index (0-6) -> array of shifts
      const hoursMap = {}
      specialists.forEach(specialist => {
        hoursMap[specialist.id] = {}
        // Initialize with default single shift for all days (0-6 for Mon-Sun)
        for (let i = 0; i < 7; i++) {
          hoursMap[specialist.id][i] = [{
            id: null,
            open_time: '09:00',
            close_time: '18:00',
            work_date: null
          }]
        }
      })

      // Override with actual data from database (group by specialist + day)
      data?.forEach(record => {
        const recordDate = new Date(record.work_date)
        const dayOfWeek = recordDate.getDay()
        // Convert to array index: Sunday(0) -> 6, Monday(1) -> 0, etc.
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

        if (dayIndex !== undefined && hoursMap[record.specialist_id]) {
          // If this is the first record for this day, replace the default
          if (hoursMap[record.specialist_id][dayIndex].length === 1 && hoursMap[record.specialist_id][dayIndex][0].id === null) {
            hoursMap[record.specialist_id][dayIndex] = []
          }
          // Add this shift
          hoursMap[record.specialist_id][dayIndex].push({
            id: record.id,
            open_time: record.start_time?.substring(0, 5) || '09:00',
            close_time: record.end_time?.substring(0, 5) || '18:00',
            work_date: record.work_date
          })
        }
      })

      setAllSpecialistsWorkingHours(hoursMap)
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
      const specificDate = weekDates[dayIndex].toISOString().split('T')[0]

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

      // Update local state
      setAllSpecialistsWorkingHours(prev => ({
        ...prev,
        [specialistId]: {
          ...prev[specialistId],
          [dayIndex]: [
            ...(prev[specialistId]?.[dayIndex] || []).filter(shift => shift.id !== null),
            {
              id: data.id,
              open_time: '09:00',
              close_time: '18:00',
              work_date: specificDate
            }
          ]
        }
      }))

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
        const specificDate = weekDates[dayIndex].toISOString().split('T')[0]

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
  const toggleNotWorking = (specialistId, dayIndex) => {
    const key = `${specialistId}-${dayIndex}`
    setNotWorkingDays(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
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

  const handleTimePickerConfirm = ({ openTime, closeTime }) => {
    // Validate that opening time < closing time
    const [openHour, openMin] = openTime.split(':').map(Number)
    const [closeHour, closeMin] = closeTime.split(':').map(Number)
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    if (openMinutes >= closeMinutes) {
      toast.error('Opening time must be before closing time')
      return
    }

    if (timePickerModal.specialistId && timePickerModal.day !== null) {
      // Update the specific shift
      updateShift(timePickerModal.shiftId, timePickerModal.specialistId, timePickerModal.day, openTime, closeTime)
    }

    closeTimePicker()
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

      // Iterate through all specialists and their working hours
      for (const specialistId of Object.keys(allSpecialistsWorkingHours)) {
        const specialistHours = allSpecialistsWorkingHours[specialistId]

        // Debug: Check if Sunday (index 6) exists in the state
        console.log('Specialist hours state:', specialistHours)
        console.log('Sunday hours (index 6):', specialistHours[6])

        // First, delete existing future hours for this specialist
        await supabase
          .from('specialist_working_hours')
          .delete()
          .eq('specialist_id', specialistId)
          .gte('work_date', startDate.toISOString().split('T')[0])

        // Prepare all shifts to insert for each day in the next 2 months
        const hoursToInsert = []

        // Loop through each day in the date range
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split('T')[0]
          const dayOfWeek = currentDate.getDay()

          // Convert to array index: Sunday(0) -> 6, Monday(1) -> 0, etc.
          const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          const dayName = dayNames[dayIndex]

          // Get shifts for this day index
          const shifts = specialistHours[dayIndex] || []

          // Debug logging for Sunday
          if (dayOfWeek === 0) {
            console.log(`Sunday ${dateString}: dayIndex=${dayIndex}, dayName=${dayName}, shifts:`, shifts)
          }

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

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1)
        }

        console.log(`Total hours to insert for specialist ${specialistId}:`, hoursToInsert.length)
        console.log('Sample Sunday entries:', hoursToInsert.filter(h => h.day_of_week === 'sunday'))

        // Insert all hours for this specialist
        if (hoursToInsert.length > 0) {
          const { error } = await supabase
            .from('specialist_working_hours')
            .insert(hoursToInsert)

          if (error) throw error
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
    const start = new Date(weekStart)
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const changeWeek = (direction) => {
    const current = new Date(selectedWeekStart)
    current.setDate(current.getDate() + (direction * 7))
    setSelectedWeekStart(current.toISOString().split('T')[0])
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    setSelectedWeekStart(monday.toISOString().split('T')[0])
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

  const weekDates = getWeekDates(selectedWeekStart)

  // Calculate stats
  const totalSpecialists = specialists.length
  const avgRating = specialists.length > 0
    ? (specialists.reduce((sum, s) => sum + (s.rating || 0), 0) / specialists.length).toFixed(1)
    : 0

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
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map((tab, index) => {
            const Icon = tab.Icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-900/15 text-white'
                    : 'text-gray-200 hover:text-white hover:bg-purple-900/5'
                } ${
                  index === 0 ? 'rounded-tl-lg' : ''
                } ${
                  index === tabs.length - 1 ? 'rounded-tr-lg' : ''
                } ${
                  index < tabs.length - 1 ? 'border-r border-purple-700/15' : ''
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
              <div className="text-3xl font-bold text-white">{totalSpecialists}</div>
            </AnimatedCard>
            <AnimatedCard className="p-6 h-32 flex flex-col justify-between">
              <div className="text-sm text-purple-200 mb-1">Average Rating</div>
              <div className="text-3xl font-bold text-white">{avgRating} ⭐</div>
            </AnimatedCard>
            <AnimatedCard className="p-6 h-32 flex flex-col justify-between">
              <div className="text-sm text-purple-200 mb-1">Utilisation Rate</div>
              <div className="text-3xl font-bold text-white">{avgUtilisation.toFixed(1)}%</div>
            </AnimatedCard>
            <AnimatedCard className="p-6 h-32 flex flex-col justify-between">
              <div className="text-sm text-purple-200 mb-1">Services Covered</div>
              <div className="text-3xl font-bold text-white">{totalServicesAssigned}</div>
            </AnimatedCard>
          </div>
        )}

        {/* View Toggle and Add Button */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-purple-900/15 border border-purple-700 text-white rounded-lg hover:bg-purple-900/20 font-medium transition-all flex items-center space-x-2"
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
                      ? 'bg-purple-900/15 border-purple-700 text-white'
                      : 'border-purple-700/15 bg-gray-900/15 text-gray-200 hover:border-purple-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all border ${
                    viewMode === 'list'
                      ? 'bg-purple-900/15 border-purple-700 text-white'
                      : 'border-purple-700/15 bg-gray-900/15 text-gray-200 hover:border-purple-600'
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
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center font-[Calibri,sans-serif]">
              <Clock className="w-6 h-6 mr-2 text-purple-300" />
              Weekly Schedule
            </h3>

            {/* Week Navigation */}
            <div className="flex items-center space-x-3">
              <button
                onClick={saveAllWorkingHoursToDatabase}
                className="px-4 py-2 text-sm font-medium text-white bg-green-900/15 border border-green-700 hover:bg-green-900/20 rounded-full transition-all flex items-center gap-2"
                title="Save all displayed hours to database"
              >
                <Save className="w-4 h-4" />
                Save All Hours
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-full transition-all"
              >
                This Week
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => changeWeek(-1)}
                  className="p-2 text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-l-full transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-6 py-2 bg-purple-950/12 border-t border-b border-purple-700/50 text-white text-sm font-semibold min-w-[180px] text-center">
                  {formatWeekRange(selectedWeekStart)}
                </div>
                <button
                  onClick={() => changeWeek(1)}
                  className="p-2 text-white bg-purple-900/15 border border-purple-700 hover:bg-purple-900/20 rounded-r-full transition-all"
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
                  <div key={specialist.id} className="grid gap-2 items-center p-2 bg-gray-900/15 border border-purple-500/20 rounded-lg hover:bg-purple-900/10 transition-all" style={{gridTemplateColumns: '200px repeat(7, 1fr)'}}>
                    {/* Specialist Name & Photo */}
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={specialist.image_url}
                          alt={specialist.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-purple-500"
                        />
                        <span className="text-sm font-semibold text-white truncate">{specialist.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyFacilityHoursToSpecialist(specialist.id)}
                        className="p-1.5 bg-purple-900/15 border border-purple-700 text-purple-300 rounded-lg hover:bg-purple-900/25 hover:border-purple-600 transition-all flex-shrink-0"
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
                              ? 'bg-gray-900/20 border border-gray-700/50'
                              : 'bg-purple-950/12 border border-purple-700/50'
                          }`}
                        >
                          {notWorking ? (
                            <div className="flex flex-col items-center justify-center flex-1">
                              <button
                                type="button"
                                onClick={() => toggleNotWorking(specialist.id, dayIndex)}
                                className="w-full px-2 py-2 bg-gray-800/20 border border-gray-600/50 text-gray-400 rounded hover:bg-gray-800/30 hover:border-gray-500 transition-all text-[10px] flex items-center justify-center gap-1"
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
                                      className="flex-1 px-2 py-1.5 bg-purple-900/15 border border-purple-700/30 text-white rounded hover:bg-purple-900/25 hover:border-purple-600 transition-all text-xs text-center"
                                    >
                                      <div className="font-medium whitespace-nowrap">
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
                                  className="flex-1 px-1.5 py-0.5 bg-gray-900/15 border border-gray-700/50 text-gray-400 rounded hover:bg-gray-900/25 hover:border-gray-600 transition-all text-[10px] flex items-center justify-center gap-0.5"
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
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center font-[Calibri,sans-serif]">
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
      {activeTab === 'salaries' && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center font-[Calibri,sans-serif]">
            <DollarSign className="w-6 h-6 mr-2 text-purple-300" />
            Specialist Salaries
          </h3>
          <p className="text-gray-300 mb-6">
            Manage salary and commission structures for your specialists.
          </p>

          {/* Placeholder for salaries management */}
          <div className="text-center py-12 text-gray-400">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Salary management coming soon...</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-6 mb-6 border border-purple-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 font-[Calibri,sans-serif]">
              {editingSpecialist ? <Edit className="w-5 h-5 text-purple-300" /> : <Plus className="w-5 h-5 text-purple-300" />}
              <span>{editingSpecialist ? 'Edit Specialist' : 'Add New Specialist'}</span>
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-300 hover:text-white transition-colors"
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
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all placeholder-gray-400"
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
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all placeholder-gray-400"
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
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all placeholder-gray-400"
                  placeholder="5"
                />
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
                      className="w-full px-4 py-3 bg-purple-950/12 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/45 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-700 file:text-white hover:file:bg-purple-600"
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
              <div className="border-t border-purple-700/50 pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Assign Services
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-purple-950/10 rounded-lg border border-purple-700/30">
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
                className="px-6 py-2 border border-purple-700/50 text-gray-200 rounded-lg hover:bg-purple-900/15 transition-all"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-purple-900/15 border border-purple-700 text-white rounded-lg hover:bg-purple-900/20 disabled:opacity-50 font-medium transition-all transform hover:scale-105"
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
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-12 text-center border border-purple-700">
          <div className="flex justify-center mb-4">
            <Users className="w-16 h-16 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-[Calibri,sans-serif]">No Specialists Yet</h3>
          <p className="text-gray-300 mb-6">
            Start by adding your first team member to appear in the mobile app
          </p>
          <button
            onClick={handleAdd}
            className="px-8 py-3 bg-purple-900/15 border border-purple-700 text-white rounded-lg hover:bg-purple-900/20 font-medium transition-all transform hover:scale-105"
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
              className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl transition-all p-4"
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
                <h3 className="text-base font-bold text-white mb-2 line-clamp-1 font-[Calibri,sans-serif]">
                  {specialist.name}
                </h3>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-white">{specialist.rating}</span>
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
                        className="inline-block px-2 py-1 text-xs bg-purple-950/25 text-purple-200 rounded-full font-medium border border-purple-700/50"
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
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-10 gap-4 px-6 py-4 bg-purple-950/25 border-b border-purple-700/50">
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
                  <span className="text-white font-medium font-[Calibri,sans-serif]">
                    {specialist.name}
                  </span>
                </div>
                <div className="col-span-3 text-gray-300 text-sm flex items-center">
                  <span className="line-clamp-2">{specialist.bio || '-'}</span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold">{specialist.rating}</span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <div className="flex flex-wrap gap-1">
                    {specialist.specialist_services && specialist.specialist_services.length > 0 ? (
                      specialist.specialist_services.slice(0, 2).map((ss) => (
                        <span
                          key={ss.service_id}
                          className="inline-block px-2 py-1 text-xs bg-purple-950/25 text-purple-200 rounded-full font-medium border border-purple-700/50"
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
        isOpen={timePickerModal.isOpen}
        onClose={closeTimePicker}
        openTime={timePickerModal.openTime}
        closeTime={timePickerModal.closeTime}
        onConfirm={handleTimePickerConfirm}
        title="Working Hours"
      />
    </div>
  )
}
