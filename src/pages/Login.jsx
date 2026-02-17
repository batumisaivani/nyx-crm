import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react'
import { Sparkles, TrendingUp, Users, Calendar, Mail, Lock, Eye, EyeClosed, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [titleNumber, setTitleNumber] = useState(0)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  // Animated words for hero section
  const titles = useMemo(
    () => ["powerful", "modern", "intuitive", "seamless", "smart", "AI-powered"],
    []
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  // For 3D card effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        if (!facilityName.trim()) {
          setError('Please enter your facility name')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password, facilityName)
        if (error) {
          setError(error.message)
        } else {
          navigate('/dashboard')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          setTimeout(() => {
            navigate('/dashboard')
          }, 500)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Purple gradient orbs */}
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.15)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute -top-[10%] -right-[15%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute -bottom-[15%] -left-[10%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.15)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* Left Side - Animated Hero */}
        <div className="hidden lg:flex flex-col gap-8 text-white">
          <div className="space-y-6">
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight font-[Inter]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-white">Manage your facility</span>
              <br />
              <span className="text-white">with a{' '}</span>
              <span className="relative inline-block">
                {/* Invisible longest word to set natural container width */}
                <span className="invisible font-light font-[Inter] italic">AI-powered</span>
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute inset-0 font-light font-[Inter] italic text-purple-300 whitespace-nowrap"
                    initial={{ opacity: 0, y: -100 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
              <br />
              <span className="text-white">system</span>
            </motion.h1>

            <motion.p
              className="text-base text-white/60 max-w-xl leading-relaxed font-[Inter] font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Streamline your salon operations, manage bookings, track revenue, and delight your customers with Nyxie CRM - the all-in-one facility management solution.
            </motion.p>

            <motion.div
              className="grid grid-cols-2 gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <Calendar className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white text-sm font-[Inter]">Smart Booking</h3>
                  <p className="text-xs text-white/50 mt-1 font-[Inter]">Automated scheduling system</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <Users className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white text-sm font-[Inter]">Customer Management</h3>
                  <p className="text-xs text-white/50 mt-1 font-[Inter]">Track and engage clients</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <TrendingUp className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white text-sm font-[Inter]">Analytics</h3>
                  <p className="text-xs text-white/50 mt-1 font-[Inter]">Real-time insights & reports</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <Sparkles className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white text-sm font-[Inter]">Mobile App</h3>
                  <p className="text-xs text-white/50 mt-1 font-[Inter]">Customers book on-the-go</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Animated Sign-in Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto lg:mx-0 lg:ml-20"
          style={{ perspective: 1500 }}
        >
          <motion.div
            className="relative"
            style={{ rotateX, rotateY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ z: 10 }}
          >
            <div className="relative group">
              {/* Card glow effect */}
              <motion.div
                className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"
                animate={{
                  boxShadow: [
                    "0 0 10px 2px rgba(168,85,247,0.1)",
                    "0 0 15px 5px rgba(168,85,247,0.2)",
                    "0 0 10px 2px rgba(168,85,247,0.1)"
                  ],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatType: "mirror"
                }}
              />

              {/* Traveling light beam effect */}
              <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
                {/* Top light beam */}
                <motion.div
                  className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70"
                  initial={{ filter: "blur(2px)" }}
                  animate={{
                    left: ["-50%", "100%"],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                  }}
                  transition={{
                    left: {
                      duration: 2.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "mirror"
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "mirror"
                    }
                  }}
                />

                {/* Right light beam */}
                <motion.div
                  className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-violet-400 to-transparent opacity-70"
                  initial={{ filter: "blur(2px)" }}
                  animate={{
                    top: ["-50%", "100%"],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                  }}
                  transition={{
                    top: {
                      duration: 2.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: 0.6
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 0.6
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 0.6
                    }
                  }}
                />

                {/* Bottom light beam */}
                <motion.div
                  className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70"
                  initial={{ filter: "blur(2px)" }}
                  animate={{
                    right: ["-50%", "100%"],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                  }}
                  transition={{
                    right: {
                      duration: 2.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: 1.2
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 1.2
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 1.2
                    }
                  }}
                />

                {/* Left light beam */}
                <motion.div
                  className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-violet-400 to-transparent opacity-70"
                  initial={{ filter: "blur(2px)" }}
                  animate={{
                    bottom: ["-50%", "100%"],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                  }}
                  transition={{
                    bottom: {
                      duration: 2.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: 1.8
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 1.8
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: 1.8
                    }
                  }}
                />

                {/* Corner glow spots */}
                <motion.div
                  className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-purple-400/40 blur-[1px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "mirror"
                  }}
                />
                <motion.div
                  className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-violet-400/60 blur-[2px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.5
                  }}
                />
                <motion.div
                  className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-purple-400/60 blur-[2px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1
                  }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-violet-400/40 blur-[1px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2.3,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.5
                  }}
                />
              </div>

              {/* Card border glow */}
              <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-purple-500/15 via-violet-500/25 to-purple-500/15 opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

              {/* Glass card background */}
              <div className="relative bg-[#0d0015]/70 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/25 shadow-2xl shadow-purple-900/20 overflow-hidden">
                {/* Subtle card inner patterns */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                    backgroundSize: '30px 30px'
                  }}
                />

                {/* Logo and header */}
                <div className="text-center space-y-0 mb-2">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="mx-auto"
                  >
                    <img
                      src="/logo.png"
                      alt="Nyxie CRM Logo"
                      className="w-[115px] h-[115px] object-contain mx-auto"
                      onError={(e) => {
                        // Fallback to Sparkles icon if image fails to load
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                      }}
                    />
                    <div className="w-[115px] h-[115px] mx-auto items-center justify-center" style={{ display: 'none' }}>
                      <Sparkles className="w-24 h-24 text-purple-300" />
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-light font-[Inter] text-white"
                  >
                    {isRegister ? 'Create Your Facility' : 'Welcome to Nyxie CRM'}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/50 text-sm font-[Inter] font-light"
                  >
                    {isRegister ? 'Register your facility to get started' : 'Sign in to continue to Nyxie CRM'}
                  </motion.p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => {
                      setIsRegister(false)
                      setError(null)
                    }}
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all font-[Inter] ${
                      !isRegister
                        ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-purple-500/10'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsRegister(true)
                      setError(null)
                    }}
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all font-[Inter] ${
                      isRegister
                        ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-purple-500/10'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-900/40 backdrop-blur-sm text-red-300 p-3 rounded-lg text-sm border border-red-500/30"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.div className="space-y-3">
                    {/* Facility Name (Register only) */}
                    {isRegister && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`relative ${focusedInput === "facilityName" ? 'z-10' : ''}`}
                      >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <Sparkles className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                            focusedInput === "facilityName" ? 'text-purple-300' : 'text-purple-300/40'
                          }`} />

                          <input
                            type="text"
                            placeholder="Facility name"
                            value={facilityName}
                            onChange={(e) => setFacilityName(e.target.value)}
                            onFocus={() => setFocusedInput("facilityName")}
                            onBlur={() => setFocusedInput(null)}
                            required={isRegister}
                            className="w-full bg-white/5 border border-purple-500/10 focus:border-purple-500/40 text-white placeholder:text-white/30 h-11 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg outline-none font-[Inter] text-sm"
                          />

                          {focusedInput === "facilityName" && (
                            <motion.div
                              layoutId="input-highlight"
                              className="absolute inset-0 bg-purple-500/5 -z-10 rounded-lg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Email input */}
                    <motion.div
                      className={`relative ${focusedInput === "email" ? 'z-10' : ''}`}
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                          focusedInput === "email" ? 'text-purple-300' : 'text-purple-300/40'
                        }`} />

                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedInput("email")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          className="w-full bg-white/5 border border-purple-500/10 focus:border-purple-500/40 text-white placeholder:text-white/30 h-11 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg outline-none font-[Inter] text-sm"
                        />

                        {focusedInput === "email" && (
                          <motion.div
                            layoutId="input-highlight"
                            className="absolute inset-0 bg-purple-500/5 -z-10 rounded-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </div>
                    </motion.div>

                    {/* Password input */}
                    <motion.div
                      className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                          focusedInput === "password" ? 'text-purple-300' : 'text-purple-300/40'
                        }`} />

                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedInput("password")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          minLength={6}
                          className="w-full bg-white/5 border border-purple-500/10 focus:border-purple-500/40 text-white placeholder:text-white/30 h-11 transition-all duration-300 pl-10 pr-10 focus:bg-white/10 rounded-lg outline-none font-[Inter] text-sm"
                        />

                        <div
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 cursor-pointer"
                        >
                          {showPassword ? (
                            <Eye className="w-4 h-4 text-purple-300/40 hover:text-purple-300 transition-colors duration-300" />
                          ) : (
                            <EyeClosed className="w-4 h-4 text-purple-300/40 hover:text-purple-300 transition-colors duration-300" />
                          )}
                        </div>

                        {focusedInput === "password" && (
                          <motion.div
                            layoutId="input-highlight"
                            className="absolute inset-0 bg-purple-500/5 -z-10 rounded-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Remember me */}
                  {!isRegister && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                            className="appearance-none h-4 w-4 rounded border border-purple-500/30 bg-white/5 checked:bg-purple-600 checked:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all duration-200 cursor-pointer"
                          />
                          {rememberMe && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center text-white pointer-events-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        <label htmlFor="remember-me" className="text-xs text-white/50 hover:text-white/70 transition-colors duration-200 cursor-pointer font-[Inter]">
                          Remember me
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Sign in button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full relative group/button mt-6"
                  >
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-violet-600/30 to-fuchsia-600/30 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300 pointer-events-none" />

                    <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white font-medium h-11 rounded-lg transition-all duration-300 flex items-center justify-center shadow-[0_0_24px_rgba(147,51,234,0.3)] hover:shadow-[0_0_32px_rgba(147,51,234,0.5)]">
                      {/* Button background animation */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -z-10 pointer-events-none"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 1.5,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                        style={{
                          opacity: loading ? 1 : 0,
                          transition: 'opacity 0.3s ease'
                        }}
                      />

                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center"
                          >
                            <div className="w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.span
                            key="button-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2 text-sm font-medium font-[Inter]"
                          >
                            {isRegister ? 'Create Facility Account' : 'Sign In'}
                            <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-300" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-purple-500/15" />
                  <span className="text-[11px] text-white/30 font-[Inter] uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-purple-500/15" />
                </div>

                {/* Social logins */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2.5 h-11 rounded-lg bg-white/5 border border-purple-500/15 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm text-white/70 font-[Inter] font-medium">Google</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2.5 h-11 rounded-lg bg-white/5 border border-purple-500/15 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <span className="text-sm text-white/70 font-[Inter] font-medium">Apple</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile Hero Text - Shown only on mobile */}
        <div className="lg:hidden text-center text-white/90">
          <h2 className="text-2xl font-light font-[Inter] mb-2">
            Manage your facility with a{' '}
            <span className="italic text-purple-300">
              {titles[titleNumber]}
            </span>
            {' '}system
          </h2>
          <p className="text-sm text-white/60 font-[Inter] font-light">
            Streamline operations, manage bookings, and delight your customers
          </p>
        </div>
      </div>
    </div>
  )
}
