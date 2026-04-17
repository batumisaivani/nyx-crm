import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DateRangeCalendar({ isOpen, onClose, onSelect, dateFrom, dateTo, anchorRef }) {
  const [viewDate, setViewDate] = useState(() => {
    if (dateFrom) return new Date(dateFrom + 'T00:00:00')
    return new Date()
  })

  if (!isOpen) return null

  // Position near the anchor element
  let posStyle = { top: '200px', left: '200px' }
  if (anchorRef?.current) {
    const rect = anchorRef.current.getBoundingClientRect()
    posStyle = {
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`
    }
  }

  const handleDayClick = (year, month, day) => {
    const dateStr = toLocalDateStr(new Date(year, month, day))
    if (!dateFrom || (dateFrom && dateTo)) {
      onSelect(dateStr, '')
    } else {
      if (dateStr < dateFrom) {
        onSelect(dateStr, dateFrom)
      } else {
        onSelect(dateFrom, dateStr)
      }
      onClose()
    }
  }

  const isInRange = (date) => {
    if (!dateFrom) return false
    const ds = toLocalDateStr(date)
    if (!dateTo) return ds === dateFrom
    return ds >= dateFrom && ds <= dateTo
  }

  const isRangeStart = (date) => dateFrom && toLocalDateStr(date) === dateFrom
  const isRangeEnd = (date) => dateTo && toLocalDateStr(date) === dateTo

  const renderMonth = (baseDate, keyPrefix) => {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`${keyPrefix}-empty-${i}`} className="h-[22px] w-5" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      const isToday = date.getTime() === today.getTime()
      const inRange = isInRange(date)
      const isStart = isRangeStart(date)
      const isEnd = isRangeEnd(date)

      days.push(
        <button
          key={`${keyPrefix}-${day}`}
          onClick={() => handleDayClick(year, month, day)}
          className={`
            h-[22px] w-5 rounded text-[10px] font-medium transition-all hover:bg-gray-100 cursor-pointer
            ${(isStart || isEnd)
              ? 'bg-[#9489E2] text-white shadow-sm shadow-[#9489E2]/20'
              : inRange
              ? 'bg-[#9489E2]/15 text-[#9489E2]'
              : isToday
              ? 'bg-gray-100 text-[#9489E2] border border-gray-200'
              : 'text-gray-400'
            }
          `}
        >
          {day}
        </button>
      )
    }

    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={`${keyPrefix}-${d}`} className="h-5 w-5 flex items-center justify-center text-[8px] font-bold text-gray-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    )
  }

  const nextMonthDate = new Date(viewDate)
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[99998]" onClick={onClose} />
      <div
        className="fixed z-[99999] w-[400px] bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-2xl p-2.5"
        style={posStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => {
              const d = new Date(viewDate)
              d.setMonth(d.getMonth() - 1)
              setViewDate(d)
            }}
            className="p-1 hover:bg-gray-100 rounded-md transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#9489E2]" />
          </button>
          <div className="flex items-center flex-1">
            <div className="flex-1 text-center text-[11px] font-semibold text-gray-800">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="w-px h-4 bg-gray-300 mx-2" />
            <div className="flex-1 text-center text-[11px] font-semibold text-gray-800">
              {nextMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const d = new Date(viewDate)
              d.setMonth(d.getMonth() + 1)
              setViewDate(d)
            }}
            className="p-1 hover:bg-gray-100 rounded-md transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#9489E2]" />
          </button>
        </div>

        {/* Hint */}
        {dateFrom && !dateTo && (
          <div className="text-center text-[9px] text-[#9489E2] mb-1.5 font-medium">Select end date</div>
        )}

        {/* Two months */}
        <div className="flex gap-3 relative">
          {renderMonth(viewDate, 'cur')}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gray-200" />
          {renderMonth(nextMonthDate, 'next')}
        </div>
      </div>
    </>,
    document.body
  )
}
