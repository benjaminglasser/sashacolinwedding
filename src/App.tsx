import { useState } from 'react'
import './App.css'
import { Header, type ModalOrigin } from './Header'
import { IntroOverlay } from './IntroOverlay'
import { Scene } from './Scene'
import { SparkleCursor } from './SparkleCursor'

const INTRO_FADE_MS = 800

type ActiveModal = { label: string; origin: ModalOrigin }

function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [introMounted, setIntroMounted] = useState(true)
  const [active, setActive] = useState<ActiveModal | null>(null)

  const handleEnter = () => {
    setHasEntered(true)
    window.setTimeout(() => setIntroMounted(false), INTRO_FADE_MS)
  }

  const handleOpen = (label: string, origin: ModalOrigin) => {
    setActive({ label, origin })
  }

  return (
    <main className="page">
      {hasEntered && (
        <Scene
          activeLink={active?.label ?? null}
          origin={active?.origin ?? null}
          onClose={() => setActive(null)}
        />
      )}
      {hasEntered && <Header onOpen={handleOpen} />}
      {introMounted && <IntroOverlay onEnter={handleEnter} />}
      <SparkleCursor />
    </main>
  )
}

export default App
