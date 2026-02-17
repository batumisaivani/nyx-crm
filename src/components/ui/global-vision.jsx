import { motion, AnimatePresence } from 'motion/react'
import { useState, useCallback } from 'react'

// Simplified dot-matrix world map coordinates (col, row) on a 72x36 grid
// Each dot represents ~5 degrees. Land masses only.
const WORLD_DOTS = [
  // North America
  [10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
  [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
  [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
  [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
  [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
  [10,14],[11,14],[12,14],[13,14],
  // Central America
  [11,15],[12,15],[11,16],[12,16],
  // South America
  [14,17],[15,17],[16,17],[17,17],
  [14,18],[15,18],[16,18],[17,18],[18,18],
  [14,19],[15,19],[16,19],[17,19],[18,19],
  [15,20],[16,20],[17,20],[18,20],
  [15,21],[16,21],[17,21],[18,21],
  [16,22],[17,22],[18,22],
  [16,23],[17,23],[18,23],
  [17,24],[18,24],
  [17,25],[18,25],
  [18,26],
  // Europe
  [33,7],[34,7],[35,7],[36,7],[37,7],
  [32,8],[33,8],[34,8],[35,8],[36,8],[37,8],[38,8],
  [31,9],[32,9],[33,9],[34,9],[35,9],[36,9],[37,9],[38,9],[39,9],
  [32,10],[33,10],[34,10],[35,10],[36,10],[37,10],[38,10],[39,10],
  [33,11],[34,11],[35,11],[36,11],[37,11],[38,11],
  [34,12],[35,12],[36,12],[37,12],
  // Africa
  [34,13],[35,13],[36,13],[37,13],[38,13],
  [34,14],[35,14],[36,14],[37,14],[38,14],[39,14],
  [34,15],[35,15],[36,15],[37,15],[38,15],[39,15],
  [34,16],[35,16],[36,16],[37,16],[38,16],[39,16],
  [35,17],[36,17],[37,17],[38,17],[39,17],
  [35,18],[36,18],[37,18],[38,18],[39,18],
  [36,19],[37,19],[38,19],
  [36,20],[37,20],[38,20],
  [37,21],[38,21],
  [37,22],
  // Middle East
  [39,11],[40,11],[41,11],
  [39,12],[40,12],[41,12],[42,12],
  [40,13],[41,13],[42,13],
  [41,14],[42,14],
  // Russia / Central Asia
  [40,7],[41,7],[42,7],[43,7],[44,7],[45,7],[46,7],[47,7],[48,7],[49,7],[50,7],[51,7],[52,7],
  [39,8],[40,8],[41,8],[42,8],[43,8],[44,8],[45,8],[46,8],[47,8],[48,8],[49,8],[50,8],[51,8],[52,8],[53,8],
  [40,9],[41,9],[42,9],[43,9],[44,9],[45,9],[46,9],[47,9],[48,9],[49,9],[50,9],[51,9],[52,9],[53,9],[54,9],
  [40,10],[41,10],[42,10],[43,10],[44,10],[45,10],[46,10],[47,10],
  // South / Southeast Asia
  [43,12],[44,12],[45,12],[46,12],[47,12],
  [43,13],[44,13],[45,13],[46,13],[47,13],[48,13],
  [44,14],[45,14],[46,14],[47,14],[48,14],
  [45,15],[46,15],[47,15],[48,15],
  [46,16],[47,16],[48,16],[49,16],
  [48,17],[49,17],[50,17],
  // Japan / Korea
  [53,10],[54,10],
  [53,11],[54,11],
  [54,12],
  // Australia
  [49,21],[50,21],[51,21],[52,21],[53,21],
  [49,22],[50,22],[51,22],[52,22],[53,22],[54,22],
  [50,23],[51,23],[52,23],[53,23],[54,23],
  [51,24],[52,24],[53,24],
  [52,25],
  // Indonesia
  [49,18],[50,18],[51,18],[52,18],
  [50,19],[51,19],[52,19],
]

// Georgia (Tbilisi) approximate position on our grid
const GEORGIA = { col: 40, row: 10 }

// Destination cities for animated arcs
const DESTINATIONS = [
  { col: 34, row: 9, label: 'Europe' },       // Central Europe
  { col: 41, row: 13, label: 'Middle East' },  // Middle East
  { col: 48, row: 16, label: 'SE Asia' },      // Southeast Asia
  { col: 12, row: 11, label: 'N. America' },   // North America
  { col: 16, row: 21, label: 'S. America' },   // South America
]

const GRID_SPACING = 10
const DOT_RADIUS = 1.6
const MAP_WIDTH = 72 * GRID_SPACING
const MAP_HEIGHT = 36 * GRID_SPACING

function generateArcPath(from, to) {
  const x1 = from.col * GRID_SPACING
  const y1 = from.row * GRID_SPACING
  const x2 = to.col * GRID_SPACING
  const y2 = to.row * GRID_SPACING

  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Control point above the midpoint for a nice arc
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2 - dist * 0.3

  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
}

function WorldDotMap() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Radial glow behind Georgia */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${(GEORGIA.col / 72) * 100}%`,
          top: `${(GEORGIA.row / 36) * 100}%`,
          width: '40%',
          height: '60%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(ellipse at center, rgba(147,51,234,0.15) 0%, transparent 70%)',
        }}
      />

      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-auto"
        aria-label="Dot matrix world map showing Nyxie's global expansion from Georgia"
      >
        <defs>
          {/* Glow filter for Georgia dot */}
          <filter id="georgiaGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow filter for destination dots */}
          <filter id="destGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for arc lines */}
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* All continent dots — single parent observer with staggered children */}
        <motion.g
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.002 } },
          }}
        >
          {WORLD_DOTS.filter(
            ([col, row]) => !(col === GEORGIA.col && row === GEORGIA.row)
          ).map(([col, row], i) => (
            <motion.circle
              key={`dot-${i}`}
              cx={col * GRID_SPACING}
              cy={row * GRID_SPACING}
              r={DOT_RADIUS}
              fill="#a855f7"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 0.25 },
              }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </motion.g>

        {/* Animated arcs from Georgia to destinations */}
        {DESTINATIONS.map((dest, i) => {
          const path = generateArcPath(GEORGIA, dest)
          return (
            <g key={`arc-${i}`}>
              {/* Arc path (drawn on scroll) */}
              <motion.path
                d={path}
                fill="none"
                stroke="url(#arcGrad)"
                strokeWidth="1.2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5 + i * 0.2, ease: 'easeOut' }}
              />

              {/* Traveling pulse along the arc */}
              <motion.circle
                r="2"
                fill="#c084fc"
                filter="url(#destGlow)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: [0, 1, 1, 0] }}
                viewport={{ once: true }}
                transition={{
                  duration: 3,
                  delay: 1.5 + i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <animateMotion
                  dur={`${3}s`}
                  repeatCount="indefinite"
                  begin={`${1.5 + i * 0.2}s`}
                  path={path}
                />
              </motion.circle>

              {/* Destination dot (lights up) */}
              <motion.circle
                cx={dest.col * GRID_SPACING}
                cy={dest.row * GRID_SPACING}
                r="3"
                fill="#c084fc"
                filter="url(#destGlow)"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 0.9, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.8 + i * 0.2 }}
              />
            </g>
          )
        })}

        {/* Georgia focal point */}
        <motion.circle
          cx={GEORGIA.col * GRID_SPACING}
          cy={GEORGIA.row * GRID_SPACING}
          r="5"
          fill="#a855f7"
          filter="url(#georgiaGlow)"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
        {/* Pulsing ring around Georgia */}
        <motion.circle
          cx={GEORGIA.col * GRID_SPACING}
          cy={GEORGIA.row * GRID_SPACING}
          r="5"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: [0, 0.6, 0], scale: [1, 2.5, 2.5] }}
          viewport={{ once: true }}
          transition={{
            duration: 2.5,
            delay: 0.6,
            repeat: Infinity,
          }}
        />
      </svg>
    </div>
  )
}

// --- Gamified Discount Spinner ---

const PRIZES = [
  { label: '5%', full: '5% Off next visit', color: '#7c3aed' },
  { label: '2x', full: '2x NyxCoins bonus', color: '#5b21b6' },
  { label: '15%', full: '15% Off any service', color: '#7c3aed' },
  { label: 'RETRY', full: 'Spin again!', color: '#5b21b6' },
  { label: '10%', full: '10% Off next visit', color: '#7c3aed' },
  { label: 'FREE', full: 'Free add-on service', color: '#5b21b6' },
  { label: '20%', full: '20% Off any service', color: '#7c3aed' },
  { label: '5%', full: '5% Off next visit', color: '#5b21b6' },
]

const SEG_COUNT = PRIZES.length
const SEG_ANGLE = 360 / SEG_COUNT

function segPath(i) {
  const a1 = ((i * SEG_ANGLE - 90) * Math.PI) / 180
  const a2 = (((i + 1) * SEG_ANGLE - 90) * Math.PI) / 180
  const r = 48, cx = 50, cy = 50
  return `M${cx},${cy} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r} 0 0,1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} Z`
}

function textPos(i) {
  const mid = (((i + 0.5) * SEG_ANGLE - 90) * Math.PI) / 180
  const r = 34
  return { x: 50 + r * Math.cos(mid), y: 50 + r * Math.sin(mid), angle: (i + 0.5) * SEG_ANGLE }
}

function SpinnerWheel() {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)

  const spin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setResult(null)

    const extraSpins = (5 + Math.random() * 3) * 360
    const offset = Math.random() * 360
    const newRotation = rotation + extraSpins + offset
    setRotation(newRotation)

    setTimeout(() => {
      const final = newRotation % 360
      const idx = Math.floor(((360 - final) % 360) / SEG_ANGLE) % SEG_COUNT
      setResult(PRIZES[idx])
      setSpinning(false)
    }, 4000)
  }, [spinning, rotation])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-square max-w-[190px]">
        {/* Pointer triangle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-20">
          <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[12px] border-l-transparent border-r-transparent border-t-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
        </div>

        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(147,51,234,0.15)]" />

        {/* Wheel SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
          }}
        >
          {/* Outer border */}
          <circle cx="50" cy="50" r="49.5" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.3" />
          <circle cx="50" cy="50" r="48" fill="none" stroke="#a855f7" strokeWidth="0.15" opacity="0.2" />

          {/* Segments */}
          {PRIZES.map((seg, i) => (
            <g key={i}>
              <path d={segPath(i)} fill={seg.color} stroke="#1a1025" strokeWidth="0.3" />
              <text
                x={textPos(i).x}
                y={textPos(i).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="5"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
                opacity="0.9"
                transform={`rotate(${textPos(i).angle}, ${textPos(i).x}, ${textPos(i).y})`}
              >
                {seg.label}
              </text>
            </g>
          ))}

          {/* Tick marks on outer edge */}
          {PRIZES.map((_, i) => {
            const angle = ((i * SEG_ANGLE - 90) * Math.PI) / 180
            const r1 = 47.5, r2 = 49
            return (
              <line
                key={`tick-${i}`}
                x1={50 + r1 * Math.cos(angle)}
                y1={50 + r1 * Math.sin(angle)}
                x2={50 + r2 * Math.cos(angle)}
                y2={50 + r2 * Math.sin(angle)}
                stroke="#c084fc"
                strokeWidth="0.3"
                opacity="0.4"
              />
            )
          })}

          {/* Center hub */}
          <circle cx="50" cy="50" r="11" fill="#1a1025" stroke="#a855f7" strokeWidth="0.4" opacity="0.8" />
          <circle cx="50" cy="50" r="10" fill="url(#hubGrad)" />

          <defs>
            <radialGradient id="hubGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#2d1b4e" />
              <stop offset="100%" stopColor="#1a1025" />
            </radialGradient>
          </defs>
        </svg>

        {/* SPIN button overlay */}
        <button
          onClick={spin}
          disabled={spinning}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22%] h-[22%] rounded-full flex items-center justify-center cursor-pointer z-10 group"
        >
          <span
            className={`text-[10px] font-[Inter] font-bold uppercase tracking-wider transition-colors ${
              spinning ? 'text-purple-600 animate-pulse' : 'text-purple-300 group-hover:text-white'
            }`}
          >
            {spinning ? '...' : 'SPIN'}
          </span>
        </button>
      </div>

      {/* Result display */}
      <div className="h-6 mt-2 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {result && !spinning && (
            <motion.p
              key={result.full}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-purple-300 font-[Inter]"
            >
              {result.full}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-[#7d7694] font-[Inter] font-medium tracking-wide">
        Spin for a reward
      </p>
    </div>
  )
}

const roadmapPhases = [
  {
    phase: 'Georgia',
    description: 'Launching in Tbilisi with beauty & wellness facilities across the country.',
    status: 'Live',
    statusColor: 'bg-emerald-500',
  },
  {
    phase: 'Regional',
    description: 'Expanding across the Caucasus and into key European & Middle Eastern markets.',
    status: '2025',
    statusColor: 'bg-purple-500',
  },
  {
    phase: 'Global',
    description: 'A universal booking & loyalty platform available wherever wellness lives.',
    status: 'Vision',
    statusColor: 'bg-white/30',
  },
]

function RoadmapTimeline() {
  return (
    <div className="relative max-w-4xl mx-auto mt-20">
      {/* Connecting line (desktop) */}
      <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 z-0">
        <div className="w-full h-full bg-gradient-to-r from-purple-500/30 via-purple-500/20 to-purple-500/5" />
        {/* Traveling pulse on the line */}
        <motion.div
          className="absolute top-0 h-px w-24 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
          initial={{ left: '-10%' }}
          whileInView={{
            left: ['0%', '100%'],
          }}
          viewport={{ once: true }}
          transition={{
            duration: 3,
            delay: 0.8,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'linear',
          }}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {roadmapPhases.map((item, index) => (
          <motion.div
            key={item.phase}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
            className="bg-white/5 backdrop-blur-sm border border-purple-500/10 rounded-2xl p-6 hover:border-purple-500/25 transition-colors duration-300"
          >
            {/* Status badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-[Playfair] text-[#f0ecf9]">
                {item.phase}
              </span>
              <span className={`text-[10px] font-[Inter] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${item.statusColor} text-white`}>
                {item.status}
              </span>
            </div>
            <p className="text-sm text-[#b8b0ce] leading-relaxed font-[Inter] font-light">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function GlobalVisionSection() {
  return (
    <section className="relative py-24 md:py-32 px-6">
      {/* Ambient purple gradients — no clipping, feathers into adjacent sections */}
      <div aria-hidden="true" className="absolute -inset-[250px] pointer-events-none">
        {/* === TOP LAYER — feathers into Features === */}
        <div className="absolute top-[2%] left-[5%] w-[700px] h-[700px] rounded-full bg-purple-600/[0.14] blur-[200px]" />
        <div className="absolute top-[0%] right-[0%] w-[600px] h-[600px] rounded-full bg-violet-500/[0.12] blur-[180px]" />
        <div className="absolute top-[6%] left-[40%] w-[400px] h-[400px] rounded-full bg-purple-500/[0.08] blur-[150px]" />

        {/* === UPPER-MID — around the header text === */}
        <div className="absolute top-[14%] -left-[8%] w-[500px] h-[350px] rounded-full bg-fuchsia-600/[0.1] blur-[160px]" />
        <div className="absolute top-[16%] right-[5%] w-[450px] h-[300px] rounded-full bg-violet-400/[0.1] blur-[140px]" />
        <div className="absolute top-[18%] left-[25%] w-[350px] h-[350px] rounded-full bg-purple-400/[0.06] blur-[120px]" />

        {/* === CENTER — the map area, rich but diffuse === */}
        <div className="absolute top-[28%] left-[10%] w-[800px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[220px]" />
        <div className="absolute top-[32%] -left-[5%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.16] blur-[170px]" />
        <div className="absolute top-[30%] -right-[5%] w-[500px] h-[450px] rounded-full bg-purple-600/[0.14] blur-[160px]" />
        <div className="absolute top-[35%] left-[45%] w-[300px] h-[300px] rounded-full bg-fuchsia-500/[0.07] blur-[130px]" />

        {/* === ACCENTS — smaller pops of color around the widgets === */}
        <div className="absolute top-[45%] left-[3%] w-[300px] h-[300px] rounded-full bg-purple-400/[0.12] blur-[110px]" />
        <div className="absolute top-[42%] right-[3%] w-[280px] h-[280px] rounded-full bg-violet-400/[0.1] blur-[100px]" />
        <div className="absolute top-[50%] left-[20%] w-[200px] h-[200px] rounded-full bg-fuchsia-400/[0.08] blur-[80px]" />
        <div className="absolute top-[48%] right-[18%] w-[220px] h-[220px] rounded-full bg-purple-300/[0.06] blur-[90px]" />
        <div className="absolute top-[38%] left-[50%] w-[180px] h-[180px] rounded-full bg-indigo-400/[0.07] blur-[80px]" />

        {/* === LOWER-MID — transition to roadmap === */}
        <div className="absolute top-[58%] -left-[3%] w-[450px] h-[400px] rounded-full bg-violet-500/[0.12] blur-[150px]" />
        <div className="absolute top-[60%] right-[10%] w-[400px] h-[350px] rounded-full bg-purple-500/[0.1] blur-[140px]" />
        <div className="absolute top-[62%] left-[30%] w-[350px] h-[300px] rounded-full bg-fuchsia-600/[0.06] blur-[130px]" />

        {/* === BOTTOM LAYER — roadmap cards + feather into Pricing === */}
        <div className="absolute bottom-[12%] -left-[8%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.12] blur-[180px]" />
        <div className="absolute bottom-[8%] left-[25%] w-[500px] h-[400px] rounded-full bg-purple-600/[0.1] blur-[160px]" />
        <div className="absolute bottom-[5%] right-[15%] w-[400px] h-[350px] rounded-full bg-violet-500/[0.08] blur-[140px]" />
        <div className="absolute bottom-[0%] -right-[10%] w-[650px] h-[650px] rounded-full bg-purple-500/[0.12] blur-[200px]" />
        <div className="absolute bottom-[2%] left-[50%] w-[300px] h-[300px] rounded-full bg-fuchsia-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] tracking-[0.3em] uppercase text-purple-400 font-semibold mb-4 flex items-center justify-center gap-2.5 font-[Inter]">
            <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            Global Vision
            <span className="w-[30px] h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          </div>
          <h2 className="font-[Playfair] text-[clamp(2rem,4.5vw,3.2rem)] font-normal leading-[1.15] mb-4 text-[#f0ecf9]">
            Born in Georgia. Built for the <em className="italic text-purple-300">world.</em>
          </h2>
          <p className="text-[0.95rem] text-[#b8b0ce] max-w-[520px] mx-auto leading-[1.7] font-light font-[Inter]">
            One platform to book, reward, and retain — wherever wellness lives.
          </p>
        </motion.div>

        {/* Map + Loyalty card */}
        <div className="relative">
          {/* Dot-matrix world map */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <WorldDotMap />
          </motion.div>

          {/* Floating spinner — anchored bottom-left of the map */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: -3 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="hidden md:block absolute -bottom-8 -left-4 lg:left-4 z-10 w-[220px] lg:w-[250px]"
          >
            <div className="bg-white/[0.03] backdrop-blur-sm border border-purple-500/10 rounded-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_60px_rgba(147,51,234,0.08)]">
              <SpinnerWheel />
            </div>
          </motion.div>

          {/* Floating loyalty card — anchored bottom-right of the map */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: 3 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="hidden md:block absolute -bottom-8 -right-4 lg:right-4 z-10 w-[220px] lg:w-[260px]"
          >
            <div className="relative group">
              <img
                src="/loyalty-card.png"
                alt="Nyxie Gold loyalty card — gamified rewards that travel with you"
                className="w-full h-auto rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_60px_rgba(147,51,234,0.12)] border border-purple-500/15"
              />
              <div className="mt-3 text-center">
                <p className="text-[11px] text-[#7d7694] font-[Inter] font-medium tracking-wide">
                  Gamified loyalty — everywhere.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Mobile: spinner + loyalty card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="md:hidden mt-10 grid grid-cols-2 gap-5 max-w-sm mx-auto items-start"
          >
            {/* Spinner */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-purple-500/10 rounded-2xl p-4">
              <SpinnerWheel />
            </div>
            {/* Loyalty card */}
            <div className="flex flex-col items-center pt-2">
              <img
                src="/loyalty-card.png"
                alt="Nyxie Gold loyalty card"
                className="w-full h-auto rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_60px_rgba(147,51,234,0.12)] border border-purple-500/15 rotate-2"
              />
              <p className="mt-3 text-[11px] text-[#7d7694] font-[Inter] font-medium tracking-wide">
                Gamified loyalty
              </p>
            </div>
          </motion.div>
        </div>

        {/* Roadmap timeline */}
        <RoadmapTimeline />
      </div>
    </section>
  )
}
