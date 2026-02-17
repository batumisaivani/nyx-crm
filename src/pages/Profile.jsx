import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { Building2, Sparkles, Clock, Camera, FileText, Globe, Scissors, DollarSign, Users, Target, PawPrint, Car, Accessibility, Wifi, CreditCard, Smartphone, TrendingUp, Waves, Palette, Droplets, Heart, Zap, Eye, Sun, Shirt, Baby, ShoppingBag, Coffee, Gift, Music, Wind } from 'lucide-react'
import TimePickerModal from '../components/ui/TimePickerModal'
import ClassicLoader from '../components/ui/loader'

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
]

const CATEGORIES = ['Hair', 'Nails', 'Spa', 'Makeup', 'Skincare', 'Massage', 'Waxing', 'Brows & Lashes', 'Tanning', 'Barbershop']

const AMENITIES = [
  { key: 'pet_friendly', label: 'Pet Friendly', Icon: PawPrint },
  { key: 'parking_available', label: 'Parking Available', Icon: Car },
  { key: 'wheelchair_accessible', label: 'Wheelchair Accessible', Icon: Accessibility },
  { key: 'wifi_available', label: 'Wi-Fi Available', Icon: Wifi },
  { key: 'card_payment', label: 'Card Payment', Icon: CreditCard },
  { key: 'online_booking', label: 'Online Booking', Icon: Smartphone },
  { key: 'kids_friendly', label: 'Kids Friendly', Icon: Baby },
  { key: 'sells_products', label: 'Sells Beauty Products', Icon: ShoppingBag },
  { key: 'refreshments', label: 'Refreshments Available', Icon: Coffee },
  { key: 'gift_cards', label: 'Gift Cards', Icon: Gift },
  { key: 'music', label: 'Music/Entertainment', Icon: Music },
  { key: 'air_conditioning', label: 'Air Conditioning', Icon: Wind },
]

