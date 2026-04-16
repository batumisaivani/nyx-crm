import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function RevenueCircle({ total = 0, earned = 0, projected = 0, prevEarned = 0, prevTotal = 0 }) {
  const earnedGrowth = prevEarned > 0 ? (((earned - prevEarned) / prevEarned) * 100).toFixed(1) : null
  const projectedGrowth = prevTotal > 0 ? ((((earned + projected) - prevTotal) / prevTotal) * 100).toFixed(1) : null

  const generateDots = (count, radius, cx, cy) => {
    const dots = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI
      dots.push({
        x: Math.round((cx + radius * Math.cos(angle)) * 1000) / 1000,
        y: Math.round((cy + radius * Math.sin(angle)) * 1000) / 1000,
      })
    }
    return dots
  }

  const outerDots = generateDots(48, 185, 203, 200)
  const innerDots = generateDots(36, 155, 203, 200)

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30, staggerChildren: 0.08, delayChildren: 0.1 },
    },
  }

  const dotVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 0.6, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  return (
    <motion.div
      className="w-full h-full"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={containerVariants}
    >
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden h-full" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div className="relative px-4 pb-4 pt-6 overflow-hidden h-full">

          {/* Dots visualisation */}
          <div className="relative w-full aspect-square mx-auto max-w-[20rem]">
            <svg className="w-full h-full" viewBox="0 0 448 448">
              {outerDots.map((d, i) => (
                <motion.circle key={`o${i}`} cx={d.x} cy={d.y} r="10" fill="#a855f7" variants={dotVariants} />
              ))}
              {innerDots.map((d, i) => (
                <motion.circle key={`i${i}`} cx={d.x} cy={d.y} r="10" fill="#7c3aed" variants={dotVariants} />
              ))}
            </svg>

            {/* Centre label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-16 -ml-6" style={{ zIndex: 20 }}>
              <div className="text-center">
                <motion.p
                  className="text-xs font-medium text-gray-800/40 tracking-[0.25em] uppercase mb-1.5"
                  initial={{ opacity: 0, y: -8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
                >
                  Revenue
                </motion.p>
                <motion.p
                  className="text-4xl font-bold text-gray-800 leading-none"
                  initial={{ opacity: 0, y: 16, scale: 0.85, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 28 }}
                >
                  {total.toLocaleString()}
                </motion.p>
                <motion.p
                  className="text-[11px] text-gray-800/25 mt-1"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.65 }}
                >
                  GEL this month
                </motion.p>
              </div>
            </div>
          </div>

          {/* Gradient fade — bottom half dissolves into card bg */}
          <div
            className="absolute -inset-4 pointer-events-none rounded-xl"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 35%, rgba(255,255,255,0.70) 46%, rgba(255,255,255,0.90) 56%, rgba(255,255,255,0.97) 66%)',
              zIndex: 5,
            }}
          />

          {/* Bottom stats + CTA */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 pt-4" style={{ zIndex: 10 }}>
            <div className="flex items-start justify-between mb-5">
              {/* Earned */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-0.5 h-4 rounded-full bg-purple-500"
                    initial={{ opacity: 0, scaleY: 0 }}
                    whileInView={{ opacity: 1, scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  />
                  <span className="text-sm font-medium text-gray-800/40">Earned</span>
                </div>
                <motion.p
                  className="text-xl font-bold text-gray-800"
                  initial={{ opacity: 0, y: -8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.55 }}
                >
                  {earned.toLocaleString()} <span className="text-sm font-normal text-gray-800/25">GEL</span>
                </motion.p>
                <motion.span
                  className="text-xs font-semibold text-purple-400"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.65 }}
                >
                  {earnedGrowth !== null ? `${earnedGrowth >= 0 ? '+' : ''}${earnedGrowth}%` : '—'}
                </motion.span>
              </div>

              {/* Projected */}
              <div className="space-y-1.5 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <motion.div
                    className="w-0.5 h-4 rounded-full bg-violet-600"
                    initial={{ opacity: 0, scaleY: 0 }}
                    whileInView={{ opacity: 1, scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, type: 'spring' }}
                  />
                  <span className="text-sm font-medium text-gray-800/40">Projected</span>
                </div>
                <motion.p
                  className="text-xl font-bold text-gray-800"
                  initial={{ opacity: 0, y: -8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                >
                  {projected.toLocaleString()} <span className="text-sm font-normal text-gray-800/25">GEL</span>
                </motion.p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.95 }}
            >
              <Link
                to="/reports"
                className="flex items-center justify-center w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 hover:text-gray-800 transition-all"
              >
                View Full Report
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
