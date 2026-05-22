import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { ModalOrigin } from './Header'

type Props = {
  label: string
  /** Viewport-space center of the link that opened this modal. We use it
   *  to anchor the open/close animations so the card grows out of that
   *  spot rather than zooming in from the background. */
  origin: ModalOrigin | null
  onClose: () => void
}

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

const QUESTIONS_EMAIL = 'sashaandcolinwedding@gmail.com'

const REGISTRY_URL = 'https://www.zola.com/registry/sashaandcolin2026'

type ScheduleDay = {
  date: string
  day: string
  title: string
  description: string
}

const SCHEDULE: ScheduleDay[] = [
  {
    date: 'Friday, September 4',
    day: 'Friday',
    title: 'Welcome Dinner',
    description: 'Kick things off with a relaxed dinner to greet family and friends.',
  },
  {
    date: 'Saturday, September 5',
    day: 'Saturday',
    title: 'Wedding',
    description: 'Ceremony followed by dinner, dancing, and a few surprises.',
  },
  {
    date: 'Sunday, September 6',
    day: 'Sunday',
    title: 'Goodbye Brunch',
    description: 'A casual send-off brunch before everyone heads home.',
  },
]

const CLOSE_ANIMATION_MS = 750

/**
 * Sparkles scatter across the card while it materializes. Positions are
 * percentages of the card's width/height, delays are in ms, sizes in px,
 * and `peak` is the maximum scale each sparkle reaches at its mid-flash.
 *
 * Hand-tuned (vs. randomized) so the constellation feels designed and
 * doesn't accidentally cluster around the title text on any open.
 */
type SparkleSpec = { x: number; y: number; delay: number; size: number; peak: number }
const SPARKLES: SparkleSpec[] = [
  { x: 14, y: 22, delay: 220, size: 11, peak: 1.4 },
  { x: 86, y: 18, delay: 100, size: 13, peak: 1.5 },
  { x: 28, y: 64, delay: 480, size: 7, peak: 1.0 },
  { x: 72, y: 76, delay: 380, size: 11, peak: 1.3 },
  { x: 52, y: 8, delay: 280, size: 9, peak: 1.2 },
  { x: 18, y: 88, delay: 620, size: 12, peak: 1.4 },
  { x: 92, y: 52, delay: 540, size: 8, peak: 1.1 },
  { x: 8, y: 46, delay: 760, size: 10, peak: 1.3 },
  { x: 62, y: 38, delay: 160, size: 8, peak: 1.2 },
  { x: 42, y: 92, delay: 660, size: 12, peak: 1.4 },
  { x: 80, y: 30, delay: 880, size: 7, peak: 1.0 },
  { x: 32, y: 14, delay: 1020, size: 9, peak: 1.2 },
]

/** Inline 4-point sparkle star. Drawn with concave sides so it reads as a
 *  classic "twinkle" rather than a rotating cross. */
const SPARKLE_PATH =
  'M12 1.5 L13.3 10.7 L22.5 12 L13.3 13.3 L12 22.5 L10.7 13.3 L1.5 12 L10.7 10.7 Z'

export function Modal({ label, origin, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [closing, setClosing] = useState(false)

  const requestClose = () => {
    setClosing((prev) => {
      if (prev) return prev
      window.setTimeout(onClose, CLOSE_ANIMATION_MS)
      return true
    })
  }

  useEffect(() => {
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Compute the offset from viewport center -> origin click point so the
  // card's grow animation can anchor at the clicked link. Memoized so a
  // window resize mid-animation doesn't shift the start position.
  const stageStyle = useMemo<CSSProperties>(() => {
    const targetX = window.innerWidth / 2
    const targetY = window.innerHeight / 2
    const safe = origin ?? { x: targetX, y: targetY }
    return {
      '--dx': `${safe.x - targetX}px`,
      '--dy': `${safe.y - targetY}px`,
    } as CSSProperties
  }, [origin])

  const isLookBook = label === 'Look Book'
  const cardClass = `modal-card${isLookBook ? ' modal-card--lookbook' : ''}${
    closing ? ' modal-card--closing' : ''
  }`
  const backdropClass = `modal-backdrop${closing ? ' modal-backdrop--closing' : ''}`

  return (
    <div className="modal-stage" style={stageStyle}>
      <div className={backdropClass} onClick={requestClose} aria-hidden="true" />
      <div
        className={cardClass}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {/* Sparkles flicker across the card as it materializes. Rendered
            first so they sit under the close button / content in source
            order but above them visually via z-index. */}
        {!closing && (
          <div className="modal-sparkles" aria-hidden="true">
            {SPARKLES.map((s, i) => (
              <span
                key={i}
                className="modal-sparkle"
                style={
                  {
                    '--x': `${s.x}%`,
                    '--y': `${s.y}%`,
                    '--delay': `${s.delay}ms`,
                    '--size': `${s.size}px`,
                    '--peak': s.peak,
                  } as CSSProperties
                }
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={SPARKLE_PATH} />
                </svg>
              </span>
            ))}
          </div>
        )}
        {/* Close button is intentionally a sibling of (not inside)
            `.modal-card__body` so it stays anchored to the card edge
            while the body scrolls. Previously it lived inside the
            scroll container and would slide up out of view on long
            modals (notably Schedule on phones), making the visible
            X-tap area land on whatever had scrolled into its place. */}
        <button
          ref={closeRef}
          type="button"
          className="modal-close"
          aria-label="Close"
          onClick={requestClose}
        >
          {/* Inline SVG X — drawn from a square viewBox so the visible
              mark sits at the exact geometric center of the button. The
              text glyph (`&times;`) in Cormorant Garamond renders low
              in its em box, which offset the visible × from the center
              of the hit target. */}
          <svg
            className="modal-close__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M6 6 L18 18 M18 6 L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="modal-card__body">
          {isLookBook ? (
            <img
              className="modal-lookbook-img"
              src="/assets/look-book.png"
              alt="Guest attire inspiration guide"
              draggable={false}
            />
          ) : (
            <>
              <h2 className="modal-title">{label}</h2>
              {label === 'Questions' ? (
                <div className="modal-content">
                  <p className="modal-lead">
                    Have a question about the wedding? We'd love to hear from you.
                  </p>
                  <div className="modal-contact">
                    <span className="modal-eyebrow">Email us</span>
                    <a className="modal-contact__link" href={`mailto:${QUESTIONS_EMAIL}`}>
                      {QUESTIONS_EMAIL}
                    </a>
                  </div>
                  <p className="modal-note">
                    We'll do our best to get back to you within a few days.
                  </p>
                </div>
              ) : label === 'Schedule' ? (
                <div className="modal-content">
                  <p className="modal-lead">
                    A weekend of celebration. More details to come closer to the date.
                  </p>
                  <ol className="modal-schedule">
                    {SCHEDULE.map((item) => (
                      <li key={item.date} className="modal-schedule__item">
                        <span className="modal-eyebrow">{item.date}</span>
                        <h3 className="modal-schedule__title">{item.title}</h3>
                        <p className="modal-schedule__description">{item.description}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : label === 'Registry' ? (
                <div className="modal-content">
                  <p className="modal-lead">
                    Your presence at our wedding is the greatest gift we could ask for.
                    If you would still like to contribute something, we would be incredibly
                    grateful for support toward our honeymoon adventures.
                  </p>
                  <a
                    className="modal-button"
                    href={REGISTRY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit our registry
                  </a>
                </div>
              ) : (
                <p className="modal-body">{LOREM}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
