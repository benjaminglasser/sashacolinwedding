import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { ModalOrigin } from './Header'
import { Modal } from './Modal'

type Layer = {
  /** Base path stem in /assets, without extension (e.g. "02-arch"). We derive
   *  the actual urls from this so each entry stays compact. The PNG/JPG at
   *  `${stem}.${fallbackExt}` is the universal fallback, `${stem}.webp` is
   *  the desktop WebP, and `${stem}-sm.webp` is the phone-sized WebP. */
  stem: string
  /** Extension of the fallback raster (the original PNG/JPG that already lives
   *  on disk). WebP variants are always `.webp`. */
  fallbackExt: 'png' | 'jpg'
  alt: string
  magnitude: number
  backdrop?: boolean
  /** Extra bleed below the viewport, in vh, on top of the scene default. */
  dropVh?: number
  /**
   * Optional alternate stem for desktop-class viewports (wide, hover-capable).
   * When present, used as the source for the WIDE_MEDIA <source> tags so the
   * wide-framing crop is served on widescreen monitors and falls through to
   * the regular `stem` everywhere else.
   */
  wideStem?: string
  /** Fallback extension of the wide variant, if different from `fallbackExt`. */
  wideFallbackExt?: 'png' | 'jpg'
}

// Triggers the wide-aspect desktop variant. Phones (any orientation) and iPads
// (portrait or 4:3 landscape) fall through to the default src.
const WIDE_MEDIA = '(min-width: 1024px) and (min-aspect-ratio: 3/2)'
// Below this width we prefer the smaller WebP variant so phones and small
// tablets don't download the full-resolution scene art.
const SMALL_MEDIA = '(max-width: 900px)'

const LAYERS: Layer[] = [
  {
    stem: '01-bg-house',
    fallbackExt: 'png',
    wideStem: '01-bg-house-wide',
    wideFallbackExt: 'jpg',
    alt: '',
    magnitude: 0,
    backdrop: true,
  },
  { stem: '02-arch', fallbackExt: 'png', alt: '', magnitude: 14 },
  {
    stem: '03-couple',
    fallbackExt: 'png',
    wideStem: '03-couple-wide',
    wideFallbackExt: 'png',
    alt: 'Sasha and Colin',
    magnitude: 22,
  },
  { stem: '04-puppy', fallbackExt: 'png', alt: '', magnitude: 32, dropVh: 9 },
]

const STAGGER_MS = 550
const ENTRANCE_DELAY_MS = 200

type Props = {
  activeLink: string | null
  origin: ModalOrigin | null
  onClose: () => void
  /** Fired the moment the user initiates the modal close gesture (before the
   *  exit animation runs). Lets parent components react in parallel with the
   *  modal's own retreat (e.g. fading the header back in). */
  onClosingStart?: () => void
}

export function Scene({ activeLink, origin, onClose, onClosingStart }: Props) {
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
    // The baseline then slowly drifts toward the current pose (exponential
    // decay with BASELINE_RECENTER_TC_MS as the time constant) so however
    // the user ends up holding the phone becomes the new neutral within a
    // couple seconds. Quick tilts still produce parallax; only sustained
    // poses get absorbed into the baseline.
    const TILT_RANGE_DEG = 18
    const BASELINE_RECENTER_TC_MS = 2200
    let baselineBeta: number | null = null
    let baselineGamma: number | null = null
    let lastOrientationTime: number | null = null

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
      const now = performance.now()
      if (baselineBeta === null || baselineGamma === null) {
        baselineBeta = beta
        baselineGamma = gamma
        lastOrientationTime = now
        return
      }
      // Clamp dt so a backgrounded tab doesn't snap the baseline forward.
      const dt = lastOrientationTime === null ? 0 : Math.min(200, now - lastOrientationTime)
      lastOrientationTime = now
      const k = 1 - Math.exp(-dt / BASELINE_RECENTER_TC_MS)
      baselineBeta += (beta - baselineBeta) * k
      baselineGamma += (gamma - baselineGamma) * k

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
      lastOrientationTime = null
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
        const fallbackSrc = `/assets/${layer.stem}.${layer.fallbackExt}`
        // The backdrop is the LCP element; mark it eager + high priority so
        // it starts downloading immediately and the browser doesn't wait for
        // the rest of the scene to be parsed. The other layers can decode
        // async to keep the main thread free during the entrance animation.
        const isBackdrop = !!layer.backdrop
        return (
          <div
            key={layer.stem}
            className={`layer${isBackdrop ? ' layer--backdrop' : ''}`}
            style={style}
          >
            <picture>
              {layer.wideStem && (
                // Wide desktop framing: prefer WebP, fall back to the original
                // PNG/JPG for browsers without WebP support.
                <>
                  <source
                    media={WIDE_MEDIA}
                    type="image/webp"
                    srcSet={`/assets/${layer.wideStem}.webp`}
                  />
                  <source
                    media={WIDE_MEDIA}
                    srcSet={`/assets/${layer.wideStem}.${layer.wideFallbackExt ?? layer.fallbackExt}`}
                  />
                </>
              )}
              {/* Phones/small tablets: the trimmed -sm WebP, then the regular
                  WebP for everyone else who can decode WebP. */}
              <source
                media={SMALL_MEDIA}
                type="image/webp"
                srcSet={`/assets/${layer.stem}-sm.webp`}
              />
              <source type="image/webp" srcSet={`/assets/${layer.stem}.webp`} />
              <img
                className="layer__img"
                src={fallbackSrc}
                alt={layer.alt}
                draggable={false}
                decoding={isBackdrop ? 'sync' : 'async'}
                loading="eager"
                {...(isBackdrop ? { fetchPriority: 'high' as const } : {})}
              />
            </picture>
          </div>
        )
      })}
      {activeLink && (
        <Modal
          label={activeLink}
          origin={origin}
          onClose={onClose}
          onClosingStart={onClosingStart}
        />
      )}
    </div>
  )
}
