import { useEffect, useRef } from 'react'
import './SparkleCursor.css'

/* Magical sparkle trail + click-burst cursor effect.
   ------------------------------------------------------------------
   - All particles are drawn into a single full-viewport <canvas>
     using a 'lighter' composite for a glowy bloom. One
     requestAnimationFrame loop owns the simulation so we never
     thrash React state.
   - On pointermove we emit small fairy-dust sparkles along the path
     the cursor just traveled (so trails stay continuous at speed).
   - On pointerdown we emit a fast outward burst of "spark" particles
     (with drag + gravity) plus extra lingering sparkles. Works for
     mouse clicks and finger taps alike via Pointer Events.
   - Skipped entirely for users with prefers-reduced-motion. The
     native cursor is never hidden. */

type ParticleKind = 'sparkle' | 'spark'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  rotation: number
  rotSpeed: number
  color: string
  kind: ParticleKind
}

// Wedding-palette tinted twinkles: warm gold, soft pink, lavender,
// pale aqua, cream. Chosen to read well on both the white intro
// screen and the darker scene/modal backdrops.
const SPARKLE_COLORS = [
  '#ffe27a',
  '#ffd166',
  '#ffb8d9',
  '#d4b8ff',
  '#a8e6ff',
  '#fff4c2',
]

export function SparkleCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    // Touch-only devices don't have a hovering cursor to trail off of, and
    // the click-burst alone isn't worth the cost of a perpetually running
    // canvas + RAF loop + per-frame shadowBlur draw on the GPUs in these
    // devices (the single most expensive 2D-canvas idiom we use). Skip the
    // effect entirely so phones and tablets don't pay that tax.
    //
    // `(hover: none) and (pointer: coarse)` is the conservative both-sides
    // check that targets true touchscreens and excludes things like hybrid
    // laptops where the user is still moving a real cursor.
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (isTouch) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    // Hard cap on simultaneous particles. The trail emitter is already
    // throttled, but a frantic mouse + a rapid-click burst can stack
    // hundreds at once. Cap so the per-frame work stays bounded — any
    // particle beyond this just gets dropped before it's created.
    const MAX_PARTICLES = 220
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = []
    const pointer = { x: -200, y: -200, lastX: -200, lastY: -200, seen: false }
    let lastEmit = 0
    let lastFrame: number | null = null
    let rafId: number | null = null

    const randColor = () =>
      SPARKLE_COLORS[(Math.random() * SPARKLE_COLORS.length) | 0]

    const emitSparkle = (x: number, y: number) => {
      if (particles.length >= MAX_PARTICLES) return
      const angle = Math.random() * Math.PI * 2
      const speed = 10 + Math.random() * 28
      particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        // Gentle upward bias so the trail feels like fairy dust.
        vy: Math.sin(angle) * speed - (18 + Math.random() * 14),
        life: 1,
        maxLife: 650 + Math.random() * 700,
        size: 1.6 + Math.random() * 3.2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 3,
        color: randColor(),
        kind: 'sparkle',
      })
    }

    const emitBurst = (x: number, y: number) => {
      const sparkCount = 22 + ((Math.random() * 10) | 0)
      for (let i = 0; i < sparkCount; i++) {
        if (particles.length >= MAX_PARTICLES) break
        const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.5
        const speed = 140 + Math.random() * 220
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 480 + Math.random() * 520,
          size: 1.8 + Math.random() * 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 10,
          color: randColor(),
          kind: 'spark',
        })
      }
      // Layer in slower drifting sparkles so the burst has both snap
      // and lingering shimmer.
      for (let i = 0; i < 14; i++) emitSparkle(x, y)
    }

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      if (!pointer.seen) {
        pointer.lastX = e.clientX
        pointer.lastY = e.clientY
        pointer.seen = true
      }
    }

    const onDown = (e: PointerEvent) => {
      // For touch taps, seed the pointer at the down location so the
      // burst doesn't draw a streak from a previous tap site.
      if (e.pointerType !== 'mouse') {
        pointer.x = e.clientX
        pointer.y = e.clientY
        pointer.lastX = e.clientX
        pointer.lastY = e.clientY
        pointer.seen = true
      }
      emitBurst(e.clientX, e.clientY)
    }

    const onUp = (e: PointerEvent) => {
      // When a finger lifts there's no more "cursor" to trail from, so
      // forget the position. The next tap will re-seed via onDown.
      if (e.pointerType !== 'mouse') {
        pointer.x = -200
        pointer.y = -200
        pointer.seen = false
      }
    }

    const onLeave = () => {
      pointer.x = -200
      pointer.y = -200
      pointer.seen = false
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('mouseleave', onLeave)

    // Draw a 4-point sparkle star centered at (0,0). The glow is
    // created via shadowBlur in the same color, which the canvas
    // 'lighter' blend mode turns into a soft bloom against any
    // background. ShadowBlur is the single most expensive 2D-canvas
    // operation per particle, so we cap the radius to a value that
    // still gives a soft halo on the largest sparkles without paying
    // for an enormous blur kernel on laptops with weak integrated GPUs.
    const MAX_SHADOW_BLUR = 12
    const drawSparkle = (
      x: number,
      y: number,
      r: number,
      color: string,
      alpha: number,
      rotation: number,
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = Math.min(MAX_SHADOW_BLUR, r * 3)
      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.lineTo(r * 0.28, -r * 0.28)
      ctx.lineTo(r, 0)
      ctx.lineTo(r * 0.28, r * 0.28)
      ctx.lineTo(0, r)
      ctx.lineTo(-r * 0.28, r * 0.28)
      ctx.lineTo(-r, 0)
      ctx.lineTo(-r * 0.28, -r * 0.28)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const tick = (now: number) => {
      if (lastFrame == null) lastFrame = now
      // Cap dt so a tab-switch doesn't fast-forward the simulation.
      const dt = Math.min(64, now - lastFrame)
      lastFrame = now
      const dts = dt / 1000

      // Sparkle trail: emit based on cursor velocity, with a small
      // throttle so a frantic mouse doesn't flood the system.
      if (pointer.seen && now - lastEmit > 14) {
        const dx = pointer.x - pointer.lastX
        const dy = pointer.y - pointer.lastY
        const dist = Math.hypot(dx, dy)
        if (dist > 2) {
          const count = Math.min(4, 1 + ((dist / 12) | 0))
          for (let i = 0; i < count; i++) {
            // Spread the emissions along the path the cursor just
            // traveled so the trail looks continuous at high speeds.
            const t = (i + 1) / (count + 1)
            emitSparkle(pointer.lastX + dx * t, pointer.lastY + dy * t)
          }
          lastEmit = now
        }
      }
      pointer.lastX = pointer.x
      pointer.lastY = pointer.y

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt / p.maxLife
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        p.x += p.vx * dts
        p.y += p.vy * dts
        p.rotation += p.rotSpeed * dts
        if (p.kind === 'spark') {
          // Sparks: snappy outward burst that decays with drag + gravity.
          p.vx *= 0.94
          p.vy *= 0.94
          p.vy += 260 * dts
        } else {
          // Sparkles: drift upward, slow horizontally — like falling
          // dust in reverse, the classic fairy-trail look.
          p.vy -= 8 * dts
          p.vx *= 0.985
        }
        const a = Math.max(0, p.life)
        const radius = p.size * (0.4 + 0.6 * a)
        drawSparkle(p.x, p.y, radius, p.color, a, p.rotation)
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="sparkle-cursor__canvas" aria-hidden="true" />
}
