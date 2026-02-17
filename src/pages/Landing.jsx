import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Monitor, Calendar, TrendingUp, Users, Zap } from 'lucide-react'
import { HeroSection, LogosSection } from '../components/ui/hero-new'
import { Header } from '../components/ui/header'
import Floating, { FloatingElement } from '../components/ui/floating'
import { FeaturesSection } from '../components/ui/features-section'
import { Pricing } from '../components/ui/pricing'
import { FlickeringGrid } from '../components/ui/flickering-grid'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="flex w-full flex-col bg-black text-white overflow-hidden">
      <Header />
      <main className="grow">
        <HeroSection />
        <LogosSection />
      </main>

      {/* Problem Statement */}
      <section className="relative py-32 md:py-40 px-6 overflow-x-clip">
        {/* Floating parallax cards */}
        <Floating sensitivity={1.5} easingFactor={0.04} className="pointer-events-none z-10 hidden md:block">
          {/* Top-left card */}
          <FloatingElement depth={0.8} className="top-[8%] left-[3%]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/10 rounded-xl p-4 shadow-lg rotate-[-6deg] w-48">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-[Inter] font-medium text-white/70">Manual Scheduling</span>
              </div>
              <div className="h-1.5 bg-red-500/30 rounded-full w-full" />
              <div className="h-1.5 bg-red-500/20 rounded-full w-3/4 mt-1.5" />
            </div>
          </FloatingElement>

          {/* Top-right card */}
          <FloatingElement depth={1.2} className="top-[5%] right-[5%]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/10 rounded-xl p-4 shadow-lg rotate-[4deg] w-52">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-[Inter] font-medium text-white/70">Client Retention</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-[Playfair] font-light text-red-400/80">60%</span>
                <span className="text-[10px] font-[Inter] text-white/40">never return</span>
              </div>
            </div>
          </FloatingElement>

          {/* Bottom-left card */}
          <FloatingElement depth={1.8} className="bottom-[10%] left-[5%]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/10 rounded-xl p-4 shadow-lg rotate-[5deg] w-44">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-[Inter] font-medium text-white/70">Scattered Data</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="h-6 bg-white/5 rounded border border-white/10" />
                <div className="h-6 bg-white/5 rounded border border-white/10" />
                <div className="h-6 bg-white/5 rounded border border-white/10" />
              </div>
            </div>
          </FloatingElement>

          {/* Bottom-right card */}
          <FloatingElement depth={0.5} className="bottom-[8%] right-[3%]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/10 rounded-xl p-4 shadow-lg rotate-[-3deg] w-48">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-[Inter] font-medium text-white/70">Revenue Lost</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full w-full" />
              <div className="h-1.5 bg-red-500/25 rounded-full w-[60%] mt-1.5" />
              <div className="h-1.5 bg-red-500/15 rounded-full w-[35%] mt-1.5" />
            </div>
          </FloatingElement>

          {/* Mid-left small card */}
          <FloatingElement depth={2} className="top-[45%] left-[1%]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/15 rounded-lg p-3 shadow-lg rotate-[-8deg] w-36">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-purple-400/60" />
                <span className="text-[10px] font-[Inter] text-white/50">No Mobile App</span>
              </div>
            </div>
          </FloatingElement>

          {/* Mid-right small card */}
          <FloatingElement depth={1.5} className="top-[50%] right-[2%]">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/15 rounded-lg p-3 shadow-lg rotate-[7deg] w-40">
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-purple-400/60" />
                <span className="text-[10px] font-[Inter] text-white/50">Outdated CRMs</span>
              </div>
            </div>
          </FloatingElement>
        </Floating>

        {/* Center text */}
        <div className="relative z-20 max-w-3xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extralight leading-tight tracking-tight font-[Playfair] text-white/90"
          >
            The industry solved scheduling years ago.{' '}
            <span className="italic">Nobody</span> ever built a system to make your clients actually stay.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg md:text-xl font-[Inter] font-light text-white/50 tracking-wide"
          >
            We're here to change that.
          </motion.p>
        </div>
      </section>

      {/* Product Showcase - Phone + CRM */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16 md:mb-20"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-purple-400 font-semibold mb-4 flex items-center justify-center gap-2.5 font-[Inter]">
              <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
              The Platform
              <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            </div>
            <h2 className="font-[Playfair] text-[clamp(2rem,4.5vw,3.2rem)] font-normal leading-[1.15] mb-4 text-[#f0ecf9]">
              Two sides. <em className="italic text-purple-300">One</em> platform.
            </h2>
            <p className="text-[0.95rem] text-[#b8b0ce] max-w-[520px] mx-auto leading-[1.7] font-light font-[Inter]">
              Your customers browse and book through the app. You manage everything from the CRM.
            </p>
          </motion.div>

          {/* Visual composition */}
          <div className="relative flex items-center justify-center min-h-[400px] md:min-h-[500px] lg:min-h-[580px]">

            {/* CRM Dashboard - background, tilted */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative w-full max-w-4xl mx-auto"
            >
              {/* Label */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -top-8 left-4 md:left-8 z-20 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs font-medium text-white/60 font-[Inter] tracking-wide uppercase">For your business</span>
              </motion.div>

              <div className="relative rounded-xl overflow-hidden border border-purple-500/10 shadow-[0_20px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(147,108,255,0.08)]"
                style={{ transform: 'perspective(1200px) rotateX(2deg)' }}
              >
                {/* Subtle gradient overlay at edges */}
                <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <img
                  src="/screenshots/crm-desktop-1.png"
                  alt="Nyxie CRM Dashboard"
                  className="w-full h-auto block"
                />
              </div>
            </motion.div>

            {/* Phone - foreground, overlapping from right */}
            <motion.div
              initial={{ opacity: 0, y: 60, x: 30 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="absolute -bottom-12 -right-4 md:right-4 lg:right-12 z-20 w-[200px] md:w-[280px] lg:w-[340px]"
            >
              {/* Label */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -top-8 right-4 z-20 flex items-center gap-2"
              >
                <span className="text-xs font-medium text-white/60 font-[Inter] tracking-wide uppercase">For your clients</span>
                <div className="w-2 h-2 rounded-full bg-[#00EBFB]" />
              </motion.div>

              <img
                src="/screenshots/phone-app.png"
                alt="Nyxie Customer App"
                className="w-full h-auto block drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <FeaturesSection />

      <Pricing />

      {/* Footer */}
      <footer className="w-full pt-0 pb-0">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between px-6 md:px-10 py-12 max-w-7xl mx-auto">
          {/* Left - Logo & description */}
          <div className="flex flex-col items-start gap-5 max-w-xs mb-8 md:mb-0">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <img
                src="/logo.png"
                alt="Nyxie"
                className="h-8 w-auto brightness-0 invert"
              />
            </a>
            <p className="text-sm text-white/40 leading-relaxed font-[Inter]">
              AI-powered CRM for beauty & wellness. Streamline operations, retain clients, grow revenue.
            </p>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_28px_rgba(147,51,234,0.5)] transition-all font-[Inter]"
              >
                Get Started
              </motion.button>
            </div>
          </div>

          {/* Right - Minimal real links */}
          <div className="flex gap-16 md:gap-20">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-white/80 mb-1 font-[Inter]">Product</span>
              <button onClick={() => navigate('/login')} className="text-sm text-white/40 hover:text-white/70 transition-colors text-left font-[Inter]">Business CRM</button>
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors font-[Inter]">Mobile App</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-white/80 mb-1 font-[Inter]">Download</span>
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-2 font-[Inter]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </a>
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-2 font-[Inter]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Google Play
              </a>
            </div>
          </div>
        </div>

        {/* FlickeringGrid with brand text */}
        <div className="w-full h-48 md:h-64 relative mt-8 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black z-10 from-40%" />
          <div className="absolute inset-0 mx-6">
            <FlickeringGrid
              text="Nyxie"
              fontSize={120}
              fontWeight={300}
              className="h-full w-full"
              squareSize={2}
              gridGap={3}
              color="#a855f7"
              maxOpacity={0.3}
              flickerChance={0.1}
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="px-6 py-6 border-t border-purple-500/10">
          <p className="text-center text-xs text-white/25 font-[Inter]">
            &copy; 2025 Nyxie. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