export default function Profile() {
  const { facilityAccess } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Profile data
  const [salonId, setSalonId] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')

  // New fields
  const [categories, setCategories] = useState([])
  const [priceRange, setPriceRange] = useState('medium')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Amenities
  const [amenities, setAmenities] = useState({
    pet_friendly: false,
    parking_available: false,
    wheelchair_accessible: false,
    wifi_available: false,
    card_payment: true,
    online_booking: true,
    kids_friendly: false,
    sells_products: false,
    refreshments: false,
    gift_cards: false,
    music: false,
    air_conditioning: false,
  })

  // Working hours
  const [workingHours, setWorkingHours] = useState({})

  // Custom time setter state
  const [customOpenTime, setCustomOpenTime] = useState('09:00')
  const [customCloseTime, setCustomCloseTime] = useState('18:00')

  // Time picker modal state
  const [timePickerModal, setTimePickerModal] = useState({
    isOpen: false,
    day: null,
    type: 'hours', // 'hours' for weekday times, 'custom' for set all days
    openTime: '09:00',
    closeTime: '18:00'
  })

  // Gallery images
  const [galleryImages, setGalleryImages] = useState([])

  useEffect(() => {
    if (facilityAccess?.salons) {
      const salon = facilityAccess.salons
      setSalonId(salon.id)
      setName(salon.name || '')
      setDescription(salon.description || '')
      setAddress(salon.address || '')
      setCity(salon.city || '')
      setPhone(salon.phone || '')
      setCategories(salon.categories || [])
      setPriceRange(salon.price_range || 'medium')
      setInstagramUrl(salon.instagram_url || '')
      setFacebookUrl(salon.facebook_url || '')
      setWebsiteUrl(salon.website_url || '')

      setAmenities({
        pet_friendly: salon.pet_friendly || false,
        parking_available: salon.parking_available || false,
        wheelchair_accessible: salon.wheelchair_accessible || false,
        wifi_available: salon.wifi_available || false,
        card_payment: salon.card_payment ?? true,
        online_booking: salon.online_booking ?? true,
        kids_friendly: salon.kids_friendly || false,
        sells_products: salon.sells_products || false,
        refreshments: salon.refreshments || false,
        gift_cards: salon.gift_cards || false,
        music: salon.music || false,
        air_conditioning: salon.air_conditioning || false,
      })

      fetchWorkingHours(salon.id)
      fetchGalleryImages(salon.id)
    }
  }, [facilityAccess])

  const fetchWorkingHours = async (salonId) => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('salon_id', salonId)

      if (error) throw error

      const hoursObj = {}
      data.forEach(h => {
        hoursObj[h.day_of_week] = {
          open_time: h.open_time?.substring(0, 5) || '09:00',
          close_time: h.close_time?.substring(0, 5) || '18:00',
          is_closed: h.is_closed || false
        }
      })
      setWorkingHours(hoursObj)
    } catch (error) {
      console.error('Error fetching working hours:', error)
    }
  }

  const fetchGalleryImages = async (salonId) => {
    try {
      const { data, error } = await supabase
        .from('salon_images')
        .select('*')
        .eq('salon_id', salonId)
        .order('display_order')

      if (error) throw error

      console.log('Gallery images fetched:', data)
      console.log('Sample image URL:', data?.[0]?.image_url)
      setGalleryImages(data || [])
    } catch (error) {
      console.error('Error fetching gallery images:', error)
    }
  }

  const fixImageUrls = async () => {
    if (!salonId || galleryImages.length === 0) return

    try {
      setSaving(true)
      let fixed = 0

      for (const image of galleryImages) {
        // Extract the file path from the existing URL or image_url field
        // Expected format: https://{project}.supabase.co/storage/v1/object/public/salon-images/{path}
        let filePath = null

        if (image.image_url.includes('/storage/v1/object/public/salon-images/')) {
          filePath = image.image_url.split('/storage/v1/object/public/salon-images/')[1]
        } else if (image.image_url.startsWith('gallery/')) {
          filePath = image.image_url
        }

        if (filePath) {
          // Regenerate the public URL
          const { data: urlData } = supabase.storage
            .from('salon-images')
            .getPublicUrl(filePath)

          const newUrl = urlData.publicUrl

          // Update the database if URL changed
          if (newUrl !== image.image_url) {
            const { error } = await supabase
              .from('salon_images')
              .update({ image_url: newUrl })
              .eq('id', image.id)

            if (error) {
              console.error(`Failed to update image ${image.id}:`, error)
            } else {
              fixed++
              console.log(`Fixed URL for image ${image.id}: ${newUrl}`)
            }
          }
        }
      }

      await fetchGalleryImages(salonId)
      toast.success(`Fixed ${fixed} image URL(s)!`)
    } catch (error) {
      console.error('Error fixing image URLs:', error)
      toast.error('Error fixing image URLs: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (category) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleAmenity = (key) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Time picker modal handlers
  const openTimePicker = (day, type = 'hours') => {
    if (type === 'hours') {
      const hours = workingHours[day] || { open_time: '09:00', close_time: '18:00' }
      setTimePickerModal({
        isOpen: true,
        day,
        type: 'hours',
        openTime: hours.open_time || '09:00',
        closeTime: hours.close_time || '18:00'
      })
    } else if (type === 'custom') {
      setTimePickerModal({
        isOpen: true,
        day: null,
        type: 'custom',
        openTime: customOpenTime,
        closeTime: customCloseTime
      })
    }
  }

  const closeTimePicker = () => {
    setTimePickerModal({
      isOpen: false,
      day: null,
      type: 'hours',
      openTime: '09:00',
      closeTime: '18:00'
    })
  }

  const handleTimePickerConfirm = ({ openTime, closeTime }) => {
    // Validate that opening time < closing time
    const [openHour, openMin] = openTime.split(':').map(Number)
    const [closeHour, closeMin] = closeTime.split(':').map(Number)
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    if (openMinutes >= closeMinutes) {
      toast.error('Opening time must be before closing time')
      return
    }

    if (timePickerModal.type === 'hours' && timePickerModal.day !== null) {
      // Update specific day hours
      setWorkingHours(prev => ({
        ...prev,
        [timePickerModal.day]: {
          ...prev[timePickerModal.day],
          open_time: openTime,
          close_time: closeTime
        }
      }))
    } else if (timePickerModal.type === 'custom') {
      // Update custom time setter and apply to all days
      setCustomOpenTime(openTime)
      setCustomCloseTime(closeTime)
      const template = { open_time: openTime, close_time: closeTime, is_closed: false }
      const newHours = {}
      DAYS_OF_WEEK.forEach(day => {
        newHours[day.value] = { ...template }
      })
      setWorkingHours(prev => ({ ...prev, ...newHours }))
      toast.success(`Applied ${openTime} - ${closeTime} to all days`)
    }

    closeTimePicker()
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!salonId) {
      toast.error('No facility found. Please contact support.')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('salons')
        .update({
          name,
          description,
          address,
          city,
          phone,
          categories,
          price_range: priceRange,
          instagram_url: instagramUrl || null,
          facebook_url: facebookUrl || null,
          website_url: websiteUrl || null,
          ...amenities,
        })
        .eq('id', salonId)

      if (error) throw error

      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving salon:', error)
      toast.error('Error saving profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleHoursChange = (dayOfWeek, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value
      }
    }))
  }

  const saveWorkingHours = async () => {
    if (!salonId) return

    try {
      setSaving(true)

      await supabase
        .from('working_hours')
        .delete()
        .eq('salon_id', salonId)

      const hoursToInsert = Object.entries(workingHours)
        .filter(([day, hours]) => !hours.is_closed && hours.open_time && hours.close_time)
        .map(([day, hours]) => ({
          salon_id: salonId,
          day_of_week: parseInt(day),
          open_time: hours.open_time + ':00',
          close_time: hours.close_time + ':00',
          is_closed: false
        }))

      if (hoursToInsert.length > 0) {
        const { error } = await supabase
          .from('working_hours')
          .insert(hoursToInsert)

        if (error) throw error
      }

      toast.success('Working hours updated successfully!')
    } catch (error) {
      console.error('Error saving working hours:', error)
      toast.error('Error saving working hours: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      setUploading(true)
      let uploadedCount = 0

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.warning(`${file.name} is too large. Max size is 5MB.`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `gallery/${salonId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('salon-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('salon-images')
          .getPublicUrl(filePath)

        console.log('Generated public URL:', data.publicUrl)

        const nextOrder = galleryImages.length + uploadedCount + 1

        const { error: dbError } = await supabase
          .from('salon_images')
          .insert([{
            salon_id: salonId,
            image_url: data.publicUrl,
            display_order: nextOrder
          }])

        if (dbError) throw dbError
        uploadedCount++
      }

      await fetchGalleryImages(salonId)
      toast.success(`${uploadedCount} image(s) uploaded successfully!`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Error uploading images: ' + error.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const deleteImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const { error } = await supabase
        .from('salon_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error
      toast.success('Image deleted successfully!')
      fetchGalleryImages(salonId)
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Error deleting image: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClassicLoader />
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', Icon: FileText },
    { id: 'categories', label: 'Services & Features', Icon: Sparkles },
    { id: 'hours', label: 'Working Hours', Icon: Clock },
    { id: 'gallery', label: 'Photo Gallery', Icon: Camera },
  ]

  return (
    <div className="w-full -mt-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white font-[Inter]">Facility Profile</h2>
      </div>

        {/* Tabs */}
        <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab, index) => {
              const Icon = tab.Icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-900/15 text-white'
                      : 'text-gray-200 hover:text-white hover:bg-purple-900/5'
                  } ${
                    index === 0 ? 'rounded-tl-lg' : ''
                  } ${
                    index === tabs.length - 1 ? 'rounded-tr-lg' : ''
                  } ${
                    index < tabs.length - 1 ? 'border-r border-purple-500/[0.06]' : ''
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center font-[Inter]">
              <Building2 className="w-6 h-6 mr-2 text-purple-300" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Facility Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                  placeholder="e.g., Glamour Beauty Salon"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                  placeholder="Tell customers about your facility, your team, and what makes you special..."
                />
                <p className="mt-1 text-xs text-gray-400">{description.length} characters</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                  placeholder="Tbilisi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                  placeholder="+995 XXX XXX XXX"
                  required
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center font-[Inter]">
              <Globe className="w-6 h-6 mr-2 text-purple-300" />
              Social Media & Website
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">@</span>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                    placeholder="your_salon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-950/12 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/20 transition-all placeholder-gray-400"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !salonId}
              className="px-8 py-3 bg-purple-900/10 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/15 disabled:opacity-50 font-medium transition-all transform hover:scale-105"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Services & Features Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Service Categories */}
          <div className="relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center font-[Inter]">
              <Scissors className="w-6 h-6 mr-2 text-purple-300" />
              Service Categories
            </h3>
            <p className="text-sm text-gray-300 mb-6">Select the types of services you offer</p>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`p-3 rounded-xl border transition-all transform hover:scale-105 ${
                    categories.includes(category)
                      ? 'bg-purple-900/10 border-purple-500/20 text-white'
                      : 'border-purple-500/[0.06] bg-black/10 text-gray-200 hover:border-purple-500/40'
                  }`}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      {category === 'Hair' && <Scissors className="w-6 h-6 text-purple-300" />}
                      {category === 'Nails' && <Droplets className="w-6 h-6 text-purple-300" />}
                      {category === 'Spa' && <Waves className="w-6 h-6 text-purple-300" />}
                      {category === 'Makeup' && <Palette className="w-6 h-6 text-purple-300" />}
                      {category === 'Skincare' && <Sparkles className="w-6 h-6 text-purple-300" />}
                      {category === 'Massage' && <Heart className="w-6 h-6 text-purple-300" />}
                      {category === 'Waxing' && <Zap className="w-6 h-6 text-purple-300" />}
                      {category === 'Brows & Lashes' && <Eye className="w-6 h-6 text-purple-300" />}
                      {category === 'Tanning' && <Sun className="w-6 h-6 text-purple-300" />}
                      {category === 'Barbershop' && <Shirt className="w-6 h-6 text-purple-300" />}
                    </div>
                    <div className="text-xs font-medium">{category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center font-[Inter]">
              <DollarSign className="w-6 h-6 mr-2 text-purple-300" />
              Price Range
            </h3>
            <p className="text-sm text-gray-300 mb-6">How would you categorize your pricing?</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'budget', label: 'Budget Friendly', count: 1, desc: 'Great value' },
                { value: 'medium', label: 'Medium', count: 2, desc: 'Fair prices' },
                { value: 'premium', label: 'Premium', count: 3, desc: 'High quality' },
                { value: 'luxury', label: 'Luxury', count: 4, desc: 'Exclusive' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriceRange(option.value)}
                  className={`p-4 rounded-xl border transition-all transform hover:scale-105 ${
                    priceRange === option.value
                      ? 'bg-purple-900/10 border-purple-500/20 text-white'
                      : 'border-purple-500/[0.06] bg-black/10 text-gray-200 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex justify-center gap-0.5 mb-2">
                    {Array.from({ length: option.count }).map((_, i) => (
                      <DollarSign key={i} className="w-6 h-6 text-green-400" />
                    ))}
                  </div>
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs mt-1 opacity-80">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center font-[Inter]">
              <Target className="w-6 h-6 mr-2 text-purple-300" />
              Amenities & Features
            </h3>
            <p className="text-sm text-gray-300 mb-6">What amenities do you offer?</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AMENITIES.map((amenity) => {
                const Icon = amenity.Icon
                return (
                  <button
                    key={amenity.key}
                    type="button"
                    onClick={() => toggleAmenity(amenity.key)}
                    className={`p-4 rounded-xl border transition-all transform hover:scale-105 text-left ${
                      amenities[amenity.key]
                        ? 'bg-purple-900/10 border-purple-500/20 text-white'
                        : 'border-purple-500/[0.06] bg-black/10 text-gray-200 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{amenity.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !salonId}
              className="px-8 py-3 bg-purple-900/10 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/15 disabled:opacity-50 font-medium transition-all transform hover:scale-105"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Working Hours Tab */}
      {activeTab === 'hours' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Working Hours Section */}
          <div className="lg:col-span-2 relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center font-[Inter]">
              <Clock className="w-6 h-6 mr-2 text-purple-300" />
              Working Hours
            </h3>
            <p className="text-sm text-gray-300 mb-6">Set your operating hours for each day of the week</p>

            <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const hours = workingHours[day.value] || { open_time: '09:00', close_time: '18:00', is_closed: false }

              return (
                <div key={day.value} className="flex items-center space-x-4 p-4 bg-black/10 border border-purple-500/10 rounded-lg min-h-[64px]">
                  <div className="w-32 flex-shrink-0">
                    <span className="text-sm font-semibold text-white">{day.label}</span>
                  </div>

                  <label className="flex items-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={hours.is_closed}
                      onChange={(e) => handleHoursChange(day.value, 'is_closed', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-purple-400 rounded focus:ring-purple-500 bg-black/15"
                    />
                    <span className="ml-2 text-sm text-gray-300 font-medium w-16">Closed</span>
                  </label>

                  <div className="flex items-center space-x-2 flex-1">
                    {!hours.is_closed ? (
                      <>
                        <span className="text-white font-medium text-sm">
                          {hours.open_time || '09:00'} - {hours.close_time || '18:00'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openTimePicker(day.value, 'hours')}
                          className="p-2 bg-purple-900/10 border border-purple-500/10 text-purple-300 rounded-lg hover:bg-purple-900/15 transition-all"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-sm">No hours set for this day</span>
                    )}
                  </div>
                </div>
              )
            })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={saveWorkingHours}
                disabled={saving}
                className="px-8 py-3 bg-purple-900/10 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/15 disabled:opacity-50 font-medium transition-all transform hover:scale-105"
              >
                {saving ? 'Saving...' : 'Save Working Hours'}
              </button>
            </div>
          </div>

          {/* Weekly Summary Card */}
          <div className="relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center font-[Inter]">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-300" />
              Weekly Summary
            </h3>

            {/* Total Hours */}
            <div className="mb-6 p-4 bg-purple-900/10 rounded-lg border border-purple-500/15">
              <p className="text-xs text-gray-400 mb-1">Total Weekly Hours</p>
              <p className="text-3xl font-bold text-white">
                {Object.values(workingHours).reduce((total, day) => {
                  if (day.is_closed || !day.open_time || !day.close_time) return total;
                  const [openHour, openMin] = day.open_time.split(':').map(Number);
                  const [closeHour, closeMin] = day.close_time.split(':').map(Number);
                  const hours = (closeHour * 60 + closeMin - (openHour * 60 + openMin)) / 60;
                  return total + hours;
                }, 0).toFixed(1)}
                <span className="text-lg text-gray-400 ml-1">hrs</span>
              </p>
            </div>

            {/* Daily Overview */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-semibold text-gray-300 mb-2">Daily Overview</p>
              {DAYS_OF_WEEK.map((day) => {
                const hours = workingHours[day.value] || { is_closed: true };
                const isClosed = hours.is_closed || !hours.open_time || !hours.close_time;

                let dailyHours = 0;
                if (!isClosed) {
                  const [openHour, openMin] = hours.open_time.split(':').map(Number);
                  const [closeHour, closeMin] = hours.close_time.split(':').map(Number);
                  dailyHours = (closeHour * 60 + closeMin - (openHour * 60 + openMin)) / 60;
                }

                return (
                  <div key={day.value} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{day.short}</span>
                    {isClosed ? (
                      <span className="text-gray-400 italic">Closed</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-800/15 via-purple-900/15 to-violet-900/15"
                            style={{ width: `${(dailyHours / 24) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-medium w-10 text-right">{dailyHours.toFixed(1)}h</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300 mb-2">Quick Actions</p>
              <button
                type="button"
                onClick={() => {
                  const weekdayHours = workingHours[1] || { open_time: '09:00', close_time: '18:00', is_closed: false };
                  const newHours = {};
                  [1, 2, 3, 4, 5].forEach(day => {
                    newHours[day] = { ...weekdayHours };
                  });
                  [6, 0].forEach(day => {
                    newHours[day] = { open_time: '09:00', close_time: '18:00', is_closed: true };
                  });
                  setWorkingHours(prev => ({ ...prev, ...newHours }));
                  toast.info('Applied Mon-Fri schedule with weekend closed');
                }}
                className="w-full px-3 py-2 text-xs bg-purple-900/10 border border-purple-600 text-white rounded-lg hover:bg-purple-900/15 transition-all"
              >
                Set Mon-Fri (Weekend Closed)
              </button>
              <button
                type="button"
                onClick={() => {
                  const template = { open_time: '09:00', close_time: '18:00', is_closed: false };
                  const newHours = {};
                  DAYS_OF_WEEK.forEach(day => {
                    newHours[day.value] = { ...template };
                  });
                  setWorkingHours(prev => ({ ...prev, ...newHours }));
                  toast.info('Applied 9AM-6PM to all days');
                }}
                className="w-full px-3 py-2 text-xs bg-purple-900/10 border border-purple-600 text-white rounded-lg hover:bg-purple-900/15 transition-all"
              >
                Set All Days 9AM-6PM
              </button>

              {/* Custom Time Setter */}
              <div className="p-3 bg-purple-900/8 rounded-lg border border-purple-500/[0.06] mt-3">
                <p className="text-xs text-gray-300 mb-2 font-medium">Set All Days To:</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex-1 text-white font-medium text-sm text-center">
                    {customOpenTime} - {customCloseTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => openTimePicker(null, 'custom')}
                    className="p-2 bg-purple-900/10 border border-purple-500/10 text-purple-300 rounded-lg hover:bg-purple-900/15 transition-all"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="relative bg-purple-900/12 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center font-[Inter]">
                <Camera className="w-6 h-6 mr-2 text-purple-300" />
                Photo Gallery
              </h3>
              <p className="text-sm text-gray-300 mt-1">Showcase your facility to attract more customers</p>
            </div>
            <div className="flex space-x-3">
              {galleryImages.length > 0 && (
                <button
                  type="button"
                  onClick={fixImageUrls}
                  disabled={saving}
                  className="px-6 py-3 bg-purple-900/15 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/20 disabled:opacity-50 font-medium transition-all transform hover:scale-105"
                >
                  {saving ? 'Fixing...' : 'Fix Image URLs'}
                </button>
              )}
              <label className="px-6 py-3 bg-purple-900/15 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/20 cursor-pointer font-medium transition-all transform hover:scale-105">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? 'Uploading...' : '+ Add Photos'}
              </label>
            </div>
          </div>

          {galleryImages.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-purple-500/[0.06] rounded-xl bg-black/10">
              <Camera className="w-16 h-16 mx-auto mb-4 text-purple-300" />
              <p className="text-gray-200 text-lg font-medium">No photos yet</p>
              <p className="text-gray-400 text-sm mt-2">Upload photos to showcase your facility</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => {
                console.log('Rendering image:', image.id, image.image_url)
                return (
                  <div key={image.id} className="relative group bg-black/15 border border-purple-500/10 rounded-xl overflow-hidden">
                    <img
                      src={image.image_url}
                      alt="Gallery"
                      className="w-full h-48 object-cover"
                      onLoad={(e) => {
                        console.log('✅ Image loaded successfully:', image.id)
                        e.target.style.backgroundColor = 'transparent'
                      }}
                      onError={(e) => {
                        console.error('❌ Image failed to load:', image.id, image.image_url)
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML += `
                          <div class="flex flex-col items-center justify-center h-48 bg-red-900/30 border border-red-700/30 rounded-xl p-4">
                            <div class="text-4xl mb-2">⚠️</div>
                            <div class="text-xs text-red-400 font-semibold text-center mb-2">Failed to Load</div>
                            <div class="text-xs text-gray-400 text-center break-all">${image.image_url.substring(0, 50)}...</div>
                          </div>
                        `
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => deleteImage(image.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-700 font-bold text-sm z-10"
                    >
                      Delete
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-all">
                      <div className="truncate" title={image.image_url}>
                        {image.image_url}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Time Picker Modal */}
      <TimePickerModal
        isOpen={timePickerModal.isOpen}
        onClose={closeTimePicker}
        openTime={timePickerModal.openTime}
        closeTime={timePickerModal.closeTime}
        onConfirm={handleTimePickerConfirm}
        title={timePickerModal.type === 'custom' ? 'Set All Days To' : 'Working Hours'}
      />

    </div>
  )
}
