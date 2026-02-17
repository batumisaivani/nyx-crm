import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import ClassicLoader from '../components/ui/loader'
import { BarChart3, DollarSign, Users, Star, Search, X } from 'lucide-react'

export default function Customers() {
  const { facilityAccess } = useAuth()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent') // recent, bookings, revenue, name
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerBookings, setCustomerBookings] = useState([])
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchCustomers()
    }
  }, [facilityAccess])

  useEffect(() => {
    filterAndSortCustomers()
  }, [customers, searchQuery, sortBy])

  const fetchCustomers = async () => {
    try {
      setLoading(true)

      // Fetch all bookings for this salon
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name, price)
        `)
        .eq('salon_id', facilityAccess.salon_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group bookings by customer (user_id or customer_name)
      const customerMap = {}

      bookings.forEach((booking) => {
        const customerId = booking.user_id || booking.customer_name || 'guest'
        const customerName = booking.customer_name || booking.customer_email || 'Guest Customer'
        const customerEmail = booking.customer_email || ''
        const customerPhone = booking.customer_phone || ''

        if (!customerMap[customerId]) {
          customerMap[customerId] = {
            id: customerId,
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            totalBookings: 0,
            totalRevenue: 0,
            lastVisit: null,
            firstVisit: null,
            bookings: [],
            cancelledBookings: 0,
            completedBookings: 0,
          }
        }

        const customer = customerMap[customerId]
        customer.totalBookings++
        customer.totalRevenue += booking.final_price || booking.services?.price || 0
        customer.bookings.push(booking)

        if (booking.status === 'cancelled') customer.cancelledBookings++
        if (booking.status === 'completed') customer.completedBookings++

        // Track last and first visit
        const bookingDate = new Date(booking.booking_date)
        if (!customer.lastVisit || bookingDate > new Date(customer.lastVisit)) {
          customer.lastVisit = booking.booking_date
        }
        if (!customer.firstVisit || bookingDate < new Date(customer.firstVisit)) {
          customer.firstVisit = booking.booking_date
        }
      })

      const customerList = Object.values(customerMap)
      setCustomers(customerList)
      setFilteredCustomers(customerList)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCustomers = () => {
    let filtered = [...customers]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'bookings':
          return b.totalBookings - a.totalBookings
        case 'revenue':
          return b.totalRevenue - a.totalRevenue
        case 'recent':
        default:
          return new Date(b.lastVisit) - new Date(a.lastVisit)
      }
    })

    setFilteredCustomers(filtered)
  }

  const openCustomerDetail = (customer) => {
    setSelectedCustomer(customer)
    setCustomerBookings(customer.bookings)
    setShowDetailModal(true)
  }

  const closeCustomerDetail = () => {
    setShowDetailModal(false)
    setSelectedCustomer(null)
    setCustomerBookings([])
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getCustomerLevel = (totalBookings) => {
    if (totalBookings >= 20) return { label: 'VIP', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    if (totalBookings >= 10) return { label: 'Loyal', color: 'bg-purple-500/50/10 text-purple-300 border-purple-300' }
    if (totalBookings >= 5) return { label: 'Regular', color: 'bg-blue-100 text-blue-800 border-blue-300' }
    return { label: 'New', color: 'bg-white/5 text-white border-purple-500/15' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  return (
    <div className="w-full -mt-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-[Inter]">Customer Management</h1>
        <p className="text-gray-300 mt-1">Manage and track your customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">Total Customers</div>
          <div className="text-3xl font-bold text-white">{customers.length}</div>
        </AnimatedCard>

        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">Avg Bookings/Customer</div>
          <div className="text-3xl font-bold text-white">
            {customers.length > 0
              ? (customers.reduce((sum, c) => sum + c.totalBookings, 0) / customers.length).toFixed(1)
              : '0'}
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-green-400">
            {customers.reduce((sum, c) => sum + c.totalRevenue, 0).toFixed(2)} GEL
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6">
          <div className="text-sm text-purple-200 mb-1">VIP Customers</div>
          <div className="text-3xl font-bold text-yellow-400">
            {customers.filter((c) => c.totalBookings >= 20).length}
          </div>
        </AnimatedCard>
      </div>

      {/* Search and Filters */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-6 mb-6 border border-purple-500/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="recent">Recent First</option>
              <option value="name">Name A-Z</option>
              <option value="bookings">Most Bookings</option>
              <option value="revenue">Highest Revenue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-950/50 border-b border-purple-500/10">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200">Level</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200">Bookings</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200">Revenue</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200">Last Visit</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-700/30">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-300">
                    {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const level = getCustomerLevel(customer.totalBookings)
                  return (
                    <tr key={customer.id} className="hover:bg-purple-900/30 transition-all">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white font-[Inter]">{customer.name}</div>
                        <div className="text-sm text-gray-300">
                          Customer since {formatDate(customer.firstVisit)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-300">{customer.email || 'No email'}</div>
                        <div className="text-sm text-gray-400">{customer.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${level.color}`}>
                          {level.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-semibold text-white">{customer.totalBookings}</div>
                        <div className="text-xs text-gray-400">
                          {customer.completedBookings} completed
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-400">
                        {customer.totalRevenue.toFixed(2)} GEL
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">{formatDate(customer.lastVisit)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openCustomerDetail(customer)}
                          className="text-purple-300 hover:text-purple-100 font-medium text-sm transition-colors"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/10">
            {/* Modal Header */}
            <div className="bg-purple-900/30 p-6 border-b border-purple-500/10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white font-[Inter]">{selectedCustomer.name}</h2>
                  <p className="text-purple-200 mt-1">Customer Details & History</p>
                </div>
                <button
                  onClick={closeCustomerDetail}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Customer Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/10">
                  <p className="text-sm text-purple-200 font-medium">Total Bookings</p>
                  <p className="text-2xl font-bold text-white mt-1">{selectedCustomer.totalBookings}</p>
                </div>
                <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/10">
                  <p className="text-sm text-purple-200 font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {selectedCustomer.totalRevenue.toFixed(2)} GEL
                  </p>
                </div>
                <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/10">
                  <p className="text-sm text-purple-200 font-medium">Avg per Booking</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {(selectedCustomer.totalRevenue / selectedCustomer.totalBookings).toFixed(2)} GEL
                  </p>
                </div>
                <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/10">
                  <p className="text-sm text-purple-200 font-medium">Cancelled</p>
                  <p className="text-2xl font-bold text-orange-400 mt-1">
                    {selectedCustomer.cancelledBookings}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-purple-950/30 rounded-lg p-4 mb-6 border border-purple-500/10">
                <h3 className="font-semibold text-white mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-purple-200">Email:</span>
                    <span className="ml-2 font-medium text-white">
                      {selectedCustomer.email || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-200">Phone:</span>
                    <span className="ml-2 font-medium text-white">
                      {selectedCustomer.phone || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-200">First Visit:</span>
                    <span className="ml-2 font-medium text-white">
                      {formatDate(selectedCustomer.firstVisit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-200">Last Visit:</span>
                    <span className="ml-2 font-medium text-white">
                      {formatDate(selectedCustomer.lastVisit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h3 className="font-semibold text-white mb-3">Booking History</h3>
                <div className="space-y-3">
                  {customerBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-purple-950/30 border border-purple-500/10 rounded-lg p-4 hover:bg-purple-950/50 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">
                              {booking.services?.name || 'Service'}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300">
                            📅 {formatDate(booking.booking_date)} at {booking.booking_time?.substring(0, 5)}
                          </div>
                          {booking.promo_code && (
                            <div className="text-sm text-green-400 mt-1">🎁 Promo: {booking.promo_code}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">
                            {(booking.final_price || booking.services?.price || 0).toFixed(2)} GEL
                          </div>
                          {booking.discount_amount > 0 && (
                            <div className="text-xs text-gray-400 line-through">
                              {booking.services?.price?.toFixed(2)} GEL
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-purple-500/10 p-4 bg-purple-900/30 flex justify-end">
              <button
                onClick={closeCustomerDetail}
                className="px-8 py-3 bg-purple-900/30 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/40 font-medium transition-all transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
