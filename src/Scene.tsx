import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { ModalOrigin } from './Header'
import { Modal } from './Modal'

type Layer = {
  src: string
  alt: string
  magnitude: number
  backdrop?: boolean
  /** Extra bleed below the viewport, in vh, on top of the scene default. */
  dropVh?: number
  /**
   * Optional alternate source for desktop-class viewports (wide, hover-capable).
   * When present, rendered through a <picture> element so phones and tablets
   * keep using {@link Layer.src}.
   */
  wideSrc?: string
}

// Triggers the wide-aspect desktop variant. Phones (any orientation) and iPads
// (portrait or 4:3 landscape) fall through to the default src.
const WIDE_MEDIA = '(min-width: 1024px) and (min-aspect-ratio: 3/2)'

const LAYERS: Layer[] = [
  {
    src: '/assets/01-bg-house.png',
    wideSrc: '/assets/01-bg-house-wide.jpg',
    alt: '',
    magnitude: 0,
    backdrop: true,
  },
  { src: '/assets/02-arch.png', alt: '', magnitude: 14 },
  {
    src: '/assets/03-couple.png',
    wideSrc: '/assets/03-couple-wide.png',
    alt: 'Sasha and Colin',
    magnitude: 22,
  },
  { src: '/assets/04-puppy.png', alt: '', magnitude: 32, dropVh: 9 },
]

const STAGGER_MS = 120
const ENTRANCE_DELAY_MS = 150

type Props = {
  activeLink: string | null
  origin: ModalOrigin | null
  onClose: () => void
}

export function Scene({ activeLink, origin, onClose }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      stage.style.setProperty('--px', '0')
      stage.style.setProperty('--py', '0')
      return
    }

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let rafId = 0

    const tick = () => {
      const easing = 0.08
      currentX += (targetX - currentX) * easing
      currentY += (targetY - currentY) * easing
      stage.style.setProperty('--px', currentX.toFixed(4))
      stage.style.setProperty('--py', currentY.toFixed(4))
      rafId = window.requestAnimationFrame(tick)
    }
    rafId = window.requestAnimationFrame(tick)

    const handlePointerMove = (event: PointerEvent) => {
      const w = window.innerWidth
      const h = window.innerHeight
      targetX = (event.clientX / w) * 2 - 1
      targetY = (event.clientY / h) * 2 - 1
    }

    // Tilt parallax for phones / tablets. We capture the orientation of the
    // first event as the "neutral" pose so the effect is relative to however
    // the user is naturally holding the device, then map ±TILT_RANGE degrees
    // of deviation onto the same -1..1 range the cursor uses on desktop.
    const TILT_RANGE_DEG = 18
    let baselineBeta: number | null = null
    let baselineGamma: number | null = null

    const getScreenAngle = (): number => {
      const angle = window.screen?.orientation?.angle
      if (typeof angle === 'number') return angle
      // Safari iPad / older iOS fallback. window.orientation is -90 | 0 | 90 | 180.
      const legacy = (window as unknown as { orientation?: number }).orientation
      return typeof legacy === 'number' ? legacy : 0
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0 // left/right tilt, degrees
      const beta = event.beta ?? 0 // front/back tilt, degrees
      if (baselineBeta === null || baselineGamma === null) {
        baselineBeta = beta
        baselineGamma = gamma
        return
      }
      const dGamma = gamma - baselineGamma
      const dBeta = beta - baselineBeta

      // Re-map the raw axes based on how the screen is rotated so "tilt right"
      // always pushes the scene right regardless of portrait / landscape.
      let dx = dGamma
      let dy = dBeta
      const angle = getScreenAngle()
      if (angle === 90) {
        dx = dBeta
        dy = -dGamma
      } else if (angle === 180) {
        dx = -dGamma
        dy = -dBeta
      } else if (angle === -90 || angle === 270) {
        dx = -dBeta
        dy = dGamma
      }

      targetX = Math.max(-1, Math.min(1, dx / TILT_RANGE_DEG))
      targetY = Math.max(-1, Math.min(1, dy / TILT_RANGE_DEG))
    }

    const resetBaseline = () => {
      baselineBeta = null
      baselineGamma = null
    }

    const isTouch = window.matchMedia('(hover: none)').matches
    if (isTouch) {
      window.addEventListener('deviceorientation', handleOrientation)
      window.screen?.orientation?.addEventListener?.('change', resetBaseline)
      window.addEventListener('orientationchange', resetBaseline)
    } else {
      window.addEventListener('pointermove', handlePointerMove)
    }

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('deviceorientation', handleOrientation)
      window.screen?.orientation?.removeEventListener?.('change', resetBaseline)
      window.removeEventListener('orientationchange', resetBaseline)
    }
  }, [])

  return (
    <div ref={stageRef} className="scene" aria-label="Sasha and Colin wedding scene">
      {LAYERS.map((layer, index) => {
        const style = {
          '--mag': `${layer.magnitude}px`,
          '--delay': `${ENTRANCE_DELAY_MS + index * STAGGER_MS}ms`,
          '--drop': `${layer.dropVh ?? 0}vh`,
          zIndex: index + 1,
        } as CSSProperties
        return (
          <div
            key={layer.src}
            className={`layer${layer.backdrop ? ' layer--backdrop' : ''}`}
            style={style}
          >
            {layer.wideSrc ? (
              <picture>
                <source media={WIDE_MEDIA} srcSet={layer.wideSrc} />
                <img className="layer__img" src={layer.src} alt={layer.alt} draggable={false} />
              </picture>
            ) : (
              <img className="layer__img" src={layer.src} alt={layer.alt} draggable={false} />
            )}
          </div>
        )
      })}
      {activeLink && <Modal label={activeLink} origin={origin} onClose={onClose} />}
    </div>
  )
}
