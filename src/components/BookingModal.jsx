import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, ChevronRight } from 'lucide-react'
import { SpecialistSchedulingCard } from './ui/specialist-scheduling-card'
import { supabase } from '../lib/supabase'

/**
 * BookingModal - Modal for creating or editing bookings
 * Shows specialist selection first (unless editing), then the scheduling card
 */
export default function BookingModal({
  isOpen,
  onClose,
  onSave,
  facilityAccess,
  initialData = null
}) {
  const [selectedSpecialistId, setSelectedSpecialistId] = useState(null)
  const [specialists, setSpecialists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && facilityAccess?.salon_id) {
      fetchSpecialists()
    }
  }, [isOpen, facilityAccess])

  // If editing, auto-select the specialist
  useEffect(() => {
    if (initialData && initialData.specialist_id) {
      setSelectedSpecialistId(initialData.specialist_id)
    } else {
      setSelectedSpecialistId(null)
    }
  }, [initialData, isOpen])

  const fetchSpecialists = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .order('name')

      if (error) throw error
      setSpecialists(data || [])
    } catch (error) {
      console.error('Error fetching specialists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedSpecialistId(null)
    onClose()
  }

  const handleBack = () => {
    setSelectedSpecialistId(null)
  }

  const handleBookingComplete = () => {
    // Refresh bookings list and close modal
    onSave()
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#120025] backdrop-blur-xl rounded-lg shadow-2xl border border-purple-700 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#120025] border-b border-purple-700 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {selectedSpecialistId && !initialData && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-purple-700/50 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-white rotate-180" />
              </button>
            )}
            <h2 className="text-lg font-bold text-white font-[Calibri,sans-serif]">
              {initialData
                ? 'Edit Booking'
                : selectedSpecialistId
                  ? 'Schedule Appointment'
                  : 'Select Specialist'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-300 hover:text-white text-2xl transition-all"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {!selectedSpecialistId ? (
              <motion.div
                key="specialist-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                ) : specialists.length === 0 ? (
                  <div className="text-center py-12 text-gray-300">
                    No specialists available. Please add specialists first.
                  </div>
                ) : (
                  <>
                    <p className="text-purple-200 mb-4 text-center text-sm">
                      Choose a specialist for this booking
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {specialists.map((specialist, index) => (
                        <motion.button
                          key={specialist.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedSpecialistId(specialist.id)}
                          className="p-3 bg-purple-950/25 border-2 border-purple-700/50 rounded-lg hover:border-purple-500 hover:bg-purple-900/40 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            {specialist.image_url ? (
                              <img
                                src={specialist.image_url}
                                alt={specialist.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 group-hover:border-purple-400 transition-all"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-purple-800/50 border-2 border-purple-500 flex items-center justify-center text-white text-lg font-bold">
                                {specialist.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-white font-[Calibri,sans-serif] mb-0.5">
                                {specialist.name}
                              </h3>
                              <p className="text-xs text-purple-300 mb-1">
                                {specialist.title || 'Specialist'}
                              </p>
                              {specialist.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs text-white font-semibold">
                                    {specialist.rating}
                                  </span>
                                  {specialist.reviews_count && (
                                    <span className="text-[10px] text-purple-300">
                                      ({specialist.reviews_count})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-all" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="scheduling-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <SpecialistSchedulingCard
                  specialistId={selectedSpecialistId}
                  facilityId={facilityAccess.salon_id}
                  onBookingComplete={handleBookingComplete}
                  initialBookingData={initialData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
