const RSVP_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSe1PlE_EEnIuCpbl3960gXccqHtMkcKbEEjAQE3RAVWR3G0GQ/viewform'

const LINKS = [
  { label: 'RSVP', href: RSVP_URL, external: true },
  { label: 'Schedule', href: '#schedule' },
  { label: 'Registry', href: '#registry' },
  { label: 'Look Book', href: '#look-book' },
  { label: 'Questions', href: '#questions' },
]

export type ModalOrigin = { x: number; y: number }

type Props = {
  onOpen: (label: string, origin: ModalOrigin) => void
}

export function Header({ onOpen }: Props) {
  return (
    <header className="header" aria-label="Site navigation">
      <nav className="header__nav">
        <ul className="header__list">
          {LINKS.map((link) => (
            <li key={link.href}>
              {link.external ? (
                <a
                  className="header__link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  className="header__link"
                  href={link.href}
                  onClick={(event) => {
                    event.preventDefault()
                    // Hand the modal the link's screen-space center so it can
                    // grow out of exactly the spot the user clicked.
                    const rect = event.currentTarget.getBoundingClientRect()
                    onOpen(link.label, {
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2,
                    })
                  }}
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
