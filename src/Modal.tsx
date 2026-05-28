import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import type { ModalOrigin } from './Header'

type Props = {
  label: string
  /** Viewport-space center of the link that opened this modal. We use it
   *  to anchor the open/close animations so the card grows out of that
   *  spot rather than zooming in from the background. */
  origin: ModalOrigin | null
  onClose: () => void
  /** Optional notify-on-close-start hook. Fires the instant the user requests
   *  close (Esc / backdrop / X), before the exit animation runs. Lets the
   *  parent app start animations that should overlap with the modal retreat. */
  onClosingStart?: () => void
}

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

const QUESTIONS_EMAIL = 'sashaandcolinwedding@gmail.com'

const REGISTRY_URL = 'https://www.zola.com/registry/sashaandcolin2026'

const HILTON_BLOCK_URL = 'https://group.hiltongardeninn.com/tljzn3'

type Stay = {
  eyebrow: string
  title: string
  venue: string
  address: string
  phone?: { display: string; href: string }
  description: string
  cta?: { label: string; href: string }
  note?: string
}

const STAYS: Stay[] = [
  {
    eyebrow: 'Two or more nights',
    title: 'Wedding Room Block',
    venue: 'Hilton Garden Inn Dana Point — Doheny Beach',
    address: '34402 Pacific Coast Highway, Dana Point, CA',
    description:
      'We have reserved a block of rooms under "Pitt-Glasser Wedding." Use the link below to book at the group rate.',
    cta: { label: 'Book the wedding block', href: HILTON_BLOCK_URL },
    note: 'Please book by August 1, 2026 — the block closes after that date.',
  },
  {
    eyebrow: 'One night — wedding eve',
    title: 'For Sunday Brunch Stay-Overs',
    venue: 'Hampton Inn and Suites Mission Viejo',
    address: '28682 Marguerite Pkwy, Mission Viejo, CA 92692',
    phone: { display: '(949) 429-5222', href: 'tel:+19494295222' },
    description:
      'If you are only joining us for the wedding eve but plan to stay over for the Sunday brunch and pool party, we recommend this hotel.',
    note:
      'Please let us know if you would like to stay here. If enough guests are interested, we can set up a wedding room block.',
  },
]

type ScheduleEvent = {
  time: string
  description: string
}

type ScheduleDay = {
  date: string
  day: string
  title: string
  venue: string
  address: string
  events: ScheduleEvent[]
  notes?: string[]
}

const SCHEDULE: ScheduleDay[] = [
  {
    date: 'Friday, September 4, 2026',
    day: 'Friday',
    title: 'Welcome Dinner',
    venue: 'El Adobe',
    address: '31891 Camino Capistrano, San Juan Capistrano, CA 92675',
    events: [
      {
        time: '6:30 pm',
        description: 'Welcome dinner at El Adobe.',
      },
    ],
    notes: [
      'For those traveling from afar and staying two nights, The Hilton Garden Inn Dana Point — Doheny Beach has arranged a wedding block. At 6 pm, a bus will take guests who would like to join us to dinner in the old town of San Juan Capistrano. After dinner, you may take the bus back to the hotel, or wander down historic Los Rios Street or the newly built outdoor River Street Marketplace for further drinks or dessert.',
      'Parking at El Adobe is tight — there is a garage at the SJC train station, roughly a 4-minute walk to the restaurant.',
    ],
  },
  {
    date: 'Saturday, September 5, 2026',
    day: 'Saturday',
    title: 'The Wedding',
    venue: "Robin and Bob's Home",
    address: '31515 Paseo Christina, San Juan Capistrano, CA 92675',
    events: [
      {
        time: '5:00 pm',
        description: "Arrival — drinks and hors d'oeuvres in the house and at the outdoor bar.",
      },
      {
        time: '6:30 pm',
        description: 'The wedding ceremony begins.',
      },
      {
        time: '7:30 pm',
        description: 'Dinner is served.',
      },
      {
        time: '10:00 pm',
        description: 'Last call for valet. Feel free to stay longer and walk to your car.',
      },
    ],
    notes: [
      'There is no shuttle from the hotel to the wedding, but valet will be available when you arrive.',
    ],
  },
  {
    date: 'Sunday, September 6, 2026',
    day: 'Sunday',
    title: 'Farewell Brunch & Pool Party',
    venue: "Robin and Bob's Home",
    address: '31515 Paseo Christina, San Juan Capistrano, CA 92675',
    events: [
      {
        time: '11:00 am',
        description: 'Casual buffet brunch — relax by the pool.',
      },
    ],
  },
]

type Activity = {
  title: string
  description?: string
  link?: { label: string; href: string }
}

type ActivityGroup = {
  heading: string
  activities: Activity[]
}

