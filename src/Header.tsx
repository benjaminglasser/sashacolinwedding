const LINKS = [
  { label: 'RSVP', href: '#rsvp' },
  { label: 'Schedule', href: '#schedule' },
  { label: 'Registry', href: '#registry' },
  { label: 'Look Book', href: '#look-book' },
  { label: 'Questions', href: '#questions' },
]

type Props = {
  onOpen: (label: string) => void
}

export function Header({ onOpen }: Props) {
  return (
    <header className="header" aria-label="Site navigation">
      <nav className="header__nav">
        <ul className="header__list">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                className="header__link"
                href={link.href}
                onClick={(event) => {
                  event.preventDefault()
                  onOpen(link.label)
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
