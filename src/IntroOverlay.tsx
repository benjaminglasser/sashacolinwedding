import { useState } from 'react'

type Props = {
  onEnter: () => void
}

export function IntroOverlay({ onEnter }: Props) {
  const [leaving, setLeaving] = useState(false)

  const handleEnter = () => {
    if (leaving) return
    setLeaving(true)
    onEnter()
  }

  return (
    <div className={`intro${leaving ? ' intro--leaving' : ''}`} aria-hidden={leaving}>
      <div className="intro__card">
        <h1 className="intro__title">Sasha and Colin</h1>
        <p className="intro__date">September 5th, 2026</p>
        <button type="button" className="intro__enter" onClick={handleEnter}>
          enter
        </button>
      </div>
    </div>
  )
}
