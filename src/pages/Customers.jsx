import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import ClassicLoader from '../components/ui/loader'
import { useToast } from '../contexts/ToastContext'
import { BarChart3, DollarSign, Users, Star, Search, X, Pencil, Check } from 'lucide-react'

export default function Customers() {
  const { facilityAccess } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [genderFilter, setGenderFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerBookings, setCustomerBookings] = useState([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editGender, setEditGender] = useState('')
  const [editLanguage, setEditLanguage] = useState('ka')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchCustomers()
    }
  }, [facilityAccess])

  useEffect(() => {
    filterAndSortCustomers()
  }, [customers, searchQuery, sortBy, genderFilter])

  const fetchCustomers = async () => {
    try {
      setLoading(true)

      // Fetch customers from customers table
      const { data: customersData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .order('created_at', { ascending: false })

      if (custError) throw custError

      // Fetch avatar URLs for app customers
      const userIds = (customersData || []).map(c => c.user_id).filter(Boolean)
      const avatarMap = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds)
        if (profiles) {
          profiles.forEach(p => { if (p.avatar_url) avatarMap[p.id] = p.avatar_url })
        }
      }

      // Attach avatars to customers
      ;(customersData || []).forEach(c => {
        c.avatar_url = c.user_id ? avatarMap[c.user_id] || null : null
      })

      // Fetch all bookings for stats
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, services(name, price)')
        .eq('salon_id', facilityAccess.salon_id)
        .order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError

      // Fetch payments for accurate revenue
      const bookingIds = (bookings || []).map(b => b.id)
      const custPaymentsMap = {}
      if (bookingIds.length > 0) {
        const { data: payData } = await supabase
          .from('payments')
          .select('booking_id, amount_paid')
          .in('booking_id', bookingIds)
        if (payData) {
          payData.forEach(p => { custPaymentsMap[p.booking_id] = p.amount_paid })
        }
      }

      // Build stats per customer
      const statsMap = {}
      ;(bookings || []).forEach(b => {
        // Match by customer_id first, then by phone
        const custId = b.customer_id || (customersData || []).find(c => c.phone && c.phone === b.customer_phone)?.id
        if (!custId) return
        if (!statsMap[custId]) statsMap[custId] = { totalBookings: 0, totalRevenue: 0, completedBookings: 0, cancelledBookings: 0, lastVisit: null, firstVisit: null, bookings: [] }

        const s = statsMap[custId]
        s.totalBookings++
        if (b.status === 'completed') {
          const paid = custPaymentsMap[b.id]
          s.totalRevenue += paid != null ? paid : (b.final_price || b.services?.price || 0)
          s.completedBookings++
        }
        if (b.status === 'cancelled') s.cancelledBookings++
        s.bookings.push(b)

        const bookingDate = new Date(b.booking_date)
        if (!s.lastVisit || bookingDate > new Date(s.lastVisit)) s.lastVisit = b.booking_date
        if (!s.firstVisit || bookingDate < new Date(s.firstVisit)) s.firstVisit = b.booking_date
      })

      const customerList = (customersData || []).map(c => ({
        ...c,
        levelOverride: c.level_override || null,
        totalBookings: statsMap[c.id]?.totalBookings || 0,
        totalRevenue: statsMap[c.id]?.totalRevenue || 0,
        completedBookings: statsMap[c.id]?.completedBookings || 0,
        cancelledBookings: statsMap[c.id]?.cancelledBookings || 0,
        lastVisit: statsMap[c.id]?.lastVisit || null,
        firstVisit: statsMap[c.id]?.firstVisit || c.created_at,
        bookings: statsMap[c.id]?.bookings || []
      }))

      setCustomers(customerList)
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

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(c => c.gender === genderFilter)
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
    setIsEditing(false)
  }

  const closeCustomerDetail = () => {
    setShowDetailModal(false)
    setSelectedCustomer(null)
    setCustomerBookings([])
    setIsEditing(false)
  }

  const startEditing = () => {
    setEditName(selectedCustomer.name || '')
    setEditPhone(selectedCustomer.phone || '')
    setEditEmail(selectedCustomer.email || '')
    setEditLevel(selectedCustomer.levelOverride || '')
    setEditGender(selectedCustomer.gender || '')
    setEditLanguage(selectedCustomer.preferred_language || 'ka')
    setIsEditing(true)
  }

  const saveCustomerEdit = async () => {
    if (!editName.trim()) {
      toast.error('Customer name is required')
      return
    }
    try {
      setSaving(true)

      // Update customers table
      const { error } = await supabase
        .from('customers')
        .update({
          name: editName.trim(),
          phone: editPhone.trim() || null,
          email: editEmail.trim() || null,
          level_override: editLevel || null,
          gender: editGender || null,
          preferred_language: editLanguage || 'ka',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCustomer.id)

      if (error) throw error

      // Also update booking records to keep them in sync
      const bookingIds = selectedCustomer.bookings.map(b => b.id)
      if (bookingIds.length > 0) {
        await supabase.from('bookings').update({
          customer_name: editName.trim(),
          customer_phone: editPhone.trim() || null,
          customer_email: editEmail.trim() || null
        }).in('id', bookingIds)
      }

      toast.success('Customer updated successfully')
      setIsEditing(false)

      // Update local state
      setSelectedCustomer(prev => ({
        ...prev,
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        levelOverride: editLevel || null,
        gender: editGender || null,
        preferred_language: editLanguage || 'ka'
      }))

      // Refetch all customers to sync
      await fetchCustomers()
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Error updating customer')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const LEVELS = {
    super_vip: { label: 'Super VIP', color: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400/50' },
    vip: { label: 'VIP', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40' },
    loyal: { label: 'Loyal', color: 'bg-purple-500/20 text-purple-300 border-purple-400/40' },
    regular: { label: 'Regular', color: 'bg-blue-500/20 text-blue-300 border-blue-400/40' },
    new: { label: 'New', color: 'bg-white/5 text-gray-300 border-white/10' },
  }

  const getCustomerLevel = (totalBookings, levelOverride) => {
    if (levelOverride && LEVELS[levelOverride]) return LEVELS[levelOverride]
    if (totalBookings >= 30) return LEVELS.super_vip
    if (totalBookings >= 20) return LEVELS.vip
    if (totalBookings >= 10) return LEVELS.loyal
    if (totalBookings >= 5) return LEVELS.regular
    return LEVELS.new
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  const getLevel = (c) => getCustomerLevel(c.totalBookings, c.levelOverride).label
  const superVipCount = customers.filter(c => getLevel(c) === 'Super VIP').length
  const vipCount = customers.filter(c => getLevel(c) === 'VIP').length
  const loyalCount = customers.filter(c => getLevel(c) === 'Loyal').length
  const regularCount = customers.filter(c => getLevel(c) === 'Regular').length
  const newCount = customers.filter(c => getLevel(c) === 'New').length

  return (
    <div className="w-full -mt-4">
      {/* Header + Stats + Filters */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white font-[Inter]">Customers</h2>
        <div className="flex items-center gap-3">
          {/* Stats inline */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/[0.06] text-white">{customers.length} total</span>
            {superVipCount > 0 && <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400">{superVipCount} super VIP</span>}
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">{vipCount} VIP</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">{loyalCount} loyal</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">{regularCount} regular</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400">{newCount} new</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{customers.reduce((sum, c) => sum + c.totalRevenue, 0).toFixed(0)} GEL</span>
          </div>

          {/* Gender filter */}
          <div className="flex items-center gap-1">
            {['all', 'female', 'male'].map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                  genderFilter === g
                    ? g === 'female' ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                    : g === 'male' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-purple-500/30'
                }`}
              >
                {g === 'all' ? 'All' : g === 'female' ? 'Female' : 'Male'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-purple-300" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-500 w-40"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs bg-purple-950/40 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="recent">Recent First</option>
            <option value="name">Name A-Z</option>
            <option value="bookings">Most Bookings</option>
            <option value="revenue">Highest Revenue</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-950/50 border-b border-purple-500/10">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200 w-[22%]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-purple-200 w-[22%]">Contact</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-purple-200 w-[10%]">Level</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-purple-200 w-[12%]">Bookings</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-purple-200 w-[14%]">Revenue</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-purple-200 w-[13%]">Last Visit</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-purple-200 w-[7%]">Actions</th>
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
                  const level = getCustomerLevel(customer.totalBookings, customer.levelOverride)
                  return (
                    <tr key={customer.id} className="hover:bg-purple-900/30 transition-all">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {customer.avatar_url ? (
                            <img src={customer.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-purple-500/30 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-purple-300">{customer.name?.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white font-[Inter]">{customer.name}</div>
                            <div className="text-[10px] text-gray-400">
                              since {formatDate(customer.firstVisit)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-300">{customer.email || 'No email'}</div>
                        <div className="text-sm text-gray-400">{customer.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${level.color}`}>
                          {level.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm font-semibold text-white">{customer.totalBookings}</div>
                        <div className="text-xs text-gray-400">
                          {customer.completedBookings} completed
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-green-400">
                        {customer.totalRevenue.toFixed(2)} GEL
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-300">{formatDate(customer.lastVisit)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openCustomerDetail(customer)}
                          className="p-2 text-purple-300 bg-purple-900/30 border border-purple-500/15 rounded-lg hover:bg-purple-900/50 transition-all inline-flex"
                        >
                          <Pencil className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeCustomerDetail}>
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/10">
              <div className="flex items-center gap-3">
                {selectedCustomer.avatar_url ? (
                  <img src={selectedCustomer.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-purple-300">{selectedCustomer.name?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-white font-[Inter]">{selectedCustomer.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getCustomerLevel(selectedCustomer.totalBookings, selectedCustomer.levelOverride).color}`}>
                      {getCustomerLevel(selectedCustomer.totalBookings, selectedCustomer.levelOverride).label}
                    </span>
                    <span className="text-[10px] text-gray-500">since {formatDate(selectedCustomer.firstVisit)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button onClick={startEditing} className="p-1.5 text-purple-300 bg-purple-900/30 border border-purple-500/15 rounded-lg hover:bg-purple-900/50 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-2.5 py-1 text-[10px] text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">Cancel</button>
                    <button onClick={saveCustomerEdit} disabled={saving} className="px-2.5 py-1 text-[10px] text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50">
                      {saving ? '...' : 'Save'}
                    </button>
                  </>
                )}
                <button onClick={closeCustomerDetail} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex gap-5 px-5 py-4">
                {/* Left: Info & Edit */}
                <div className="w-[240px] flex-shrink-0 space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-950/30 border border-purple-500/10 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-gray-400 uppercase">Bookings</p>
                      <p className="text-lg font-bold text-white">{selectedCustomer.totalBookings}</p>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-500/10 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-gray-400 uppercase">Revenue</p>
                      <p className="text-lg font-bold text-green-400">{selectedCustomer.totalRevenue.toFixed(0)}</p>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-500/10 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-gray-400 uppercase">Avg.Receipt</p>
                      <p className="text-lg font-bold text-blue-400">{selectedCustomer.totalBookings > 0 ? (selectedCustomer.totalRevenue / selectedCustomer.totalBookings).toFixed(0) : 0}</p>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-500/10 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-gray-400 uppercase">Cancelled</p>
                      <p className="text-lg font-bold text-orange-400">{selectedCustomer.cancelledBookings}</p>
                    </div>
                  </div>

                  {/* Contact / Edit fields */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Name</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-purple-950/40 border border-purple-500/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Phone</label>
                        <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-purple-950/40 border border-purple-500/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Email</label>
                        <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-purple-950/40 border border-purple-500/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Level</label>
                        <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-purple-950/40 border border-purple-500/20 text-white rounded-lg focus:ring-2 focus:ring-purple-500">
                          <option value="">Auto (by bookings)</option>
                          <option value="new">New</option>
                          <option value="regular">Regular</option>
                          <option value="loyal">Loyal</option>
                          <option value="vip">VIP</option>
                          <option value="super_vip">Super VIP</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Gender</label>
                        <div className="flex gap-1.5">
                          {[{ val: '', label: '—' }, { val: 'female', label: 'Female' }, { val: 'male', label: 'Male' }].map(g => (
                            <button
                              key={g.val}
                              type="button"
                              onClick={() => setEditGender(g.val)}
                              className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg border transition-all ${
                                editGender === g.val
                                  ? g.val === 'female' ? 'bg-pink-500/25 border-pink-500/50 text-pink-300'
                                  : g.val === 'male' ? 'bg-blue-500/25 border-blue-500/50 text-blue-300'
                                  : 'bg-purple-500/20 border-purple-500/40 text-gray-300'
                                  : 'bg-white/[0.03] border-white/[0.06] text-gray-500'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Language</label>
                        <div className="flex gap-1.5">
                          {[{ val: 'ka', label: '🇬🇪 KA' }, { val: 'en', label: '🇬🇧 EN' }, { val: 'ru', label: '🇷🇺 RU' }].map(l => (
                            <button
                              key={l.val}
                              type="button"
                              onClick={() => setEditLanguage(l.val)}
                              className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg border transition-all ${
                                editLanguage === l.val
                                  ? 'bg-purple-500/25 border-purple-500/50 text-white'
                                  : 'bg-white/[0.03] border-white/[0.06] text-gray-500'
                              }`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone</span>
                        <span className="text-white font-medium">{selectedCustomer.phone || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email</span>
                        <span className="text-white font-medium truncate ml-2 max-w-[140px]">{selectedCustomer.email || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Visit</span>
                        <span className="text-white font-medium">{formatDate(selectedCustomer.lastVisit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Language</span>
                        <span className="text-white font-medium">{selectedCustomer.preferred_language === 'en' ? '🇬🇧 English' : selectedCustomer.preferred_language === 'ru' ? '🇷🇺 Russian' : '🇬🇪 Georgian'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Booking History */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Booking History</p>
                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                    {customerBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between bg-purple-950/20 border border-purple-500/10 rounded-lg px-3 py-2 hover:bg-purple-950/30 transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            booking.status === 'completed' ? 'bg-emerald-400' :
                            booking.status === 'confirmed' ? 'bg-blue-400' :
                            booking.status === 'cancelled' ? 'bg-rose-400' : 'bg-yellow-400'
                          }`} />
                          <span className="text-xs font-medium text-white truncate">{booking.services?.name || 'Service'}</span>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">{formatDate(booking.booking_date)}</span>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">{booking.booking_time?.substring(0, 5)}</span>
                        </div>
                        <span className="text-xs font-semibold text-green-400 flex-shrink-0 ml-2">
                          {(booking.final_price || booking.services?.price || 0).toFixed(0)} GEL
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
