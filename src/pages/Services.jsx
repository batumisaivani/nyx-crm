import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import GlowingEffect from '../components/ui/GlowingEffect'
import AnimatedCard from '../components/ui/AnimatedCard'
import { NativeDelete } from '../components/ui/delete-button'
import ClassicLoader from '../components/ui/loader'
import { Scissors, Edit, Plus, DollarSign, Clock, Trash2, X, LayoutGrid, List } from 'lucide-react'

const SERVICE_CATEGORIES = [
  'Hair Services',
  'Nail Services',
  'Spa & Massage',
  'Facial & Skincare',
  'Makeup',
  'Waxing',
  'Body Treatments',
  'Other'
]

export default function Services() {
  const { facilityAccess } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0])

  useEffect(() => {
    if (facilityAccess?.salon_id) {
      fetchServices()
    } else {
      setLoading(false)
    }
  }, [facilityAccess])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', facilityAccess.salon_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      alert('Error loading services: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setDuration('')
    setCategory(SERVICE_CATEGORIES[0])
    setEditingService(null)
    setShowAddForm(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowAddForm(true)
  }

  const handleEdit = (service) => {
    setName(service.name)
    setDescription(service.description || '')
    setPrice(service.price.toString())
    setDuration(service.duration_minutes.toString())
    setCategory(service.category)
    setEditingService(service)
    setShowAddForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!facilityAccess?.salon_id) {
      alert('No facility found')
      return
    }

    try {
      const serviceData = {
        salon_id: facilityAccess.salon_id,
        name,
        description,
        price: parseFloat(price),
        duration_minutes: parseInt(duration),
        category,
      }

      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
        alert('Service updated successfully!')
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([serviceData])

        if (error) throw error
        alert('Service created successfully!')
      }

      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Error saving service: ' + error.message)
    }
  }

  const handleDelete = async (serviceId) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error
      alert('Service deleted successfully!')
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Error deleting service: ' + error.message)
    }
  }

  // Filter services by category
  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter(s => s.category === selectedCategory)

  // Calculate stats
  const avgPrice = services.length > 0
    ? services.reduce((sum, s) => sum + s.price, 0) / services.length
    : 0
  const categoriesUsed = [...new Set(services.map(s => s.category))].length
  const avgDuration = services.length > 0
    ? Math.round(services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  return (
    <div className="w-full -mt-4">
        {/* Header with Stats */}
        <div className="mb-3">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 font-[Inter]">Services</h2>
            </div>
          </div>

          {/* Stats Cards */}
          {services.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <AnimatedCard className="px-4 py-3">
                <div className="text-[11px] text-gray-500">Total Services</div>
                <div className="text-xl font-bold text-gray-800">{services.length}</div>
              </AnimatedCard>
              <AnimatedCard className="px-4 py-3">
                <div className="text-[11px] text-gray-500">Categories</div>
                <div className="text-xl font-bold text-gray-800">{categoriesUsed}</div>
              </AnimatedCard>
              <AnimatedCard className="px-4 py-3">
                <div className="text-[11px] text-gray-500">Avg Duration</div>
                <div className="text-xl font-bold text-gray-800">{avgDuration} min</div>
              </AnimatedCard>
              <AnimatedCard className="px-4 py-3">
                <div className="text-[11px] text-gray-500">Average Price</div>
                <div className="text-xl font-bold text-gray-800">₾{avgPrice.toFixed(0)}</div>
              </AnimatedCard>
            </div>
          )}

          {/* Category Filter & View Toggle */}
          {services.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 whitespace-nowrap border ${
                    selectedCategory === 'All'
                      ? 'bg-[#9489E2]/10 border-[#9489E2] text-gray-800'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  All ({services.length})
                </button>
                {[...new Set(services.map(s => s.category))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 whitespace-nowrap border ${
                      selectedCategory === cat
                        ? 'bg-[#9489E2]/10 border-[#9489E2] text-gray-800'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {cat} ({services.filter(s => s.category === cat).length})
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 text-sm bg-[#9489E2] border border-[#9489E2] text-white rounded-lg hover:bg-[#8078d0] font-medium transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all border ${
                    viewMode === 'grid'
                      ? 'bg-[#9489E2]/10 border-[#9489E2] text-gray-800'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all border ${
                    viewMode === 'list'
                      ? 'bg-[#9489E2]/10 border-[#9489E2] text-gray-800'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Add/Edit Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-1">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-800 font-[Inter]">
                  {editingService ? 'Edit Service' : 'New Service'}
                </h3>
                <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3">
              <div className="flex gap-4">
                {/* Left: Inputs stacked */}
                <div className="w-[230px] flex-shrink-0 space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Haircut"
                      className="w-full h-9 px-3 bg-white border border-gray-200 text-gray-800 rounded-lg text-sm shadow-sm shadow-black/5 focus:border-[#9489E2] focus:ring-[3px] focus:ring-[#9489E2]/20 focus:outline-none transition-all placeholder-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Category *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required
                      className="w-full h-9 px-3 bg-white border border-gray-200 text-gray-800 rounded-lg text-sm shadow-sm shadow-black/5 focus:border-[#9489E2] focus:ring-[3px] focus:ring-[#9489E2]/20 focus:outline-none transition-all">
                      {SERVICE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-gray-500">Price (₾) *</label>
                      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" required placeholder="50"
                        className="w-full h-9 px-3 bg-white border border-gray-200 text-gray-800 rounded-lg text-sm shadow-sm shadow-black/5 focus:border-[#9489E2] focus:ring-[3px] focus:ring-[#9489E2]/20 focus:outline-none transition-all placeholder-gray-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-gray-500">Duration *</label>
                      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" step="1" required placeholder="60"
                        className="w-full h-9 px-3 bg-white border border-gray-200 text-gray-800 rounded-lg text-sm shadow-sm shadow-black/5 focus:border-[#9489E2] focus:ring-[3px] focus:ring-[#9489E2]/20 focus:outline-none transition-all placeholder-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Right: Description */}
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Describe your service..."
                    className="w-full h-[calc(100%-20px)] px-3 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg text-sm shadow-sm shadow-black/5 focus:border-[#9489E2] focus:ring-[3px] focus:ring-[#9489E2]/20 focus:outline-none transition-all placeholder-gray-400 resize-none" />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 text-sm font-medium bg-[#9489E2] text-white rounded-lg hover:bg-[#8078d0] transition-all">
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="relative bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-12 text-center border border-gray-200">
          <div className="flex justify-center mb-4">
            <Scissors className="w-16 h-16 text-[#9489E2]" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 font-[Inter]">No Services Yet</h3>
          <p className="text-gray-500 mb-6">
            Start by adding your first service to appear in the mobile app
          </p>
          <button
            onClick={handleAdd}
            className="px-8 py-3 bg-[#9489E2] border border-[#9489E2] text-white rounded-lg hover:bg-[#8078d0] font-medium transition-all transform hover:scale-105"
          >
            Add Your First Service
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="relative bg-white rounded-lg border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all p-4">
              {/* Header */}
              <div className="mb-3">
                <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-1 font-[Inter]">
                  {service.name}
                </h3>
                <span className="inline-block px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded-full font-medium border border-gray-200">
                  {service.category}
                </span>
              </div>

              {/* Description */}
              {service.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2 h-8">
                  {service.description}
                </p>
              )}
              {!service.description && (
                <div className="mb-3 h-8"></div>
              )}

              {/* Price & Duration - More Prominent */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                <div className="flex items-center justify-between text-gray-800">
                  <div>
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="text-lg font-bold">₾{service.price}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="text-lg font-bold">{service.duration_minutes}m</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 px-3 py-1.5 text-xs border border-[#9489E2] text-[#9489E2] rounded-lg hover:bg-[#9489E2]/10 transition-all font-medium flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <NativeDelete
                  onDelete={() => handleDelete(service.id)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List/Table View */
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="col-span-3 text-sm font-bold text-gray-500">Service Name</div>
            <div className="col-span-1 text-sm font-bold text-gray-500">Category</div>
            <div className="col-span-4 text-sm font-bold text-gray-500">Description</div>
            <div className="col-span-1 text-sm font-bold text-gray-500 text-center">Price</div>
            <div className="col-span-1 text-sm font-bold text-gray-500 text-center">Duration</div>
            <div className="col-span-2 text-sm font-bold text-gray-500 text-center">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredServices.map((service) => (
              <div key={service.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-all">
                <div className="col-span-3 text-gray-800 font-medium font-[Inter] flex items-center">
                  {service.name}
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="inline-block px-2 py-1 text-[10px] bg-gray-50 text-gray-500 rounded-full font-medium border border-gray-200 truncate">
                    {service.category}
                  </span>
                </div>
                <div className="col-span-4 text-gray-600 text-sm flex items-center">
                  <span className="line-clamp-2">{service.description || '-'}</span>
                </div>
                <div className="col-span-1 text-gray-800 font-bold flex items-center justify-center">
                  ₾{service.price}
                </div>
                <div className="col-span-1 text-gray-800 font-bold flex items-center justify-center">
                  {service.duration_minutes}m
                </div>
                <div className="col-span-2 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="px-3 py-1.5 text-xs border border-[#9489E2] text-[#9489E2] rounded-lg hover:bg-[#9489E2]/10 transition-all font-medium flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <NativeDelete
                    onDelete={() => handleDelete(service.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
