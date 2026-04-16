import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'
import AnimatedCard from '../components/ui/AnimatedCard'
import { NativeDelete } from '../components/ui/delete-button'
import CompletionModal from '../components/ui/CompletionModal'
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
  pending: 'bg-yellow-100 border border-yellow-300 text-yellow-700',
  confirmed: 'bg-blue-100 border border-blue-300 text-blue-700',
  in_progress: 'bg-emerald-100 border border-emerald-300 text-emerald-700',
  completed: 'bg-green-100 border border-green-300 text-green-700',
  cancelled: 'bg-rose-100 border border-rose-300 text-rose-700',
}

export default function Bookings() {
  const { facilityAccess } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [receiptBooking, setReceiptBooking] = useState(null)
  const [completionBooking, setCompletionBooking] = useState(null)
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
        <h2 className="text-2xl font-bold text-gray-800 font-[Inter]">Bookings</h2>
        <div className="flex items-center gap-3">
          {/* Stats inline */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 border border-gray-300 text-gray-700">{stats.total} total</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-700">{stats.pending} pending</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100 border border-blue-300 text-blue-700">{stats.confirmed} confirmed</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-100 border border-green-300 text-green-700">{stats.completed} completed</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-100 border border-rose-300 text-rose-700">{stats.cancelled} cancelled</span>
          </div>

          {/* Filters inline */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-800 rounded-lg focus:ring-2 focus:ring-[#9489E2] transition-all"
          >
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="all">All Dates</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-800 rounded-lg focus:ring-2 focus:ring-[#9489E2] transition-all"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={handleNewBooking}
            className="px-4 py-1.5 text-xs font-medium bg-[#9489E2] border border-[#9489E2] text-white rounded-lg hover:bg-[#8078d0] transition-all"
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="relative bg-white rounded-lg shadow-2xl p-12 text-center border border-gray-200">
          <div className="flex justify-center mb-4">
            <Calendar className="w-16 h-16 text-[#9489E2]" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 font-[Inter]">No Bookings Found</h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters to see more bookings.'
              : 'Bookings from the mobile app will appear here.'}
          </p>
        </div>
      ) : (
        <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 w-[17%]">Service</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 w-[14%]">Customer</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 w-[12%]">Date</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 w-[7%]">Time</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 w-[12%]">Specialist</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 w-[10%]">Status</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 w-[10%]">Price</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 w-[18%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-all">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{booking.services?.name || 'Service'}</span>
                      {booking.created_via === 'mobile' && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-[#9489E2]/15 border border-[#9489E2]/30 rounded text-gray-500">App</span>
                      )}
                    </div>
                    {booking.additional_services?.length > 0 && (
                      <span className="text-[10px] text-[#9489E2]">+{booking.additional_services.length} extra</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="text-sm text-gray-800 truncate">{booking.customer_name || 'Guest'}</div>
                    {booking.customer_phone && <div className="text-[10px] text-gray-500">{booking.customer_phone}</div>}
                  </td>
                  <td className="py-2.5 px-4 text-center text-sm text-gray-600">{formatDate(booking.booking_date)}</td>
                  <td className="py-2.5 px-4 text-center text-sm text-gray-600">{formatTime(booking.booking_time)}</td>
                  <td className="py-2.5 px-4 text-center text-sm text-gray-600">{booking.specialists?.name || '—'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center text-sm font-semibold text-[#9489E2]">
                    {(booking.final_price || booking.services?.price || 0)} GEL
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {(booking.payment || booking.additional_services?.length > 0) && (
                        <button
                          onClick={() => setReceiptBooking(booking)}
                          className="p-1.5 text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-all"
                          title="Receipt"
                        >
                          <Receipt className="w-3 h-3" />
                        </button>
                      )}
                      {booking.status === 'completed' && (
                        <span className="px-2 py-1 text-[10px] font-semibold text-green-700 bg-green-100 border border-green-300 rounded-lg">Completed</span>
                      )}
                      {booking.status !== 'completed' && (
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="p-1.5 text-white bg-[#9489E2] border border-[#9489E2] rounded-lg hover:bg-[#8078d0] transition-all"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
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

      {/* Completion Modal */}
      <CompletionModal
        isOpen={!!completionBooking}
        onClose={() => setCompletionBooking(null)}
        onComplete={async () => {
          await updateBookingStatus(completionBooking.id, 'completed')
          setCompletionBooking(null)
          fetchBookings()
        }}
        booking={completionBooking ? {
          id: completionBooking.id,
          customer_name: completionBooking.customer_name,
          services: completionBooking.services,
          serviceName: completionBooking.services?.name,
          servicePrice: completionBooking.services?.price,
          final_price: completionBooking.final_price || completionBooking.services?.price,
          user_id: completionBooking.user_id
        } : null}
        facilityId={facilityAccess?.salon_id}
        specialistId={completionBooking?.specialist_id}
      />

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
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Receipt Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#9489E2]" />
                <h3 className="text-sm font-bold text-gray-800">Receipt</h3>
              </div>
              <button onClick={() => setReceiptBooking(null)} className="p-1 text-gray-400 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-all">
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
                  <span className="text-gray-600">{receiptBooking.services?.name || 'Service'}</span>
                  <span className="text-gray-800 font-medium">{receiptBooking.services?.price || receiptBooking.final_price || 0} GEL</span>
                </div>

                {receiptBooking.additional_services?.map((s, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-400">+ {s.service_name}</span>
                    <span className="text-gray-800 font-medium">{s.price} GEL</span>
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
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-gray-800 font-semibold">
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
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                <span className="text-gray-800 font-bold">Total</span>
                <span className="text-lg font-bold text-[#9489E2]">
                  {((receiptBooking.final_price || receiptBooking.services?.price || 0) + (receiptBooking.additional_services?.reduce((s, a) => s + a.price, 0) || 0) + (receiptBooking.payment?.tip_amount || 0)).toFixed(2)} GEL
                </span>
              </div>

              {/* Payment Info */}
              {receiptBooking.payment && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
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
