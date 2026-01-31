import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [facilityAccess, setFacilityAccess] = useState(null) // User's facility association
  const [hasFacilityAccess, setHasFacilityAccess] = useState(false)

  // Check if user has facility access
  const checkFacilityAccess = async (userId) => {
    if (!userId) {
      setFacilityAccess(null)
      setHasFacilityAccess(false)
      return
    }

    try {
      // First, get facility_users record (without join - faster)
      const facilityPromise = supabase
        .from('facility_users')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Add 5 second timeout to prevent hanging
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )

      const { data: facilityUser, error: facilityError } = await Promise.race([facilityPromise, timeout])

      if (facilityError) {
        // PGRST116 = no rows returned - user genuinely has no facility access
        if (facilityError.code === 'PGRST116') {
          console.warn('User has no facility access')
          setFacilityAccess(null)
          setHasFacilityAccess(false)
          return
        }

        // 42P01 = table doesn't exist yet
        if (facilityError.code === '42P01') {
          console.warn('facility_users table does not exist yet. Please run database-setup.sql')
          setFacilityAccess(null)
          setHasFacilityAccess(false)
          return
        }

        // For other errors, just log but keep existing access state
        console.error('Error checking facility access (keeping current state):', facilityError)
        return
      }

      // Then, get salon details separately (avoids slow join)
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('id', facilityUser.salon_id)
        .single()

      if (salonError) {
        console.error('Error fetching salon:', salonError)
      }

      // Combine the data (mimicking the join result)
      const combinedData = {
        ...facilityUser,
        salons: salon
      }

      setFacilityAccess(combinedData)
      setHasFacilityAccess(true)
    } catch (error) {
      // If timeout or network error, keep existing access state - don't kick user out
      console.warn('Temporary error checking facility access (keeping current state):', error.message)
      // Don't change facilityAccess or hasFacilityAccess
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await checkFacilityAccess(session.user.id)
      }

      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await checkFacilityAccess(session.user.id)
      } else {
        setFacilityAccess(null)
        setHasFacilityAccess(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data.user) {
      await checkFacilityAccess(data.user.id)
    }

    return { data, error }
  }

  const signUp = async (email, password, facilityName) => {
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        return { data: null, error: authError }
      }

      if (!authData.user) {
        console.error('No user returned from signUp')
        return { data: null, error: new Error('Registration failed - no user created') }
      }

      console.log('User created:', authData.user.id)

      // Step 2: Create facility (salon)
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .insert([{
          name: facilityName,
          description: '',
          address: '',
          city: '',
          phone: '',
          rating: 5.0,
          price_range: '₾₾',
          categories: ['Salon'],
          image_url: 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(facilityName),
          amenities: [],
          has_deals: false,
        }])
        .select()
        .single()

      if (salonError) {
        console.error('Salon creation error:', salonError)
        return { data: null, error: new Error('Failed to create facility: ' + salonError.message) }
      }

      console.log('Salon created:', salonData.id)

      // Step 3: Create facility_users entry
      const { error: facilityUserError } = await supabase
        .from('facility_users')
        .insert([{
          user_id: authData.user.id,
          salon_id: salonData.id,
          role: 'owner',
        }])

      if (facilityUserError) {
        console.error('Facility user creation error:', facilityUserError)
        // Try to clean up the salon
        await supabase.from('salons').delete().eq('id', salonData.id)
        return { data: null, error: new Error('Failed to link user to facility: ' + facilityUserError.message) }
      }

      console.log('Facility user created successfully')

      await checkFacilityAccess(authData.user.id)

      return { data: authData, error: null }
    } catch (err) {
      console.error('Unexpected error during registration:', err)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setFacilityAccess(null)
    setHasFacilityAccess(false)
    setLoading(false)
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    facilityAccess, // Contains facility_users entry + salon data
    hasFacilityAccess, // Boolean: does user have CRM access?
    signIn,
    signUp,
    signOut,
    checkFacilityAccess, // Allow manual refresh
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
