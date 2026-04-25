import { useState } from 'react'
import './App.css'
import { Header } from './Header'
import { IntroOverlay } from './IntroOverlay'
import { Scene } from './Scene'

const INTRO_FADE_MS = 800

function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [introMounted, setIntroMounted] = useState(true)

  const handleEnter = () => {
    setHasEntered(true)
    window.setTimeout(() => setIntroMounted(false), INTRO_FADE_MS)
  }

  return (
    <main className="page">
      {hasEntered && <Scene />}
      {hasEntered && <Header />}
      {introMounted && <IntroOverlay onEnter={handleEnter} />}
    </main>
  )
}

export default App
