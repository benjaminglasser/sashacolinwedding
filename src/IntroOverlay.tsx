import { useState } from 'react'

type Props = {
  onEnter: () => void
}

// iOS 13+ exposes DeviceOrientationEvent.requestPermission() and refuses to
// fire any `deviceorientation` events until it has been called from inside
// a user gesture. We piggy-back on the "enter" tap and await the OS prompt
// before triggering the transition, so the visitor decides allow/deny first
// and only then does the scene fade in. Browsers without a permission API
// (desktop, Android, etc.) skip the await entirely.
type PermissionRequestingCtor = {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

async function requestOrientationPermissionIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return
  const ctor = window.DeviceOrientationEvent as unknown as PermissionRequestingCtor | undefined
  if (!ctor || typeof ctor.requestPermission !== 'function') return
  try {
    await ctor.requestPermission()
  } catch {
    // User denied or the call failed; fall through silently so the visitor
    // can still enter the scene (parallax just stays neutral).
  }
}

export function IntroOverlay({ onEnter }: Props) {
  const [leaving, setLeaving] = useState(false)

  const handleEnter = async () => {
    if (leaving) return
    await requestOrientationPermissionIfNeeded()
    setLeaving(true)
    onEnter()
  }

  return (
    <div className={`intro${leaving ? ' intro--leaving' : ''}`} aria-hidden={leaving}>
      <div className="intro__card">
        <h1 className="intro__title">Sasha and Colin</h1>
        <p className="intro__date">September 5th, 2026</p>
        <button
          type="button"
          className="intro__enter"
          onClick={() => {
            void handleEnter()
          }}
        >
          enter
        </button>
      </div>
    </div>
  )
}