const ACTIVITIES: ActivityGroup[] = [
  {
    heading: 'Beaches',
    activities: [
      {
        title: 'Dana Point Beach',
        description:
          "A 4-minute walk from the Hilton Garden Inn. Not the best beach in Orange County, but it's close and easy to lie by the ocean.",
      },
      {
        title: 'Laguna Beach',
        description:
          "For the ocean or a stroll around the town's restaurants and shops — better beaches, too, and better shopping.",
        link: { label: 'Visit Laguna Beach', href: 'https://www.visitlagunabeach.com/' },
      },
    ],
  },
  {
    heading: 'Food & Drink',
    activities: [
      {
        title: 'Brunch at the Historic Ramos House Cafe',
        description: 'Beloved spot tucked onto Los Rios Street for a leisurely brunch.',
        link: { label: 'Ramos House Cafe', href: 'https://www.ramoshouse.com/' },
      },
      {
        title: 'The Tea House on Los Rios',
        description: 'A charming garden tea house just down the lane.',
        link: {
          label: 'The Tea House on Los Rios',
          href: 'https://theteahouseonlosrios.com/',
        },
      },
      {
        title: 'Lunch in San Juan Capistrano',
        description:
          'River Street Marketplace and the old town both have plenty of options for a casual lunch.',
        link: { label: 'River Street Marketplace', href: 'https://www.riverstreetsjc.com/' },
      },
    ],
  },
  {
    heading: 'Sights',
    activities: [
      {
        title: 'River Street Ranch Petting Zoo',
        description:
          'Visit the newly renovated petting zoo at the River Street Marketplace.',
        link: { label: 'River Street Ranch', href: 'https://riverstreetranch.com/' },
      },
      {
        title: 'Mission San Juan Capistrano',
        description: 'The oldest mission in California, and a short walk from the old town.',
        link: {
          label: 'Mission San Juan Capistrano',
          href: 'https://www.missionsjc.com/',
        },
      },
    ],
  },
  {
    heading: 'Shopping',
    activities: [
      {
        title: "Ortega's Capistrano Trading Post",
        description: 'Souvenirs and gifts in the heart of the old town.',
        link: {
          label: "Ortega's Trading Post",
          href: 'https://www.yelp.com/biz/ortegas-capistrano-trading-post-san-juan-capistrano',
        },
      },
      {
        title: 'The Old Barn Antique Mall',
        description: 'If you like antiquing, this is the place.',
        link: {
          label: 'The Old Barn Antique Mall',
          href: 'https://www.facebook.com/Theoldbarnantiquemall/',
        },
      },
    ],
  },
]

const CLOSE_ANIMATION_MS = 750

/**
 * Sparkles scatter across the card while it materializes. Positions are
 * percentages of the card's width/height, delays are in ms, sizes in px,
 * and `peak` is the maximum scale each sparkle reaches at its mid-flash.
 *
 * Hand-tuned (vs. randomized) so the constellation feels designed and
 * doesn't accidentally cluster around the title text on any open. The
 * first six entries cover the corners + midpoints; we serve only those
 * on small viewports (where each `drop-shadow`-filtered span is a real
 * per-frame cost on mobile GPUs) and the full twelve on desktop.
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
const SPARKLES_MOBILE_COUNT = 6

/** Inline 4-point sparkle star. Drawn with concave sides so it reads as a
 *  classic "twinkle" rather than a rotating cross. */
const SPARKLE_PATH =
  'M12 1.5 L13.3 10.7 L22.5 12 L13.3 13.3 L12 22.5 L10.7 13.3 L1.5 12 L10.7 10.7 Z'

