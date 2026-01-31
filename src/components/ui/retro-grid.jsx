import { motion } from 'framer-motion'

export default function RetroGrid({ className = '', angle = 65 }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden opacity-50 ${className}`}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `rotateX(${angle}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Horizontal lines */}
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid-pattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <motion.path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(168, 85, 247, 0.4)"
                strokeWidth="1"
                animate={{
                  strokeOpacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>

        {/* Animated glow lines */}
        <motion.div
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          style={{ top: '20%' }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent"
          style={{ top: '50%' }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scaleX: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"
          style={{ top: '80%' }}
          animate={{
            opacity: [0.2, 0.7, 0.2],
            scaleX: [0.7, 1.3, 0.7],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-purple-950/20" />
    </div>
  )
}
