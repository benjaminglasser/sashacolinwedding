import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
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
  onClose: () => void
}

export function Scene({ activeLink, onClose }: Props) {
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

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0
      const beta = event.beta ?? 0
      targetX = Math.max(-1, Math.min(1, gamma / 30))
      targetY = Math.max(-1, Math.min(1, (beta - 45) / 30))
    }

    const isTouch = window.matchMedia('(hover: none)').matches
    if (isTouch) {
      window.addEventListener('deviceorientation', handleOrientation)
    } else {
      window.addEventListener('pointermove', handlePointerMove)
    }

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('deviceorientation', handleOrientation)
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
      {activeLink && <Modal label={activeLink} onClose={onClose} />}
    </div>
  )
}
