import { useEffect, useRef } from 'react'

export default function AuroraBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let t = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const orbs = [
      { x: 0.2, y: 0.3, r: 0.45, color: '139, 92, 246', speed: 0.0008 },   // violet
      { x: 0.7, y: 0.2, r: 0.40, color: '6, 182, 212', speed: 0.0006 },    // cyan
      { x: 0.5, y: 0.7, r: 0.50, color: '99, 102, 241', speed: 0.0005 },   // indigo
      { x: 0.85, y: 0.6, r: 0.35, color: '168, 85, 247', speed: 0.0009 },  // purple
      { x: 0.1, y: 0.8, r: 0.38, color: '34, 211, 238', speed: 0.0007 },   // sky
    ]

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Deep dark base
      ctx.fillStyle = '#05050f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      orbs.forEach((orb, i) => {
        const ox = (orb.x + Math.sin(t * orb.speed * 1000 + i) * 0.15) * canvas.width
        const oy = (orb.y + Math.cos(t * orb.speed * 800 + i * 2) * 0.12) * canvas.height
        const radius = orb.r * Math.min(canvas.width, canvas.height)

        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius)
        grad.addColorStop(0, `rgba(${orb.color}, 0.18)`)
        grad.addColorStop(0.5, `rgba(${orb.color}, 0.07)`)
        grad.addColorStop(1, `rgba(${orb.color}, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(ox, oy, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Subtle grid overlay
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'
      ctx.lineWidth = 1
      const gridSize = 60
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }

      // Noise grain overlay
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      // Skip heavy noise for perf — use CSS grain instead

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      {/* CSS grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          opacity: 0.5,
        }}
      />
    </>
  )
}
