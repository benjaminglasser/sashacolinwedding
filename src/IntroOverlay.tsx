import { useState } from 'react'

type Props = {
  onEnter: () => void
}

// iOS 13+ exposes DeviceOrientationEvent.requestPermission() and refuses to
// fire any `deviceorientation` events until it has been called from inside
// a user gesture. We can't trigger the OS prompt on page mount because
// Safari silently rejects gestureless calls — so on iOS we surface an
// explicit "allow motion" step that runs BEFORE the enter button is shown,
// and on everywhere else (desktop, Android, etc.) we skip straight to enter.
type PermissionRequestingCtor = {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

function getOrientationPermissionRequester():
  | (() => Promise<'granted' | 'denied' | 'default'>)
  | null {
  if (typeof window === 'undefined') return null
  const ctor = window.DeviceOrientationEvent as unknown as PermissionRequestingCtor | undefined
  if (!ctor || typeof ctor.requestPermission !== 'function') return null
  return ctor.requestPermission.bind(ctor)
}

export function IntroOverlay({ onEnter }: Props) {
  const [leaving, setLeaving] = useState(false)
  // Captured once at mount: if the platform exposes a permission API we
  // gate the enter button behind an explicit allow/deny step. Otherwise
  // (desktop pointer parallax, Android, etc.) we just show enter directly.
  const [needsPermission, setNeedsPermission] = useState(
    () => getOrientationPermissionRequester() !== null,
  )
  const [requesting, setRequesting] = useState(false)

  const handleAllowMotion = async () => {
    if (requesting) return
    const requestPermission = getOrientationPermissionRequester()
    if (!requestPermission) {
      setNeedsPermission(false)
      return
    }
    setRequesting(true)
    try {
      await requestPermission()
    } catch {
      // User denied or the call failed; either way we move on so the
      // visitor can still enter the scene (parallax just stays neutral).
    } finally {
      setRequesting(false)
      setNeedsPermission(false)
    }
  }

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
        {needsPermission ? (
          <button
            type="button"
            className="intro__enter"
            onClick={() => {
              void handleAllowMotion()
            }}
            disabled={requesting}
          >
            allow motion
          </button>
        ) : (
          <button type="button" className="intro__enter" onClick={handleEnter}>
            enter
          </button>
        )}
      </div>
    </div>
  )
}
