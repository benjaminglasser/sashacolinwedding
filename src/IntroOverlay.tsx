import { useState } from 'react'

type Props = {
  onEnter: () => void
}

// iOS 13+ requires DeviceOrientationEvent.requestPermission() to be called
// from inside a user gesture before any `deviceorientation` events fire.
// We piggy-back on the "enter" tap and await the prompt so the dialog
// resolves over the intro card before the scene transitions in (otherwise
// the native iOS sheet would pop over a half-faded scene).
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
    // User denied or the call failed; fall through silently — the scene
    // simply won't receive tilt events and parallax stays neutral.
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
