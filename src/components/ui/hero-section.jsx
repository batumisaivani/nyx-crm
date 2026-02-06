import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Smartphone } from 'lucide-react'
import { useState, useEffect } from 'react'
import RetroGrid from './retro-grid'

export default function HeroSection({
  title = "Revolutionizing Beauty & Wellness Bookings",
  subtitle = "The first unified platform connecting customers and businesses in real-time.",
  description = "No phone calls. No double bookings. No manual work.",
  primaryCta = { text: "Get Started", onClick: () => {} },
  secondaryCta = { text: "Learn More", onClick: () => {} },
  showMockup = true,
  mobileScreenshotCount = 3, // Number of mobile screenshots available
  desktopScreenshotCount = 3, // Number of desktop screenshots available
}) {
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0)
  const [currentDesktopIndex, setCurrentDesktopIndex] = useState(0)

  // Auto-rotate mobile screenshots
  useEffect(() => {
    if (mobileScreenshotCount <= 1) return

    const interval = setInterval(() => {
      setCurrentMobileIndex((prev) => (prev + 1) % mobileScreenshotCount)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [mobileScreenshotCount])

  // Auto-rotate desktop screenshots
  useEffect(() => {
    if (desktopScreenshotCount <= 1) return

    const interval = setInterval(() => {
      setCurrentDesktopIndex((prev) => (prev + 1) % desktopScreenshotCount)
    }, 4500) // Slightly different timing for variety

    return () => clearInterval(interval)
  }, [desktopScreenshotCount])
  return (
    <section className="relative overflow-hidden py-20 px-6">
      {/* Retro Grid Background */}
      <RetroGrid className="z-0" angle={65} />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {title}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-purple-200 mb-4"
            >
              {subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg text-purple-300 mb-8"
            >
              {description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              {/* Primary CTA */}
              <motion.button
                onClick={primaryCta.onClick}
                className="flex items-center gap-2 px-8 py-4 bg-purple-800/50 border border-purple-600 rounded-lg font-semibold text-lg hover:bg-purple-800/70 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Monitor className="w-5 h-5" />
                {primaryCta.text}
              </motion.button>

              {/* Secondary CTA */}
              <motion.button
                onClick={secondaryCta.onClick}
                className="flex items-center gap-2 px-8 py-4 bg-purple-800/50 border border-purple-600 rounded-lg font-semibold text-lg hover:bg-purple-800/70 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smartphone className="w-5 h-5" />
                {secondaryCta.text}
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-12 flex flex-wrap gap-8"
            >
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-purple-300">Booking Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">80%</div>
                <div className="text-sm text-purple-300">Less Manual Work</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-sm text-purple-300">Real-Time Sync</div>
              </div>
            </motion.div>
          </motion.div>

            {/* Right - Mockup Display */}
            {showMockup && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="relative"
              >
              {/* Desktop Mockup Behind */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotateY: [0, -5, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="relative z-10 flex justify-center"
              >
                <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg p-2 shadow-2xl border border-purple-700 w-[630px]">
                  <div className="bg-gray-900 rounded-md overflow-hidden">
                    {/* Screenshot Carousel */}
                    <div className="relative h-[395px] bg-purple-950 rounded-md">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={`desktop-${currentDesktopIndex}`}
                          src={`/screenshots/crm-desktop-${currentDesktopIndex + 1}.png`}
                          alt={`Nyxie CRM Dashboard Screenshot ${currentDesktopIndex + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </AnimatePresence>
                      {/* Progress indicators */}
                      {desktopScreenshotCount > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                          {[...Array(desktopScreenshotCount)].map((_, index) => (
                            <div
                              key={index}
                              className={`h-1 rounded-full transition-all duration-300 ${
                                index === currentDesktopIndex
                                  ? 'w-6 bg-pink-400'
                                  : 'w-1 bg-pink-700'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Phone Mockup */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotateY: [0, 5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute right-0 top-0 z-20"
              >
                <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg p-2 shadow-2xl border border-purple-700 w-[213px]">
                  <div className="bg-gray-900 rounded-md overflow-hidden relative">
                    {/* Screenshot Carousel - Fullscreen */}
                    <div className="relative h-[444px] bg-black rounded-md">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={`mobile-${currentMobileIndex}`}
                          src={`/screenshots/mobile-app-${currentMobileIndex + 1}.png`}
                          alt={`Nyxie Mobile App Screenshot ${currentMobileIndex + 1}`}
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </AnimatePresence>
                      {/* Progress indicators */}
                      {mobileScreenshotCount > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-10">
                          {[...Array(mobileScreenshotCount)].map((_, index) => (
                            <div
                              key={index}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentMobileIndex
                                  ? 'w-8'
                                  : 'w-1.5'
                              }`}
                              style={{
                                backgroundColor: index === currentMobileIndex ? '#7638FF' : '#7638FF80'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Glow effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          )}
          </div>
        </div>
      </div>
    </section>
  )
}
