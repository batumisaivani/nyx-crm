import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function CalendarPicker({ value, onChange, minDate, label, isOpen, onToggle }) {
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date())
  const [showCalendar, setShowCalendar] = useState(false)

  // Use external control if provided
  const isCalendarOpen = isOpen !== undefined ? isOpen : showCalendar
  const toggleCalendar = onToggle || (() => setShowCalendar(!showCalendar))

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const selectedDate = value ? new Date(value) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleDateSelect = (day) => {
    const selected = new Date(currentYear, currentMonth, day)

    // Check if date is before minDate
    if (minDate) {
      const min = new Date(minDate)
      min.setHours(0, 0, 0, 0)
      if (selected < min) return
    }

    const formattedDate = selected.toISOString().split('T')[0]
    onChange(formattedDate)
    if (onToggle) {
      onToggle(false)
    } else {
      setShowCalendar(false)
    }
  }

  const isDateDisabled = (day) => {
    if (!minDate) return false
    const date = new Date(currentYear, currentMonth, day)
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date < min
  }

  const isDateSelected = (day) => {
    if (!selectedDate) return false
    const date = new Date(currentYear, currentMonth, day)
    date.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    return date.getTime() === selectedDate.getTime()
  }

  const isToday = (day) => {
    const date = new Date(currentYear, currentMonth, day)
    date.setHours(0, 0, 0, 0)
    return date.getTime() === today.getTime()
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-7 w-7" />
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day)
      const selected = isDateSelected(day)
      const todayDate = isToday(day)

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !disabled && handleDateSelect(day)}
          disabled={disabled}
          className={`
            h-7 w-7 rounded-lg text-xs font-medium transition-all
            ${disabled
              ? 'text-gray-400 cursor-not-allowed opacity-40'
              : 'hover:bg-purple-500/50/20 cursor-pointer'
            }
            ${selected
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : todayDate
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
  }

  const formatDisplayDate = () => {
    if (!value) return 'Select date'
    const date = new Date(value)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="relative overflow-visible">
      {label && (
        <label className="block text-xs font-medium text-gray-200 mb-1.5 text-center">
          {label}
        </label>
      )}

      {/* Date Input Display */}
      <button
        type="button"
        onClick={() => onToggle ? onToggle(!isCalendarOpen) : setShowCalendar(!showCalendar)}
        className="w-full px-3 py-2 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all flex items-center justify-center text-sm"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {formatDisplayDate()}
        </span>
      </button>

      {/* Calendar Dropdown */}
      {isCalendarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => onToggle ? onToggle(false) : setShowCalendar(false)}
          />

          {/* Calendar */}
          <div className="absolute top-full mt-2 left-0 z-[99999] w-full min-w-[240px] bg-gradient-to-r from-purple-900/95 to-violet-900/95 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-2.5">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-purple-500/50/20 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-purple-300" />
              </button>

              <div className="text-center">
                <div className="text-xs font-semibold text-white">
                  {monthNames[currentMonth]}, {currentYear}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-purple-500/50/20 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4 text-purple-300" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="h-6 w-7 flex items-center justify-center text-[10px] font-medium text-purple-300"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {renderCalendarDays()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