export function Modal({ label, origin, onClose, onClosingStart }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [closing, setClosing] = useState(false)
  // Ref guard so that double-tapping the close button (or Esc spam) only
  // schedules the close timeout / fires `onClosingStart` once. We can't use
  // the `closing` state for this guard because we'd be reading a value that
  // hasn't been committed yet on the second call within the same tick.
  const closingRef = useRef(false)

  const requestClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    onClosingStart?.()
    window.setTimeout(onClose, CLOSE_ANIMATION_MS)
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

  // Pick a sparkle budget once at mount based on viewport width. We don't
  // re-evaluate on resize because the constellation is keyframe-driven from
  // a static list — mutating the list mid-animation would unmount sparkles
  // partway through their flash and look glitchy. Mobile gets the smaller
  // hand-picked subset to keep the animating drop-shadow filter cost down.
  const sparkles = useMemo<SparkleSpec[]>(() => {
    if (typeof window === 'undefined') return SPARKLES
    return window.innerWidth <= 640 ? SPARKLES.slice(0, SPARKLES_MOBILE_COUNT) : SPARKLES
  }, [])

  const isLookBook = label === 'Look Book'
  const isRegistry = label === 'Registry'
  const isQuestions = label === 'Questions'
  const isAccommodations = label === 'Accommodations'
  const isActivities = label === 'Activities'
  const isSchedule = label === 'Schedule'
  const cardClass = `modal-card${isLookBook ? ' modal-card--lookbook' : ''}${
    isRegistry ? ' modal-card--registry' : ''
  }${isQuestions ? ' modal-card--questions' : ''}${
    isAccommodations ? ' modal-card--accommodations' : ''
  }${isActivities ? ' modal-card--activities' : ''}${
    isSchedule ? ' modal-card--schedule' : ''
  }${closing ? ' modal-card--closing' : ''}`
  const backdropClass = `modal-backdrop${closing ? ' modal-backdrop--closing' : ''}`

  // Close on any click outside the card. We delegate from the stage rather
  // than relying on a single `onClick` on the backdrop so we're robust to
  // edge cases — e.g. the backdrop falling under some other transparent
  // overlay, or a click that begins on the backdrop and ends on the card
  // (mousedown/mouseup landing on different elements). `display: contents`
  // on the stage means it has no box of its own, but it still sees the
  // bubbled click event from any descendant.
  const handleStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as Element | null
    if (!target || !target.closest('.modal-card')) {
      requestClose()
    }
  }

  return (
    <div className="modal-stage" style={stageStyle} onClick={handleStageClick}>
      <div className={backdropClass} aria-hidden="true" />
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
            {sparkles.map((s, i) => (
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
            <picture>
              {/* Phones get a smaller WebP first, desktops the full WebP, and
                  browsers without WebP support fall back to the original PNG.
                  loading="eager" because by the time the modal opens the user
                  has explicitly asked to see this image. */}
              <source
                media="(max-width: 900px)"
                type="image/webp"
                srcSet="/assets/look-book-sm.webp"
              />
              <source type="image/webp" srcSet="/assets/look-book.webp" />
              <img
                className="modal-lookbook-img"
                src="/assets/look-book.png"
                alt="Guest attire inspiration guide"
                draggable={false}
                decoding="async"
                loading="eager"
              />
            </picture>
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
                    A weekend of celebration in San Juan Capistrano.
                  </p>
                  <ol className="modal-schedule">
                    {SCHEDULE.map((item) => (
                      <li key={item.date} className="modal-schedule__item">
                        <span className="modal-eyebrow">{item.date}</span>
                        <h3 className="modal-schedule__title">{item.title}</h3>
                        <div className="modal-schedule__venue">
                          <span className="modal-schedule__venue-name">{item.venue}</span>
                          <span className="modal-schedule__address">{item.address}</span>
                        </div>
                        <ul className="modal-schedule__events">
                          {item.events.map((event) => (
                            <li key={event.time} className="modal-schedule__event">
                              <span className="modal-schedule__time">{event.time}</span>
                              <span className="modal-schedule__event-text">
                                {event.description}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {item.notes && item.notes.length > 0 && (
                          <div className="modal-schedule__notes">
                            {item.notes.map((note, i) => (
                              <p key={i} className="modal-schedule__note">
                                {note}
                              </p>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : label === 'Accommodations' ? (
                <div className="modal-content">
                  <p className="modal-lead">
                    A few hotel options for guests joining us in San Juan Capistrano
                    for the weekend.
                  </p>
                  <ol className="modal-stays">
                    {STAYS.map((stay) => (
                      <li key={stay.venue} className="modal-stays__item">
                        <span className="modal-eyebrow">{stay.eyebrow}</span>
                        <h3 className="modal-stays__title">{stay.title}</h3>
                        <div className="modal-stays__venue">
                          <span className="modal-stays__venue-name">{stay.venue}</span>
                          <span className="modal-stays__address">{stay.address}</span>
                          {stay.phone && (
                            <a className="modal-stays__phone" href={stay.phone.href}>
                              {stay.phone.display}
                            </a>
                          )}
                        </div>
                        <p className="modal-stays__detail">{stay.description}</p>
                        {stay.cta && (
                          <a
                            className="modal-button"
                            href={stay.cta.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {stay.cta.label}
                          </a>
                        )}
                        {stay.note && (
                          <p className="modal-stays__note">{stay.note}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : label === 'Activities' ? (
                <div className="modal-content">
                  <p className="modal-lead">
                    A few favorite ways to spend an afternoon nearby — whether you have
                    a quiet morning to fill or a whole extra day in San Juan Capistrano.
                  </p>
                  <div className="modal-activities">
                    {ACTIVITIES.map((group) => (
                      <section key={group.heading} className="modal-activities__group">
                        <h3 className="modal-activities__heading">{group.heading}</h3>
                        <ul className="modal-activities__items">
                          {group.activities.map((activity) => (
                            <li key={activity.title} className="modal-activities__item">
                              <h4 className="modal-activities__title">{activity.title}</h4>
                              {activity.description && (
                                <p className="modal-activities__detail">
                                  {activity.description}
                                </p>
                              )}
                              {activity.link && (
                                <a
                                  className="modal-activities__link"
                                  href={activity.link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {activity.link.label}
                                  <span aria-hidden="true" className="modal-activities__arrow">
                                    →
                                  </span>
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
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
