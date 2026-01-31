import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Monitor, Calendar, TrendingUp, Users, Zap, CheckCircle, ArrowRight } from 'lucide-react'
import HeroSection from '../components/ui/hero-section'
import AnimatedCard from '../components/ui/AnimatedCard'

export default function Landing() {
  const navigate = useNavigate()

  const floatVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const advantages = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Direct Customer Booking",
      description: "Customers book directly through our mobile app - no phone calls, no manual scheduling"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-Time Synchronization",
      description: "Instant updates between customer app and business CRM. Zero booking conflicts."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Customer Insights",
      description: "Track preferences, history, and reviews - all in one unified platform"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automated Operations",
      description: "Reduce manual work by 80%. Focus on service, not scheduling."
    }
  ]

  const competitiveEdge = [
    "Unlike traditional CRMs: We connect businesses directly with customers through our app",
    "Unlike phone booking: 24/7 automated booking with zero staff involvement",
    "Unlike competitors: Unified ecosystem - one platform for businesses and customers",
    "Market advantage: First-mover in Georgia's beauty & wellness sector"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 dark:from-[#120025] dark:via-purple-950 dark:to-[#120025] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-purple-700/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Nyxie
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            CRM Login
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection
        title="Where Beauty Meets Convenienve"
        subtitle="The first unified platform, revolutionizing beauty & wellness booking."
        description="Connecting Faciliies and Consumers."
        primaryCta={{
          text: "Nyxie For Business",
          onClick: () => navigate('/login')
        }}
        secondaryCta={{
          text: "Download Customer App",
          onClick: () => window.location.href = '#'
        }}
        showMockup={true}
        mobileScreenshotCount={7}  // Update this number based on how many mobile screenshots you upload
        desktopScreenshotCount={13} // Update this number based on how many desktop screenshots you upload
      />

      {/* Problem Statement */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Problem</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <AnimatedCard className="p-6">
                <h3 className="text-xl font-bold mb-3 text-red-300">Traditional CRMs</h3>
                <p className="text-purple-200">
                  Businesses still rely on phone calls and manual scheduling. Time-consuming, error-prone, limited to business hours.
                </p>
              </AnimatedCard>
              <AnimatedCard className="p-6">
                <h3 className="text-xl font-bold mb-3 text-red-300">Phone Booking Systems</h3>
                <p className="text-purple-200">
                  Customers wait on hold, calls during business hours only, no visibility into availability, high abandonment rates.
                </p>
              </AnimatedCard>
              <AnimatedCard className="p-6">
                <h3 className="text-xl font-bold mb-3 text-red-300">Disconnected Tools</h3>
                <p className="text-purple-200">
                  Separate booking platforms, CRMs, and communication tools. Data scattered, no unified customer view.
                </p>
              </AnimatedCard>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Our Solution: Unified Ecosystem
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Mobile App Mockup */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 flex justify-center items-center gap-8 h-[500px]">
                {/* Left tilted mockup */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ rotate: -8 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg p-2 shadow-2xl border border-purple-700 w-[213px]">
                    <div className="bg-gray-900 rounded-md overflow-hidden relative">
                      <div className="relative h-[444px] bg-black rounded-md">
                        <img
                          src="/screenshots/mobile-app-1.png"
                          alt="Nyxie Mobile App"
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Right tilted mockup */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  style={{ rotate: 8 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg p-2 shadow-2xl border border-purple-700 w-[213px]">
                    <div className="bg-gray-900 rounded-md overflow-hidden relative">
                      <div className="relative h-[444px] bg-black rounded-md">
                        <img
                          src="/screenshots/mobile-app-2.png"
                          alt="Nyxie Mobile App"
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
            </motion.div>

            {/* Features List */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-purple-400" />
                Customer Mobile App
              </h3>
              <ul className="space-y-4">
                {[
                  "Browse salons & services in real-time",
                  "Book appointments 24/7 instantly",
                  "View specialist availability",
                  "Manage bookings & view history",
                  "Leave reviews & ratings"
                ].map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <span className="text-lg text-purple-100">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* CRM Mockup */}
          <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
            {/* Features List */}
            <div className="space-y-6 order-2 md:order-1">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Monitor className="w-8 h-8 text-pink-400" />
                Business CRM Dashboard
              </h3>
              <ul className="space-y-4">
                {[
                  "Automatic booking synchronization",
                  "Real-time calendar management",
                  "Customer insights & analytics",
                  "Specialist scheduling",
                  "Revenue tracking & reports"
                ].map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <span className="text-lg text-purple-100">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Desktop Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-1 md:order-2"
            >
              <motion.div
                variants={floatVariants}
                animate="animate"
                className="relative z-10 flex justify-center"
              >
                <div className="bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg p-2 shadow-2xl border border-purple-700 w-[630px]">
                  <div className="bg-gray-900 rounded-md overflow-hidden">
                    <div className="relative h-[395px] bg-purple-950 rounded-md">
                      <img
                        src="/screenshots/crm-desktop-2.png"
                        alt="Nyxie CRM Dashboard"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Our Competitive Edge
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {advantages.map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 backdrop-blur-xl rounded-xl p-6 border border-purple-700 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-700 rounded-lg text-white">
                    {advantage.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{advantage.title}</h3>
                    <p className="text-purple-200">{advantage.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-xl p-8 border border-purple-600"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">Why We Win</h3>
            <ul className="space-y-3">
              {competitiveEdge.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">{point}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Beauty & Wellness?
            </h2>
            <p className="text-xl text-purple-200 mb-12">
              Join the revolution. Access our CRM or download the customer app.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-purple-800/50 border border-purple-600 rounded-lg font-bold text-xl hover:bg-purple-800/70 transition-colors"
              >
                Nyxie For Business
              </motion.button>

              <div className="flex gap-4">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="px-8 py-5 bg-black rounded-lg font-semibold flex items-center gap-2 border border-purple-600"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  App Store
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="px-8 py-5 bg-black rounded-lg font-semibold flex items-center gap-2 border border-purple-600"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Google Play
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-purple-700/20">
        <div className="max-w-7xl mx-auto text-center text-purple-300">
          <p>&copy; 2025 Nyxie. Revolutionizing the beauty & wellness industry.</p>
        </div>
      </footer>
    </div>
  )
}
