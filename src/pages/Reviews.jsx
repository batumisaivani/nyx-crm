import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AnimatedCard from '../components/ui/AnimatedCard'
import ClassicLoader from '../components/ui/loader'
import { Star, MessageSquare, TrendingUp, Filter, Reply, BarChart2, Users, User } from 'lucide-react'

export default function Reviews() {
  const { facilityAccess } = useAuth()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    responseRate: 0,
    positiveSentiment: 0,
    unansweredReviews: 0,
    timeline: { today: 0, week: 0, month: 0, quarter: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState('all')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (facilityAccess?.salons?.id) {
      fetchReviews()
    }
  }, [facilityAccess, filterRating])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const salonId = facilityAccess.salons.id

      let query = supabase
        .from('reviews')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })

      if (filterRating !== 'all') {
        query = query.eq('rating', parseInt(filterRating))
      }

      const { data, error } = await query

      if (error) throw error

      setReviews(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      alert('Error loading reviews: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reviewsData) => {
    if (reviewsData.length === 0) {
      setStats({
        avgRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        responseRate: 0,
        positiveSentiment: 0,
        unansweredReviews: 0,
        timeline: { today: 0, week: 0, month: 0, quarter: 0 }
      })
      return
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    const timeline = { today: 0, week: 0, month: 0, quarter: 0 }
    let totalRating = 0
    let repliedCount = 0
    let positiveCount = 0
    let unansweredCount = 0

    // Calculate date ranges
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

    reviewsData.forEach(review => {
      distribution[review.rating]++
      totalRating += review.rating

      // Count replied reviews
      if (review.reply_text) {
        repliedCount++
      } else {
        unansweredCount++
      }

      // Count positive reviews (4-5 stars)
      if (review.rating >= 4) {
        positiveCount++
      }

      // Count timeline
      const reviewDate = new Date(review.created_at)
      if (reviewDate >= todayStart) {
        timeline.today++
      }
      if (reviewDate >= weekStart) {
        timeline.week++
      }
      if (reviewDate >= monthStart) {
        timeline.month++
      }
      if (reviewDate >= quarterStart) {
        timeline.quarter++
      }
    })

    setStats({
      avgRating: (totalRating / reviewsData.length).toFixed(1),
      totalReviews: reviewsData.length,
      distribution,
      responseRate: ((repliedCount / reviewsData.length) * 100).toFixed(0),
      positiveSentiment: ((positiveCount / reviewsData.length) * 100).toFixed(0),
      unansweredReviews: unansweredCount,
      timeline
    })
  }

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) {
      alert('Please enter a reply')
      return
    }

    try {
      setSubmitting(true)

      const { error } = await supabase
        .from('reviews')
        .update({
          reply_text: replyText.trim(),
          replied_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (error) throw error

      alert('Reply posted successfully!')
      setReplyingTo(null)
      setReplyText('')
      await fetchReviews()
      await updateSalonRating()
    } catch (error) {
      console.error('Error posting reply:', error)
      alert('Error posting reply: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const updateSalonRating = async () => {
    try {
      const salonId = facilityAccess.salons.id

      const { data: allReviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('salon_id', salonId)

      if (error) throw error

      if (allReviews.length === 0) {
        await supabase
          .from('salons')
          .update({ rating: 0, review_count: 0 })
          .eq('id', salonId)
        return
      }

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

      await supabase
        .from('salons')
        .update({
          rating: parseFloat(avgRating.toFixed(1)),
          review_count: allReviews.length
        })
        .eq('id', salonId)
    } catch (error) {
      console.error('Error updating salon rating:', error)
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-400'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <h2 className="text-2xl font-bold text-white font-[Inter]">Reviews & Ratings</h2>
        <p className="text-gray-300 mt-1">Manage customer feedback and build trust</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Average Rating */}
        <AnimatedCard className="p-6 flex flex-col h-[180px]">
          <div className="flex items-center space-x-3 mb-3">
            <Star className="w-5 h-5 text-yellow-400" />
            <div className="text-sm text-purple-200">Average Rating</div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.avgRating}</div>
            <div>
              {renderStars(Math.round(parseFloat(stats.avgRating)))}
              <div className="text-xs text-purple-300 mt-1">
                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Rating Distribution */}
        <AnimatedCard className="p-6 flex flex-col h-[180px]">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-300" />
            <div className="text-sm text-purple-200">Reviews Distribution</div>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center space-x-2">
                <span className="text-xs text-gray-300 w-6">{star}★</span>
                <div className="flex-1 bg-white/10 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: stats.totalReviews > 0
                        ? `${(stats.distribution[star] / stats.totalReviews) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-300 w-6">{stats.distribution[star]}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* Reviews Timeline */}
        <AnimatedCard className="p-6 flex flex-col h-[180px]">
          <div className="flex items-center space-x-3 mb-3">
            <BarChart2 className="w-5 h-5 text-purple-300" />
            <div className="text-sm text-purple-200">Reviews Timeline</div>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Today</span>
              <span className="text-lg font-bold text-green-400">{stats.timeline.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">This Week</span>
              <span className="text-lg font-bold text-blue-400">{stats.timeline.week}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">This Month</span>
              <span className="text-lg font-bold text-purple-400">{stats.timeline.month}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">This Quarter</span>
              <span className="text-lg font-bold text-pink-400">{stats.timeline.quarter}</span>
            </div>
          </div>
        </AnimatedCard>

        {/* Gender Distribution */}
        <AnimatedCard className="p-6 flex flex-col h-[180px]">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="w-5 h-5 text-purple-300" />
            <div className="text-sm text-purple-200">Gender Distribution</div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center space-y-3">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-center">
                <User className="w-8 h-8 text-blue-400" />
                <span className="text-xs text-gray-300 mt-1">Male</span>
              </div>
              <div className="flex flex-col items-center">
                <User className="w-8 h-8 text-pink-400" />
                <span className="text-xs text-gray-300 mt-1">Female</span>
              </div>
              <div className="flex flex-col items-center">
                <User className="w-8 h-8 text-purple-400" />
                <span className="text-xs text-gray-300 mt-1">Other</span>
              </div>
            </div>
            <div className="px-4 py-2 bg-orange-900/30 border border-orange-700 rounded-lg">
              <span className="text-xs text-orange-300 font-medium">Coming Soon</span>
            </div>
          </div>
        </AnimatedCard>

        {/* Response Rate */}
        <AnimatedCard className="p-6 flex flex-col h-[180px]">
          <div className="flex items-center space-x-3 mb-3">
            <Reply className="w-5 h-5 text-blue-400" />
            <div className="text-sm text-purple-200">Response Rate</div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">{stats.responseRate}%</div>
            <div className="text-xs text-purple-300">
              {stats.responseRate >= 80 ? 'Excellent engagement!' : stats.responseRate >= 50 ? 'Good response rate' : 'Reply to more reviews'}
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Filters */}
      <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 mb-6">
        <div className="flex items-center space-x-4 flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-purple-300" />
            <span className="text-sm font-medium text-gray-200">Filter by rating:</span>
          </div>
          <div className="flex space-x-2 flex-wrap gap-2">
            <button
              onClick={() => setFilterRating('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterRating === 'all'
                  ? 'bg-purple-900/30 border border-purple-500/10 text-white'
                  : 'bg-black/30 border border-purple-500/[0.06] text-gray-200 hover:border-purple-500/40'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterRating === rating.toString()
                    ? 'bg-purple-900/30 border border-purple-500/10 text-white'
                    : 'bg-black/30 border border-purple-500/[0.06] text-gray-200 hover:border-purple-500/40'
                }`}
              >
                {rating}★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-16 text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-purple-300" />
            <h3 className="text-xl font-semibold text-white mb-2 font-[Inter]">No reviews yet</h3>
            <p className="text-gray-300">
              {filterRating === 'all'
                ? 'Your customers haven\'t left any reviews yet'
                : `No ${filterRating}-star reviews found`}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/10 shadow-2xl p-6 hover:shadow-purple-500/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                    {review.customer_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-white font-[Inter]">
                      {review.customer_name || 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-300">{review.customer_email}</div>
                    <div className="mt-1">{renderStars(review.rating)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-300">{formatDate(review.created_at)}</div>
                  {review.booking_id && (
                    <div className="text-xs text-purple-300 mt-1 flex items-center justify-end gap-1">
                      <Star className="w-3 h-3" /> Verified
                    </div>
                  )}
                </div>
              </div>

              {review.review_text && (
                <div className="mb-4 pl-16">
                  <p className="text-gray-200 leading-relaxed">{review.review_text}</p>
                </div>
              )}

              {/* Owner Reply */}
              {review.reply_text ? (
                <div className="pl-16 mt-4 border-l-4 border-purple-500 bg-purple-900/30 p-4 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-300" />
                    <span className="text-sm font-semibold text-purple-200">Your Reply</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(review.replied_at)}
                    </span>
                  </div>
                  <p className="text-gray-200">{review.reply_text}</p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="pl-16 mt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    className="w-full px-4 py-3 bg-purple-950/25 border border-purple-500/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-950/90 transition-all placeholder-gray-400"
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleReply(review.id)}
                      disabled={submitting}
                      className="px-4 py-2 bg-purple-900/30 border border-purple-500/10 text-white rounded-lg hover:bg-purple-900/40 disabled:opacity-50 text-sm font-medium transition-all"
                    >
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyText('')
                      }}
                      disabled={submitting}
                      className="px-4 py-2 bg-black/30 border border-purple-500/[0.06] text-gray-200 rounded-lg hover:border-purple-500/40 text-sm font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pl-16 mt-4">
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="text-sm font-medium text-purple-300 hover:text-purple-200 flex items-center space-x-2 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Reply to this review</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
