import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import CalendarPicker from '../components/ui/CalendarPicker'
import { NativeDelete } from '../components/ui/delete-button'
import ClassicLoader from '../components/ui/loader'
import { Gift, Tag, Calendar, TrendingUp, X, DollarSign, Percent } from 'lucide-react'

export default function Promos() {
  const { facilityAccess } = useAuth()
  const [promos, setPromos] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)

  // Form fields
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('')
  const [applicableServiceIds, setApplicableServiceIds] = useState([])
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCalendar, setOpenCalendar] = useState(null) // 'validFrom', 'validUntil', or null

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchData()
    }
  }, [facilityAccess])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [promosRes, servicesRes] = await Promise.all([
        supabase
          .from('promos')
          .select('*')
          .eq('salon_id', facilityAccess.salon_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('services')
          .select('id, name')
          .eq('salon_id', facilityAccess.salon_id)
          .order('name')
      ])

      if (promosRes.error) throw promosRes.error
      if (servicesRes.error) throw servicesRes.error

      setPromos(promosRes.data || [])
      setServices(servicesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Error loading promos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCode('')
    setTitle('')
    setDescription('')
    setDiscountType('percentage')
    setDiscountValue('')
    setValidFrom('')
    setValidUntil('')
    setMaxUses('')
    setMinPurchaseAmount('')
    setApplicableServiceIds([])
    setIsActive(true)
    setEditingPromo(null)
  }

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo)
      setCode(promo.code)
      setTitle(promo.title)
      setDescription(promo.description || '')
      setDiscountType(promo.discount_type)
      setDiscountValue(promo.discount_value.toString())
      setValidFrom(promo.valid_from)
      setValidUntil(promo.valid_until)
      setMaxUses(promo.max_uses?.toString() || '')
      setMinPurchaseAmount(promo.min_purchase_amount?.toString() || '')
      setApplicableServiceIds(promo.applicable_service_ids || [])
      setIsActive(promo.is_active)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setTimeout(resetForm, 300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!code || !title || !discountValue || !validFrom || !validUntil) {
      alert('Please fill in all required fields')
      return
    }

    // Validate discount value
    const value = parseFloat(discountValue)
    if (discountType === 'percentage' && (value <= 0 || value > 100)) {
      alert('Percentage discount must be between 0 and 100')
      return
    }
    if (value <= 0) {
      alert('Discount value must be greater than 0')
      return
    }

    setSaving(true)

    try {
      const promoData = {
        salon_id: facilityAccess.salon_id,
        code: code.toUpperCase().trim(),
        title: title.trim(),
        description: description.trim() || null,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        valid_from: validFrom,
        valid_until: validUntil,
        max_uses: maxUses ? parseInt(maxUses) : null,
        min_purchase_amount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
        applicable_service_ids: applicableServiceIds.length > 0 ? applicableServiceIds : null,
        is_active: isActive,
        updated_at: new Date().toISOString()
      }

      if (editingPromo) {
        // Update existing promo
        const { error } = await supabase
          .from('promos')
          .update(promoData)
          .eq('id', editingPromo.id)

        if (error) throw error
        alert('Promo updated successfully!')
      } else {
        // Create new promo
        const { error } = await supabase
          .from('promos')
          .insert([promoData])

        if (error) throw error
        alert('Promo created successfully!')
      }

      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Error saving promo:', error)
      alert('Error saving promo: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (promoId) => {
    try {
      const { error } = await supabase
        .from('promos')
        .delete()
        .eq('id', promoId)

      if (error) throw error
      alert('Promo deleted successfully!')
      fetchData()
    } catch (error) {
      console.error('Error deleting promo:', error)
      alert('Error deleting promo: ' + error.message)
    }
  }

  const toggleActive = async (promo) => {
    try {
      const { error } = await supabase
        .from('promos')
        .update({ is_active: !promo.is_active })
        .eq('id', promo.id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error toggling promo status:', error)
      alert('Error updating promo: ' + error.message)
    }
  }

  const toggleService = (serviceId) => {
    setApplicableServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isPromoExpired = (validUntil) => {
    return new Date(validUntil) < new Date()
  }

  const isPromoActive = (promo) => {
    const now = new Date()
    const start = new Date(promo.valid_from)
    const end = new Date(promo.valid_until)
    return promo.is_active && now >= start && now <= end
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-[Inter]">Promotional Offers</h2>
          <p className="text-gray-300 mt-1">Create and manage discount codes for your customers</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-8 py-3 bg-purple-900/30 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/40 font-medium transition-all transform hover:scale-105"
        >
          + New Promo
        </button>
      </div>

      {/* Promos List */}
      {promos.length === 0 ? (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-16 text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-purple-300" />
          <h3 className="text-lg font-semibold text-white mb-2 font-[Inter]">No Promos Yet</h3>
          <p className="text-gray-300 mb-6">Create your first promotional offer to attract more customers</p>
          <button
            onClick={() => handleOpenModal()}
            className="px-8 py-3 bg-purple-900/30 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/40 font-medium transition-all transform hover:scale-105"
          >
            Create First Promo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {promos.map((promo) => {
            const expired = isPromoExpired(promo.valid_until)
            const active = isPromoActive(promo)
            const usagePercent = promo.max_uses ? (promo.current_uses / promo.max_uses) * 100 : 0

            return (
              <div
                key={promo.id}
                className={`relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 transition-all ${expired ? 'opacity-60' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-white font-[Inter]">{promo.title}</h3>
                      {active && (
                        <span className="px-2 py-1 text-xs bg-green-900/30 text-green-300 rounded-full border border-green-700">
                          Active
                        </span>
                      )}
                      {expired && (
                        <span className="px-2 py-1 text-xs bg-red-900/30 text-red-300 rounded-full border border-red-700">
                          Expired
                        </span>
                      )}
                      {!promo.is_active && !expired && (
                        <span className="px-2 py-1 text-xs bg-black/30 text-gray-300 rounded-full border border-purple-500/10">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Tag className="w-5 h-5 text-purple-300" />
                      <div className="text-2xl font-bold text-purple-300">
                        {promo.code}
                      </div>
                    </div>
                    {promo.description && (
                      <p className="text-sm text-gray-300">{promo.description}</p>
                    )}
                  </div>
                </div>

                {/* Discount Info */}
                <div className="bg-purple-900/30 rounded-lg p-4 mb-4 border border-purple-500/10">
                  <div className="flex items-center space-x-2 mb-1">
                    {promo.discount_type === 'percentage' ? (
                      <Percent className="w-6 h-6 text-purple-300" />
                    ) : (
                      <DollarSign className="w-6 h-6 text-purple-300" />
                    )}
                    <div className="text-3xl font-bold text-purple-300">
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}% OFF`
                        : `${promo.discount_value} GEL OFF`
                      }
                    </div>
                  </div>
                  {promo.min_purchase_amount && (
                    <div className="text-xs text-purple-200">
                      Minimum purchase: {promo.min_purchase_amount} GEL
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-300" />
                    <span className="text-gray-300">Valid Period:</span>
                    <span className="font-medium text-white ml-auto">
                      {formatDate(promo.valid_from)} - {formatDate(promo.valid_until)}
                    </span>
                  </div>

                  {promo.max_uses && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-purple-300" />
                          <span className="text-gray-300">Usage:</span>
                        </div>
                        <span className="font-medium text-white">
                          {promo.current_uses} / {promo.max_uses}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500/100 to-pink-500/100 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {promo.applicable_service_ids && promo.applicable_service_ids.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Services:</span>
                      <span className="font-medium text-white">
                        {promo.applicable_service_ids.length} service(s)
                      </span>
                    </div>
                  )}
                  {!promo.applicable_service_ids && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Services:</span>
                      <span className="font-medium text-purple-300">All Services</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-purple-500/10">
                  <button
                    onClick={() => toggleActive(promo)}
                    className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      promo.is_active
                        ? 'bg-black/30 border border-purple-500/[0.06] text-gray-200 hover:border-purple-500/40'
                        : 'bg-green-900/30 border border-green-700 text-green-300 hover:bg-green-900/50'
                    }`}
                  >
                    {promo.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleOpenModal(promo)}
                    className="flex-1 px-4 py-2 text-sm bg-purple-900/30 border border-purple-500/10 text-purple-300 rounded-lg hover:bg-purple-900/50 font-medium transition-all"
                  >
                    Edit
                  </button>
                  <NativeDelete
                    onDelete={() => handleDelete(promo.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/10">
            <div className="sticky top-0 bg-gradient-to-r from-purple-900/15 to-violet-900/15 border-b border-purple-500/10 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white font-[Inter]">
                  {editingPromo ? 'Edit Promo' : 'Create New Promo'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-300 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 font-[Inter]">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Promo Code *
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400 uppercase"
                      placeholder="SUMMER2024"
                      required
                      maxLength={50}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
                      placeholder="Summer Special Discount"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
                      placeholder="Get 20% off all services this summer!"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Settings */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 font-[Inter]">Discount Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full px-4 py-2 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-4 py-2 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
                      placeholder={discountType === 'percentage' ? '20' : '10.00'}
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      min="0"
                      max={discountType === 'percentage' ? '100' : undefined}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Minimum Purchase Amount
                    </label>
                    <input
                      type="number"
                      value={minPurchaseAmount}
                      onChange={(e) => setMinPurchaseAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
                      placeholder="50.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 font-[Inter]">Validity Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CalendarPicker
                    label="Valid From *"
                    value={validFrom}
                    onChange={setValidFrom}
                    minDate={new Date().toISOString().split('T')[0]}
                    isOpen={openCalendar === 'validFrom'}
                    onToggle={(open) => setOpenCalendar(open ? 'validFrom' : null)}
                  />

                  <CalendarPicker
                    label="Valid Until *"
                    value={validUntil}
                    onChange={setValidUntil}
                    minDate={validFrom || new Date().toISOString().split('T')[0]}
                    isOpen={openCalendar === 'validUntil'}
                    onToggle={(open) => setOpenCalendar(open ? 'validUntil' : null)}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Maximum Uses
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
              </div>

              {/* Applicable Services */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 font-[Inter]">Applicable Services</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Leave all unchecked to apply to all services
                </p>
                {services.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">No services available</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-purple-500/10 rounded-lg p-3">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applicableServiceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="w-4 h-4 text-purple-600 border-purple-500/15 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-200">{service.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-purple-500/15 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-200">Active (customers can use this promo)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-purple-500/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-black/30 border border-purple-500/[0.06] text-gray-200 rounded-lg hover:border-purple-500/40 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-purple-900/30 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/40 disabled:opacity-50 font-medium transition-all transform hover:scale-105"
                >
                  {saving ? 'Saving...' : editingPromo ? 'Update Promo' : 'Create Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
