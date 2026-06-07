'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/quotes', label: 'Cotações' },
  { href: '/customers', label: 'Cadastros' },
  { href: '/packages/images', label: 'Pacotes' },
] as const

function isNavActive(pathname: string, href: string) {
  if (href === '/quotes') {
    return pathname === '/quotes' || pathname.startsWith('/quotes/')
  }
  if (href === '/customers') {
    return pathname === '/customers' || pathname.startsWith('/customers/')
  }
  if (href === '/packages/images') {
    return pathname.startsWith('/packages')
  }
  return pathname === href
}

export default function AppMainNav({ className = '' }: { className?: string }) {
  const pathname = usePathname() ?? ''

  return (
    <nav
      className={`flex flex-wrap gap-2 ${className}`}
      aria-label="Navegação principal"
    >
      {NAV_LINKS.map((link) => {
        const active = isNavActive(pathname, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors sm:text-sm ${
              active
                ? 'border border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]'
                : 'border border-cdl-border bg-cdl-surface text-cdl-fg hover:border-cdl-accent-border'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
