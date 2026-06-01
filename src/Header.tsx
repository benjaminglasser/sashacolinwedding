import { Fragment } from 'react'

const RSVP_URL = 'https://www.zola.com/wedding/sashaandcolin2026/rsvp'

const LINKS = [
  { label: 'RSVP', href: RSVP_URL, external: true },
  { label: 'Schedule', href: '#schedule' },
  { label: 'Accommodations', href: '#accommodations' },
  { label: 'Activities', href: '#activities' },
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
          {LINKS.map((link, index) => (
            <Fragment key={link.href}>
              {index > 0 && (
                // Decorative gold star+sprig ornament between links — echoes
                // the same flourish used under the modal titles and intro,
                // shrunk down to a thumbnail size so it reads as a divider
                // rather than a heading mark. Marked aria-hidden so screen
                // readers walk the list as `link, link, link`.
                <li
                  className="header__separator"
                  role="presentation"
                  aria-hidden="true"
                />
              )}
              <li>
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
            </Fragment>
          ))}
        </ul>
      </nav>
    </header>
  )
}
