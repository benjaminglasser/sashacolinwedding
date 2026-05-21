import { useEffect, useRef, useState } from 'react'

type Props = {
  label: string
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

export function Modal({ label, onClose }: Props) {
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

  const isLookBook = label === 'Look Book'
  const cardClass = `modal-card${isLookBook ? ' modal-card--lookbook' : ''}${
    closing ? ' modal-card--closing' : ''
  }`
  const backdropClass = `modal-backdrop${closing ? ' modal-backdrop--closing' : ''}`

  return (
    <>
      <div className={backdropClass} onClick={requestClose} aria-hidden="true" />
      <div
        className={cardClass}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button
          ref={closeRef}
          type="button"
          className="modal-close"
          aria-label="Close"
          onClick={requestClose}
        >
          <span aria-hidden="true">&times;</span>
        </button>
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
    </>
  )
}
