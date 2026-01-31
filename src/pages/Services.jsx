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
              <h2 className="text-2xl font-bold text-white font-[Calibri,sans-serif]">Services</h2>
              <p className="text-gray-300 mt-1">Manage your service catalog</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-8 py-3 bg-purple-900/30 border border-purple-700 text-white rounded-lg hover:bg-purple-900/40 font-medium transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add Service</span>
            </button>
          </div>

          {/* Stats Cards */}
          {services.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <AnimatedCard className="p-6">
                <div className="text-sm text-purple-200 mb-1">Total Services</div>
                <div className="text-3xl font-bold text-white">{services.length}</div>
              </AnimatedCard>
              <AnimatedCard className="p-6">
                <div className="text-sm text-purple-200 mb-1">Categories</div>
                <div className="text-3xl font-bold text-white">{categoriesUsed}</div>
              </AnimatedCard>
              <AnimatedCard className="p-6">
                <div className="text-sm text-purple-200 mb-1">Avg Duration</div>
                <div className="text-3xl font-bold text-white">{avgDuration} min</div>
              </AnimatedCard>
              <AnimatedCard className="p-6">
                <div className="text-sm text-purple-200 mb-1">Average Price</div>
                <div className="text-3xl font-bold text-white">₾{avgPrice.toFixed(0)}</div>
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
                      ? 'bg-purple-900/30 border-purple-700 text-white'
                      : 'border-purple-700/30 bg-gray-900/30 text-gray-200 hover:border-purple-600'
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
                        ? 'bg-purple-900/30 border-purple-700 text-white'
                        : 'border-purple-700/30 bg-gray-900/30 text-gray-200 hover:border-purple-600'
                    }`}
                  >
                    {cat} ({services.filter(s => s.category === cat).length})
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all border ${
                    viewMode === 'grid'
                      ? 'bg-purple-900/30 border-purple-700 text-white'
                      : 'border-purple-700/30 bg-gray-900/30 text-gray-200 hover:border-purple-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all border ${
                    viewMode === 'list'
                      ? 'bg-purple-900/30 border-purple-700 text-white'
                      : 'border-purple-700/30 bg-gray-900/30 text-gray-200 hover:border-purple-600'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-6 mb-6 border border-purple-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 font-[Calibri,sans-serif]">
              {editingService ? <Edit className="w-5 h-5 text-purple-300" /> : <Plus className="w-5 h-5 text-purple-300" />}
              <span>{editingService ? 'Edit Service' : 'Add New Service'}</span>
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/50 transition-all placeholder-gray-400"
                  placeholder="e.g., Women's Haircut"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/50 transition-all placeholder-gray-400"
                  placeholder="Describe your service..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/50 transition-all placeholder-gray-400"
                  required
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Price (₾) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/50 transition-all placeholder-gray-400"
                  placeholder="50.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Duration (min) *
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 bg-purple-950/25 border border-purple-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/50 transition-all placeholder-gray-400"
                  placeholder="60"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-purple-700/50 text-gray-200 rounded-lg hover:bg-purple-900/30 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-purple-900/30 border border-purple-700 text-white rounded-lg hover:bg-purple-900/40 font-medium transition-all transform hover:scale-105"
              >
                {editingService ? 'Update Service' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg shadow-2xl p-12 text-center border border-purple-700">
          <div className="flex justify-center mb-4">
            <Scissors className="w-16 h-16 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-[Calibri,sans-serif]">No Services Yet</h3>
          <p className="text-gray-200 mb-6">
            Start by adding your first service to appear in the mobile app
          </p>
          <button
            onClick={handleAdd}
            className="px-8 py-3 bg-purple-900/30 border border-purple-700 text-white rounded-lg hover:bg-purple-900/40 font-medium transition-all transform hover:scale-105"
          >
            Add Your First Service
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl transition-all p-4">
              {/* Header */}
              <div className="mb-3">
                <h3 className="text-base font-bold text-white mb-2 line-clamp-1 font-[Calibri,sans-serif]">
                  {service.name}
                </h3>
                <span className="inline-block px-2 py-1 text-xs bg-purple-950/30 text-purple-200 rounded-full font-medium border border-purple-700/50">
                  {service.category}
                </span>
              </div>

              {/* Description */}
              {service.description && (
                <p className="text-xs text-gray-300 mb-3 line-clamp-2 h-8">
                  {service.description}
                </p>
              )}
              {!service.description && (
                <div className="mb-3 h-8"></div>
              )}

              {/* Price & Duration - More Prominent */}
              <div className="bg-purple-950/30 rounded-lg p-3 mb-3 border border-purple-700/50">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <div className="text-xs text-purple-200">Price</div>
                    <div className="text-lg font-bold">₾{service.price}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-5 h-5 text-purple-200" />
                    <div>
                      <div className="text-xs text-purple-200">Duration</div>
                      <div className="text-lg font-bold">{service.duration_minutes}m</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 px-3 py-1.5 text-xs border border-purple-600 text-purple-200 rounded-lg hover:bg-purple-800/50 transition-all font-medium flex items-center justify-center gap-1"
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
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-700 shadow-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-purple-950/30 border-b border-purple-700/50">
            <div className="col-span-3 text-sm font-bold text-purple-200">Service Name</div>
            <div className="col-span-2 text-sm font-bold text-purple-200">Category</div>
            <div className="col-span-3 text-sm font-bold text-purple-200">Description</div>
            <div className="col-span-1 text-sm font-bold text-purple-200 text-center">Price</div>
            <div className="col-span-1 text-sm font-bold text-purple-200 text-center">Duration</div>
            <div className="col-span-2 text-sm font-bold text-purple-200 text-center">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-purple-700/30">
            {filteredServices.map((service) => (
              <div key={service.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-purple-900/20 transition-all">
                <div className="col-span-3 text-white font-medium font-[Calibri,sans-serif] flex items-center">
                  {service.name}
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="inline-block px-2 py-1 text-xs bg-purple-950/30 text-purple-200 rounded-full font-medium border border-purple-700/50">
                    {service.category}
                  </span>
                </div>
                <div className="col-span-3 text-gray-300 text-sm flex items-center">
                  <span className="line-clamp-2">{service.description || '-'}</span>
                </div>
                <div className="col-span-1 text-white font-bold flex items-center justify-center">
                  ₾{service.price}
                </div>
                <div className="col-span-1 text-white font-bold flex items-center justify-center">
                  {service.duration_minutes}m
                </div>
                <div className="col-span-2 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="px-3 py-1.5 text-xs border border-purple-600 text-purple-200 rounded-lg hover:bg-purple-800/50 transition-all font-medium flex items-center gap-1"
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
