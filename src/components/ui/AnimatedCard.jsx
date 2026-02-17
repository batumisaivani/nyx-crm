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
    <div style={{ perspective: 1500 }}>
      <Component
        className="relative"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ z: 10 }}
      >
        <div className="relative group">
          {/* Card glow effect */}
          <motion.div
            className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"
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
          <div className="absolute -inset-[1px] rounded-lg overflow-hidden pointer-events-none">
            {/* Top light beam */}
            <motion.div
              className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-purple-500 to-transparent"
              initial={{ filter: "blur(2px)" }}
              animate={{
                left: ["-50%", "100%"],
                opacity: [0.5, 1, 0.5],
                filter: ["blur(1px)", "blur(3px)", "blur(1px)"]
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
              className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-violet-500 to-transparent"
              initial={{ filter: "blur(2px)" }}
              animate={{
                top: ["-50%", "100%"],
                opacity: [0.5, 1, 0.5],
                filter: ["blur(1px)", "blur(3px)", "blur(1px)"]
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
              className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-purple-500 to-transparent"
              initial={{ filter: "blur(2px)" }}
              animate={{
                right: ["-50%", "100%"],
                opacity: [0.5, 1, 0.5],
                filter: ["blur(1px)", "blur(3px)", "blur(1px)"]
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
              className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-violet-500 to-transparent"
              initial={{ filter: "blur(2px)" }}
              animate={{
                bottom: ["-50%", "100%"],
                opacity: [0.5, 1, 0.5],
                filter: ["blur(1px)", "blur(3px)", "blur(1px)"]
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
              className="absolute top-0 left-0 h-[4px] w-[4px] rounded-full bg-purple-400/40 blur-[1px]"
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
              className="absolute top-0 right-0 h-[6px] w-[6px] rounded-full bg-violet-400/60 blur-[2px]"
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
              className="absolute bottom-0 right-0 h-[6px] w-[6px] rounded-full bg-purple-400/60 blur-[2px]"
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
              className="absolute bottom-0 left-0 h-[4px] w-[4px] rounded-full bg-violet-400/40 blur-[1px]"
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
          <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-purple-500/10 via-violet-500/20 to-purple-500/10 opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

          {/* Glass card background - tender, transparent */}
          <div className={`relative bg-gradient-to-r from-purple-900/15 to-violet-900/15 backdrop-blur-xl rounded-lg border border-purple-500/[0.08] shadow-2xl overflow-hidden ${className}`}>
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
