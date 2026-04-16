import { motion, useMotionValue, useTransform } from 'motion/react'

export default function AnimatedCard({ children, className = '', as = 'div' }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-150, 150], [5, -5])
  const rotateY = useTransform(mouseX, [-150, 150], [-5, 5])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const Component = motion[as] || motion.div

  return (
    <div style={{ perspective: 1500 }} className="h-full">
      <Component
        className="relative h-full"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ z: 10 }}
      >
        <div className="relative group h-full">

          {/* Glass card background - tender, transparent */}
          <div className={`relative bg-white/50 backdrop-blur-sm rounded-lg overflow-hidden ${className}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {/* Subtle card inner patterns */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                backgroundSize: '30px 30px'
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      </Component>
    </div>
  )
}
