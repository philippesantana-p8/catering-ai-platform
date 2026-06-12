'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  buildWhatsappUrl,
  isQuoteFlowRoute,
  isWhatsappHiddenRoute,
  type WhatsappQuoteContext,
} from '@/Lib/whatsappContact'

const MOBILE_HINT_KEY = 'cdl_whatsapp_hint_seen'
const MOBILE_HINT_MS = 3000

function WhatsAppIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export type FloatingWhatsAppButtonProps = WhatsappQuoteContext & {
  disabled?: boolean
  disabledRoutes?: string[]
}

export default function FloatingWhatsAppButton({
  disabled = false,
  disabledRoutes = [],
  quoteNumber = null,
  customerName = null,
  packageName = null,
  totalAmount = null,
  publicQuoteUrl = null,
}: FloatingWhatsAppButtonProps = {}) {
  const pathname = usePathname() ?? ''
  const [showMobileHint, setShowMobileHint] = useState(false)

  const quoteContext = useMemo(
    () => ({
      quoteNumber,
      customerName,
      packageName,
      totalAmount,
      publicQuoteUrl,
    }),
    [quoteNumber, customerName, packageName, totalAmount, publicQuoteUrl],
  )

  const href = useMemo(
    () => buildWhatsappUrl(pathname, quoteContext),
    [pathname, quoteContext],
  )

  const hidden =
    disabled ||
    isWhatsappHiddenRoute(pathname) ||
    disabledRoutes.some(
      (route) =>
        pathname === route || pathname.startsWith(`${route}/`),
    )

  useEffect(() => {
    if (hidden || typeof window === 'undefined') return
    if (window.innerWidth >= 768) return
    if (window.sessionStorage.getItem(MOBILE_HINT_KEY) === '1') return

    const showTimer = window.setTimeout(() => {
      setShowMobileHint(true)
      window.sessionStorage.setItem(MOBILE_HINT_KEY, '1')
    }, 1500)

    const hideTimer = window.setTimeout(() => {
      setShowMobileHint(false)
    }, 1500 + MOBILE_HINT_MS)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [hidden, pathname])

  if (hidden) return null

  const quoteFlow = isQuoteFlowRoute(pathname)
  const positionClass = quoteFlow
    ? 'bottom-[calc(env(safe-area-inset-bottom)+96px)] right-4 md:bottom-6 md:right-6'
    : 'bottom-[calc(env(safe-area-inset-bottom)+88px)] right-4 md:bottom-6 md:right-6'

  return (
    <div className={`fixed z-[9999] ${positionClass}`}>
      {showMobileHint ? (
        <div
          className="mb-2 max-w-[11rem] rounded-2xl rounded-br-sm border border-neutral-200 bg-white px-3 py-2 text-xs leading-snug text-neutral-700 shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 md:hidden"
          role="status"
        >
          Precisa de ajuda? Chame no WhatsApp
        </div>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title="Falar no WhatsApp"
        aria-label="Falar no WhatsApp"
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.45)] transition hover:scale-[1.03] hover:bg-[#20bd5a] active:scale-[0.98] md:h-[60px] md:w-[60px]"
      >
        <WhatsAppIcon className="h-7 w-7 md:h-8 md:w-8" />
        <span className="pointer-events-none absolute -top-10 right-0 hidden whitespace-nowrap rounded-lg bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100 md:block">
          Falar no WhatsApp
        </span>
      </a>
    </div>
  )
}
