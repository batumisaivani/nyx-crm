import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'
import AnimatedCard from '../components/ui/AnimatedCard'
import { NativeDelete } from '../components/ui/delete-button'
import ClassicLoader from '../components/ui/loader'
import { Calendar, Clock, User, Edit, Smartphone, Monitor } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Bookings', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
]

const STATUS_COLORS = {
  pending: 'bg-gradient-to-br from-yellow-800/60 to-yellow-900/60 border border-yellow-400/40 text-yellow-50',
  confirmed: 'bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-500/30 text-blue-100',
  completed: 'bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-600/30 text-emerald-200',
  cancelled: 'bg-gradient-to-br from-rose-900/40 to-red-900/40 border border-rose-600/30 text-rose-200',
}

export default function Bookings() {
  const { facilityAccess } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('upcoming') // upcoming, today, all

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchBookings()
    } else {
      setLoading(false)
    }
  }, [facilityAccess, statusFilter, dateFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('bookings')
        .select(`
          *,
          services(name),
          specialists(name)
        `)
        .eq('salon_id', facilityAccess.salon_id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Apply date filter
      const today = new Date().toISOString().split('T')[0]
      if (dateFilter === 'today') {
        query = query.eq('booking_date', today)
      } else if (dateFilter === 'upcoming') {
        query = query.gte('booking_date', today)
      }

      const { data, error } = await query

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      alert('Error loading bookings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      )

      alert('Booking status updated successfully!')
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Error updating booking: ' + error.message)
    }
  }

  const deleteBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error
      alert('Booking deleted successfully!')
      fetchBookings()
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Error deleting booking: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.substring(0, 5) // HH:MM
  }

  const handleNewBooking = () => {
    setSelectedBooking(null)
    setIsModalOpen(true)
  }

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
  }

  const handleModalSave = () => {
    fetchBookings() // Refresh bookings list
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  }

  return (
    <div className="w-full -mt-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-[Inter]">Bookings</h2>
          <p className="text-gray-300 mt-1">Manage your customer appointments</p>
        </div>
        <button
          onClick={handleNewBooking}
          className="px-8 py-3 bg-purple-900/40 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/50 font-medium transition-all transform hover:scale-105"
        >
          + New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">Total Bookings</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </AnimatedCard>
        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
        </AnimatedCard>
        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">Confirmed</div>
          <div className="text-3xl font-bold text-blue-400">{stats.confirmed}</div>
        </AnimatedCard>
        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
        </AnimatedCard>
      </div>

      {/* Filters */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-6 mb-6 border border-purple-500/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Date Filter
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/50 transition-all"
            >
              <option value="upcoming">Upcoming</option>
              <option value="today">Today Only</option>
              <option value="all">All Dates</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/50 transition-all"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-12 text-center border border-purple-500/10">
          <div className="flex justify-center mb-4">
            <Calendar className="w-16 h-16 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-[Inter]">No Bookings Found</h3>
          <p className="text-gray-200">
            {statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters to see more bookings.'
              : 'Bookings from the mobile app will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl transition-all p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-lg font-semibold text-white font-[Inter] flex items-center gap-2">
                      {booking.services?.name || 'Unknown Service'}
                      {booking.created_via === 'mobile' ? (
                        <span className="text-xs font-semibold px-2 py-1 bg-purple-700/40 border border-purple-500/40 rounded text-purple-100" title="Booked via Mobile App">App</span>
                      ) : booking.created_via === 'web' ? (
                        <span className="text-xs font-semibold px-2 py-1 bg-purple-700/40 border border-purple-500/40 rounded text-purple-100" title="Walk-in booking">Walk-in</span>
                      ) : null}
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-300" />
                      <span className="text-gray-300">Date:</span>
                      <span className="font-medium text-white">
                        {formatDate(booking.booking_date)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-300" />
                      <span className="text-gray-300">Time:</span>
                      <span className="font-medium text-white">
                        {formatTime(booking.booking_time)}
                      </span>
                    </div>

                    {booking.specialists && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-purple-300" />
                        <span className="text-gray-300">Specialist:</span>
                        <span className="font-medium text-white">
                          {booking.specialists.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-purple-300">
                    Booking ID: {booking.id.substring(0, 8)}
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handleEditBooking(booking)}
                    className="px-3 py-1.5 text-xs border border-purple-600 text-purple-200 rounded-lg hover:bg-purple-800/20 transition-all font-medium flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>

                  <select
                    value={booking.status}
                    onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                    className="px-3 py-1.5 text-xs bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <NativeDelete
                    onDelete={() => deleteBooking(booking.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        facilityAccess={facilityAccess}
        initialData={selectedBooking}
      />
    </div>
  )
}
