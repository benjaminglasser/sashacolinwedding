import { useEffect, useRef, useState } from 'react'

type Props = {
  label: string
  onClose: () => void
}

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

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

  const cardClass = `modal-card${closing ? ' modal-card--closing' : ''}`
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
        <h2 className="modal-title">{label}</h2>
        <p className="modal-body">{LOREM}</p>
      </div>
    </>
  )
}
