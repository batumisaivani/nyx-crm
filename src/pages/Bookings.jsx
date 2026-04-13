import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'
import AnimatedCard from '../components/ui/AnimatedCard'
import { NativeDelete } from '../components/ui/delete-button'
import ClassicLoader from '../components/ui/loader'
import { Calendar, Clock, User, Edit, Smartphone, Monitor, Receipt, X } from 'lucide-react'
import { createPortal } from 'react-dom'

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
  in_progress: 'bg-gradient-to-br from-emerald-700/50 to-blue-700/50 border border-emerald-500/40 text-emerald-100',
  completed: 'bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-600/30 text-emerald-200',
  cancelled: 'bg-gradient-to-br from-rose-900/40 to-red-900/40 border border-rose-600/30 text-rose-200',
}

export default function Bookings() {
  const { facilityAccess } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [receiptBooking, setReceiptBooking] = useState(null)
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

      // Fetch additional services and payments for all bookings
      const bookingIds = (data || []).map(b => b.id)
      let additionalMap = {}
      let paymentsMap = {}
      if (bookingIds.length > 0) {
        const [{ data: addSvcData }, { data: payData }] = await Promise.all([
          supabase.from('booking_additional_services').select('*').in('booking_id', bookingIds),
          supabase.from('payments').select('*').in('booking_id', bookingIds)
        ])
        if (addSvcData) {
          addSvcData.forEach(s => {
            if (!additionalMap[s.booking_id]) additionalMap[s.booking_id] = []
            additionalMap[s.booking_id].push(s)
          })
        }
        if (payData) {
          payData.forEach(p => { paymentsMap[p.booking_id] = p })
        }
      }

      const bookingsWithExtras = (data || []).map(b => ({
        ...b,
        additional_services: additionalMap[b.id] || [],
        payment: paymentsMap[b.id] || null
      }))
      setBookings(bookingsWithExtras)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      alert('Error loading bookings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      if (newStatus === 'cancelled') {
        const booking = bookings.find(b => b.id === bookingId)
        const now = new Date()
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)

        if (bookingDateTime > now) {
          // Future booking → delete entirely
          const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
          if (error) throw error
          setBookings(prev => prev.filter(b => b.id !== bookingId))
          alert('Future booking deleted!')
        } else {
          // Past booking → mark as cancelled
          const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
          if (error) throw error
          setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
          alert('Booking cancelled!')
        }
      } else {
        const { error } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId)

        if (error) throw error
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))
        alert('Booking status updated!')
      }
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
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  return (
    <div className="w-full -mt-4">
      {/* Header + Stats + Filters — all in one row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white font-[Inter]">Bookings</h2>
        <div className="flex items-center gap-3">
          {/* Stats inline */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/[0.06] text-white">{stats.total} total</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">{stats.pending} pending</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">{stats.confirmed} confirmed</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{stats.completed} completed</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">{stats.cancelled} cancelled</span>
          </div>

          {/* Filters inline */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="all">All Dates</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={handleNewBooking}
            className="px-4 py-1.5 text-xs font-medium bg-purple-900/40 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/50 transition-all"
          >
            + New Booking
          </button>
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
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-purple-950/50 border-b border-purple-500/10">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-purple-200 w-[20%]">Service</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-purple-200 w-[15%]">Customer</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-purple-200 w-[12%]">Date</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-purple-200 w-[8%]">Time</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-purple-200 w-[13%]">Specialist</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-purple-200 w-[8%]">Status</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-purple-200 w-[10%]">Price</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-purple-200 w-[14%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-700/20">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-purple-900/15 transition-all">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{booking.services?.name || 'Service'}</span>
                      {booking.created_via === 'mobile' && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-purple-700/40 border border-purple-500/40 rounded text-purple-200">App</span>
                      )}
                    </div>
                    {booking.additional_services?.length > 0 && (
                      <span className="text-[10px] text-purple-400">+{booking.additional_services.length} extra</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="text-sm text-white truncate">{booking.customer_name || 'Guest'}</div>
                    {booking.customer_phone && <div className="text-[10px] text-gray-500">{booking.customer_phone}</div>}
                  </td>
                  <td className="py-2.5 px-4 text-center text-sm text-gray-300">{formatDate(booking.booking_date)}</td>
                  <td className="py-2.5 px-4 text-center text-sm text-gray-300">{formatTime(booking.booking_time)}</td>
                  <td className="py-2.5 px-4 text-center text-sm text-gray-300">{booking.specialists?.name || '—'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center text-sm font-semibold text-purple-400">
                    {(booking.final_price || booking.services?.price || 0)} GEL
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {booking.status !== 'completed' && (
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="p-1.5 text-purple-300 bg-purple-900/30 border border-purple-500/15 rounded-lg hover:bg-purple-900/50 transition-all"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      {(booking.payment || booking.additional_services?.length > 0) && (
                        <button
                          onClick={() => setReceiptBooking(booking)}
                          className="p-1.5 text-green-300 bg-green-900/20 border border-green-500/15 rounded-lg hover:bg-green-900/40 transition-all"
                          title="Receipt"
                        >
                          <Receipt className="w-3 h-3" />
                        </button>
                      )}
                      {booking.status !== 'completed' ? (
                        <select
                          value={booking.status}
                          onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                          className="px-1.5 py-1 text-[10px] bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className="px-1.5 py-1 text-[10px] text-emerald-400/60">Completed</span>
                      )}
                      {booking.status !== 'completed' && (
                        <NativeDelete onDelete={() => deleteBooking(booking.id)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Receipt Popout */}
      {receiptBooking && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setReceiptBooking(null)}>
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-950 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Receipt Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/10">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Receipt</h3>
              </div>
              <button onClick={() => setReceiptBooking(null)} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="px-5 py-4">
              {/* Customer & Date */}
              <div className="flex justify-between text-xs text-gray-400 mb-4">
                <span>{receiptBooking.customer_name || 'Guest'}</span>
                <span>{formatDate(receiptBooking.booking_date)} at {formatTime(receiptBooking.booking_time)}</span>
              </div>

              {/* Line Items */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">{receiptBooking.services?.name || 'Service'}</span>
                  <span className="text-white font-medium">{receiptBooking.services?.price || receiptBooking.final_price || 0} GEL</span>
                </div>

                {receiptBooking.additional_services?.map((s, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-400">+ {s.service_name}</span>
                    <span className="text-white font-medium">{s.price} GEL</span>
                  </div>
                ))}

                {receiptBooking.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-400">Discount{receiptBooking.promo_code ? ` (${receiptBooking.promo_code})` : ''}</span>
                    <span className="text-green-400 font-medium">-{receiptBooking.discount_amount} GEL</span>
                  </div>
                )}
              </div>

              {/* Subtotal */}
              <div className="border-t border-purple-500/10 mt-3 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-semibold">
                    {((receiptBooking.final_price || receiptBooking.services?.price || 0) + (receiptBooking.additional_services?.reduce((s, a) => s + a.price, 0) || 0)).toFixed(2)} GEL
                  </span>
                </div>

                {receiptBooking.payment?.tip_amount > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-green-300">Tip</span>
                    <span className="text-green-300 font-medium">{receiptBooking.payment.tip_amount} GEL</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-purple-500/10 mt-3 pt-3 flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-lg font-bold text-purple-400">
                  {((receiptBooking.final_price || receiptBooking.services?.price || 0) + (receiptBooking.additional_services?.reduce((s, a) => s + a.price, 0) || 0) + (receiptBooking.payment?.tip_amount || 0)).toFixed(2)} GEL
                </span>
              </div>

              {/* Payment Info */}
              {receiptBooking.payment && (
                <div className="mt-3 pt-3 border-t border-purple-500/10 flex justify-between text-xs text-gray-500">
                  <span>Paid via {receiptBooking.payment.payment_method}</span>
                  {receiptBooking.payment.notes && <span>{receiptBooking.payment.notes}</span>}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
