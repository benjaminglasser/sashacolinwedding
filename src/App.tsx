import { useState } from 'react'
import './App.css'
import { Header, type ModalOrigin } from './Header'
import { IntroOverlay } from './IntroOverlay'
import { Scene } from './Scene'
import { SparkleCursor } from './SparkleCursor'
import { useFontsReady } from './useFontsReady'

const INTRO_FADE_MS = 800

type ActiveModal = { label: string; origin: ModalOrigin }

function App() {
  const fontsReady = useFontsReady()
  const [hasEntered, setHasEntered] = useState(false)
  const [introMounted, setIntroMounted] = useState(true)
  const [active, setActive] = useState<ActiveModal | null>(null)
  // True from "modal mounted" through "user clicked close". We flip it off
  // the moment the Modal reports its close gesture has started so the header
  // can begin its fade-back-in in parallel with the modal's retreat — same
  // visual cadence the original `:has(.modal-card:not(.modal-card--closing))`
  // selector produced, but driven by a class swap on a single element instead
  // of an expensive cross-tree :has match invalidating on every state change.
  const [modalOpen, setModalOpen] = useState(false)

  const handleEnter = () => {
    setHasEntered(true)
    window.setTimeout(() => setIntroMounted(false), INTRO_FADE_MS)
  }

  const handleOpen = (label: string, origin: ModalOrigin) => {
    setActive({ label, origin })
    setModalOpen(true)
  }

  const handleClosingStart = () => {
    setModalOpen(false)
  }

  const handleClose = () => {
    setActive(null)
    setModalOpen(false)
  }

  return (
    <main className={`page${modalOpen ? ' page--modal-open' : ''}`}>
      {hasEntered && (
        <Scene
          activeLink={active?.label ?? null}
          origin={active?.origin ?? null}
          onClose={handleClose}
          onClosingStart={handleClosingStart}
        />
      )}
      {hasEntered && <Header onOpen={handleOpen} />}
      {/* Hold a parchment splash over the intro until the @font-face faces
          finish loading so the names never render in a fallback face and then
          "pop" to the real one. `useFontsReady` resolves on document.fonts
          .ready (or a 4s safety timeout). */}
      {introMounted && (fontsReady ? <IntroOverlay onEnter={handleEnter} /> : <FontSplash />)}
      <SparkleCursor />
    </main>
  )
}

/** Tiny placeholder shown above the intro until web fonts have loaded. Uses
 *  the same parchment gradient + gold inset frame as the intro overlay so the
 *  hand-off into the real intro is just a content fade. Title/date are
 *  intentionally omitted — they're the strings whose font-pop we're avoiding,
 *  so we let the splash carry a single small twinkle instead. */
function FontSplash() {
  return (
    <div className="font-splash" role="status" aria-label="Loading">
      <div className="font-splash__dot" aria-hidden="true" />
    </div>
  )
}

export default App
