import { useEffect, useState } from 'react'

/**
 * Resolves once every @font-face listed in the document has finished loading
 * (or after `timeoutMs`, whichever comes first). We gate the intro overlay on
 * this so the names + date don't first render in a fallback font and then
 * "pop" to the real one. Falls back to immediately-ready on browsers without
 * the Font Loading API (which at this point is basically nobody, but we keep
 * the guard so SSR or weird embeds never get stuck on the splash).
 *
 * The timeout exists so a slow / failing CDN can't strand a guest on the
 * splash forever — after `timeoutMs` we proceed with whatever fonts have
 * arrived and the rest will swap in once they load. 4s is the sweet spot:
 * long enough that on a normal connection the Google Fonts + the two local
 * faces complete (in our checks the local fonts alone are ~50ms, Google
 * usually <1500ms), short enough that a guest on bad airport wifi isn't
 * just staring at a parchment square.
 */
export function useFontsReady(timeoutMs = 4000): boolean {
  const [ready, setReady] = useState(() => {
    if (typeof document === 'undefined') return true
    return !document.fonts || document.fonts.status === 'loaded'
  })

  useEffect(() => {
    if (ready) return
    if (typeof document === 'undefined' || !document.fonts) {
      setReady(true)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, timeoutMs)
    document.fonts.ready.then(() => {
      if (!cancelled) {
        window.clearTimeout(timer)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [ready, timeoutMs])

  return ready
}
