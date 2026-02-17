import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function parseColor(cssColor) {
  if (typeof window === 'undefined') return { r: 180, g: 180, b: 180 }
  try {
    const el = document.createElement('div')
    el.style.color = cssColor
    document.body.appendChild(el)
    const computed = window.getComputedStyle(el).color
    document.body.removeChild(el)
    const match = computed.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (match) return { r: +match[1], g: +match[2], b: +match[3] }
  } catch {}
  return { r: 180, g: 180, b: 180 }
}

export function FlickeringGrid({
  squareSize = 3,
  gridGap = 3,
  flickerChance = 0.2,
  color = '#B4B4B4',
  width,
  height,
  className = '',
  maxOpacity = 0.15,
  text = '',
  fontSize = 140,
  fontWeight = 600,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isInView, setIsInView] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const parsedColor = useMemo(() => parseColor(color), [color])

  const setupCanvas = useCallback(
    (canvas, w, h) => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const cols = Math.ceil(w / (squareSize + gridGap))
      const rows = Math.ceil(h / (squareSize + gridGap))
      const squares = new Float32Array(cols * rows)
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity
      }
      return { cols, rows, squares, dpr }
    },
    [squareSize, gridGap, maxOpacity]
  )

  const drawGrid = useCallback(
    (ctx, w, h, cols, rows, squares, dpr) => {
      ctx.clearRect(0, 0, w, h)

      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = w
      maskCanvas.height = h
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })
      if (!maskCtx) return

      if (text) {
        maskCtx.save()
        maskCtx.scale(dpr, dpr)
        maskCtx.fillStyle = 'white'
        maskCtx.font = `${fontWeight} ${fontSize}px "Playfair Display", "Playfair", Georgia, serif`
        maskCtx.textAlign = 'center'
        maskCtx.textBaseline = 'middle'
        maskCtx.fillText(text, w / (2 * dpr), h / (2 * dpr))
        maskCtx.restore()
      }

      const { r, g, b } = parsedColor
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (squareSize + gridGap) * dpr
          const y = j * (squareSize + gridGap) * dpr
          const sw = squareSize * dpr
          const sh = squareSize * dpr

          const maskData = maskCtx.getImageData(x, y, sw, sh).data
          const hasText = maskData.some((value, index) => index % 4 === 0 && value > 0)

          const opacity = squares[i * rows + j]
          const finalOpacity = hasText ? Math.min(1, opacity * 3 + 0.4) : opacity

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`
          ctx.fillRect(x, y, sw, sh)
        }
      }
    },
    [parsedColor, squareSize, gridGap, text, fontSize, fontWeight]
  )

  const updateSquares = useCallback(
    (squares, deltaTime) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity
        }
      }
    },
    [flickerChance, maxOpacity]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let gridParams

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth
      const newHeight = height || container.clientHeight
      setCanvasSize({ width: newWidth, height: newHeight })
      gridParams = setupCanvas(canvas, newWidth, newHeight)
    }

    updateCanvasSize()

    let lastTime = 0
    const animate = (time) => {
      if (!isInView) return
      const deltaTime = (time - lastTime) / 1000
      lastTime = time
      updateSquares(gridParams.squares, deltaTime)
      drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr)
      animationFrameId = requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(() => updateCanvasSize())
    resizeObserver.observe(container)

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 }
    )
    intersectionObserver.observe(canvas)

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView])

  return (
    <div ref={containerRef} className={`h-full w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  )
}
