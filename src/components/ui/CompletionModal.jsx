import { useState, useEffect } from 'react'
import { X, CreditCard, Banknote, ArrowRightLeft, Star, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  { id: 'loyalty', label: 'Loyalty Points', icon: Star },
]

export default function CompletionModal({ isOpen, onClose, onComplete, booking, facilityId, specialistId }) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [tipAmount, setTipAmount] = useState('')
  const [finalPrice, setFinalPrice] = useState(0)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [additionalServices, setAdditionalServices] = useState([])
  const [availableServices, setAvailableServices] = useState([])
  const [showServicePicker, setShowServicePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && booking) {
      setFinalPrice(booking.final_price || booking.services?.price || booking.servicePrice || 0)
      setTipAmount('')
      setPaymentMethod('cash')
      setLoyaltyPoints(0)
      setPaymentNotes('')
      setAdditionalServices([])
      fetchAvailableServices()
    }
  }, [isOpen, booking])

  const fetchAvailableServices = async () => {
    if (!facilityId) return
    const { data } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('salon_id', facilityId)
      .order('name')
    setAvailableServices(data || [])
  }

  const addService = (service) => {
    setAdditionalServices(prev => [...prev, { ...service, tempId: Date.now() }])
    setShowServicePicker(false)
  }

  const removeService = (tempId) => {
    setAdditionalServices(prev => prev.filter(s => s.tempId !== tempId))
  }

  const totalAdditional = additionalServices.reduce((sum, s) => sum + (s.price || 0), 0)
  const grandTotal = parseFloat(finalPrice || 0) + totalAdditional
  const tipNum = parseFloat(tipAmount) || 0

  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      const bookingId = booking.id || booking.bookingId
      const totalPaid = grandTotal + tipNum

      // Insert payment record
      const { error: paymentError } = await supabase.from('payments').insert([{
        booking_id: bookingId,
        salon_id: facilityId,
        specialist_id: specialistId,
        payment_method: paymentMethod,
        amount_paid: grandTotal,
        tip_amount: tipNum,
        loyalty_points_used: paymentMethod === 'loyalty' ? loyaltyPoints : 0,
        notes: paymentNotes || null
      }])

      if (paymentError) throw paymentError

      // Insert additional services if any
      if (additionalServices.length > 0) {
        const { error: servicesError } = await supabase.from('booking_additional_services').insert(
          additionalServices.map(s => ({
            booking_id: bookingId,
            service_id: s.id,
            service_name: s.name,
            price: s.price
          }))
        )
        if (servicesError) throw servicesError
      }

      // Always update booking final_price to match actual amount
      await supabase.from('bookings').update({ final_price: grandTotal }).eq('id', bookingId)

      onComplete(grandTotal)
    } catch (error) {
      console.error('Error completing booking:', error)
      alert('Error completing booking: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-gradient-to-br from-gray-900 to-gray-950 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/10">
            <div>
              <h2 className="text-base font-bold text-white">Complete Booking</h2>
              <p className="text-[11px] text-gray-400">
                {booking?.customerName || booking?.customer_name || 'Customer'} — {booking?.serviceName || booking?.services?.name || 'Service'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-5 px-5 py-4">
            {/* Left Column */}
            <div className="flex-1 space-y-3">
              {/* Payment Method */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PAYMENT_METHODS.map(method => {
                    const Icon = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-medium transition-all ${
                          paymentMethod === method.id
                            ? 'bg-purple-600/30 border-purple-500/60 text-white'
                            : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-purple-500/30'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {method.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Loyalty Points (if loyalty selected) */}
              {paymentMethod === 'loyalty' && (
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Loyalty Points</label>
                  <input
                    type="number"
                    min="0"
                    value={loyaltyPoints}
                    onChange={(e) => setLoyaltyPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-purple-950/30 border border-purple-500/15 text-white rounded-lg focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Points to redeem"
                  />
                </div>
              )}

              {/* Price + Tip row */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Price (GEL)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-purple-950/30 border border-purple-500/15 text-white rounded-lg focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Tip (GEL)</label>
                  <input
                    type="number"
                    min="0"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 text-xs bg-purple-950/30 border border-purple-500/15 text-white rounded-lg focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Quick tip buttons */}
              <div className="flex gap-1.5">
                {[0, 5, 10, 20].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount.toString())}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${
                      parseFloat(tipAmount) === amount
                        ? 'bg-green-600/30 border-green-500/60 text-green-300'
                        : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-green-500/30'
                    }`}
                  >
                    {amount === 0 ? 'No tip' : `${amount} ₾`}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional..."
                  className="w-full px-2.5 py-1.5 text-xs bg-purple-950/30 border border-purple-500/15 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Right Column — Additional Services + Summary */}
            <div className="w-[240px] flex-shrink-0 flex flex-col gap-3">
              {/* Additional Services */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Additional Services</label>
                  <button
                    onClick={() => setShowServicePicker(!showServicePicker)}
                    className="flex items-center gap-0.5 text-[10px] text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>

                {showServicePicker && (
                  <div className="mb-1.5 bg-purple-950/40 border border-purple-500/15 rounded-lg max-h-24 overflow-y-auto">
                    {availableServices.map(service => (
                      <button
                        key={service.id}
                        onClick={() => addService(service)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-white hover:bg-purple-800/30 transition-colors"
                      >
                        <span>{service.name}</span>
                        <span className="text-purple-400">{service.price} GEL</span>
                      </button>
                    ))}
                  </div>
                )}

                {additionalServices.length > 0 ? (
                  <div className="space-y-1">
                    {additionalServices.map(service => (
                      <div key={service.tempId} className="flex items-center justify-between bg-purple-950/20 border border-purple-500/10 rounded-lg px-2.5 py-1.5">
                        <span className="text-[11px] text-white truncate">{service.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] text-purple-400">{service.price}</span>
                          <button onClick={() => removeService(service.tempId)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 py-2 text-center">None added</div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-purple-950/30 border border-purple-500/15 rounded-xl p-3 space-y-1.5 mt-auto">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Service</span>
                  <span className="text-white">{finalPrice} GEL</span>
                </div>
                {totalAdditional > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Additional</span>
                    <span className="text-white">+{totalAdditional} GEL</span>
                  </div>
                )}
                {tipNum > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Tip</span>
                    <span className="text-green-400">+{tipNum} GEL</span>
                  </div>
                )}
                <div className="border-t border-purple-500/10 pt-1.5 flex justify-between">
                  <span className="text-xs font-semibold text-white">Total</span>
                  <span className="text-base font-bold text-purple-400">{(grandTotal + tipNum).toFixed(2)} GEL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-purple-500/10 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs text-gray-400 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Complete & Pay'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
