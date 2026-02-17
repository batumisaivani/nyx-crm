import { cn } from '../../lib/utils'
import { motion } from 'motion/react'

export function BorderTrail({
  className,
  size = 60,
  duration = 10,
  delay = 0,
  style,
  ...props
}) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
      <motion.div
        className={cn(
          'absolute aspect-square rounded-full',
          className
        )}
        style={{
          width: size,
          ...style,
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: 'linear',
        }}
        {...props}
      />
    </div>
  )
}
