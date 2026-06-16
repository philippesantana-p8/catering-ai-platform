'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import TenantContextBar from '@/components/tenant/TenantContextBar'
import { getQuoteStrings } from '@/Lib/quoteTranslations'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

function getNavLinks(language: QuoteLanguage = 'pt') {
  const t = getQuoteStrings(language).nav
  return [
    { href: '/quotes', label: t.quotes },
    { href: '/customers', label: t.customers },
    { href: '/packages', label: t.packages },
    { href: '/additional-items', label: t.itemCatalog },
    { href: '/commercial-rules', label: t.rules },
    { href: '/packages/images', label: t.images },
  ] as const
}

function isNavActive(pathname: string, href: string) {
  if (href === '/quotes') {
    return (
      pathname === '/quotes' ||
      (pathname.startsWith('/quotes/') && !pathname.startsWith('/quotes/new'))
    )
  }
  if (href === '/customers') {
    return pathname === '/customers' || pathname.startsWith('/customers/')
  }
  if (href === '/packages') {
    return (
      pathname === '/packages' ||
      (pathname.startsWith('/packages/') && !pathname.startsWith('/packages/images'))
    )
  }
  if (href === '/packages/images') {
    return pathname.startsWith('/packages/images')
  }
  if (href === '/additional-items') {
    return (
      pathname === '/additional-items' ||
      pathname.startsWith('/additional-items/')
    )
  }
  if (href === '/commercial-rules') {
    return (
      pathname === '/commercial-rules' ||
      pathname.startsWith('/commercial-rules/')
    )
  }
  return pathname === href
}

export default function AdminCompactMenu({
  language = 'pt',
}: {
  language?: QuoteLanguage
}) {
  const pathname = usePathname() ?? ''
  const navLinks = getNavLinks(language)
  const quoteStrings = getQuoteStrings(language)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface text-cdl-fg shadow-sm transition hover:border-cdl-accent-border"
        aria-expanded={open}
        aria-label="Menu administrativo"
      >
        <span className="sr-only">Menu</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      <Link
        href="/quotes/new"
        className="inline-flex min-h-10 items-center rounded-xl border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white"
      >
        {quoteStrings.nav.newQuote}
      </Link>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-3 right-3 top-14 z-50 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-cdl-border bg-cdl-surface p-3 shadow-xl sm:left-auto sm:right-4 sm:w-72">
            <TenantContextBar />
            <nav className="mt-3 flex flex-col gap-1" aria-label="Navegação administrativa">
              {navLinks.map((link) => {
                const active = isNavActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]'
                        : 'text-cdl-fg hover:bg-cdl-hover'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  )
}
