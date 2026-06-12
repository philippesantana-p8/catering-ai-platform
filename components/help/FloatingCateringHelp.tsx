'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTenant } from '@/components/tenant/TenantProvider'
import { resolveCompanyBrand } from '@/Lib/help/companyBranding'
import CompanyHelpAvatar from '@/components/help/CompanyHelpAvatar'
import HelpPanel from '@/components/help/HelpPanel'
import {
  isHelpHiddenRoute,
  isQuoteFlowRoute,
  resolveHelpContext,
} from '@/components/help/helpContext'
import {
  buildHelpActionResponse,
  type HelpAction,
} from '@/components/help/helpHints'
import { useFloatingHelpBehavior } from '@/components/help/useFloatingHelpBehavior'

export type FloatingCateringHelpProps = {
  disabled?: boolean
  disabledRoutes?: string[]
  quoteId?: string | null
  packageId?: string | null
  userRole?: string | null
}

export default function FloatingCateringHelp({
  disabled = false,
  disabledRoutes = [],
  quoteId: _quoteId = null,
  packageId: _packageId = null,
  userRole: userRoleProp = null,
}: FloatingCateringHelpProps = {}) {
  const pathname = usePathname() ?? ''
  const { companyId, company, role: tenantRole } = useTenant()
  const [open, setOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<HelpAction | null>(null)
  const [responseText, setResponseText] = useState<string | null>(null)

  const brand = useMemo(
    () => resolveCompanyBrand(companyId, company),
    [companyId, company],
  )
  const routeContext = useMemo(() => resolveHelpContext(pathname), [pathname])
  const userRole = userRoleProp ?? tenantRole

  const { visualState, hintText, hintVisible, dismissHint, clearHint } =
    useFloatingHelpBehavior(pathname, open)

  const hidden =
    disabled ||
    isHelpHiddenRoute(pathname) ||
    disabledRoutes.some(
      (route) =>
        pathname === route || pathname.startsWith(`${route}/`),
    )

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (hidden) return null

  const quoteFlow = isQuoteFlowRoute(pathname)
  const bottomClass = quoteFlow
    ? 'bottom-24 sm:bottom-6'
    : 'bottom-4 sm:bottom-6'
  const panelBottomClass = quoteFlow
    ? 'bottom-[7.25rem] sm:bottom-24'
    : 'bottom-24 sm:bottom-24'

  const isMinimized = visualState === 'minimized'
  const isDiscreet = visualState === 'discreet'

  const buttonSize = isMinimized
    ? 'h-10 w-10 p-0.5'
    : isDiscreet
      ? 'h-11 w-11 p-0.5 sm:h-12 sm:w-12'
      : 'h-12 w-12 p-0.5 sm:h-14 sm:w-14'

  function handleOpen() {
    clearHint()
    dismissHint()
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setActiveAction(null)
    setResponseText(null)
  }

  function handleAction(action: HelpAction) {
    setActiveAction(action)
    setResponseText(
      buildHelpActionResponse(action, pathname, routeContext, brand.displayName),
    )
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[9997] bg-black/20 backdrop-blur-[1px] sm:bg-black/10"
          aria-label="Fechar ajuda"
          onClick={handleClose}
        />
      ) : null}

      {open ? (
        <div
          className={`fixed right-3 z-[9998] w-[min(100vw-1.5rem,24rem)] sm:right-5 ${panelBottomClass}`}
        >
          <HelpPanel
            brand={brand}
            routeContext={routeContext}
            pathname={pathname}
            activeAction={activeAction}
            responseText={responseText}
            onAction={handleAction}
            onClose={handleClose}
          />
        </div>
      ) : null}

      {!open && hintVisible && hintText ? (
        <div
          className={`fixed right-3 z-[9996] max-w-[min(16rem,calc(100vw-5rem))] sm:right-5 ${bottomClass}`}
          style={{ transform: 'translateY(calc(-100% - 0.5rem))' }}
        >
          <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
            <p>{hintText}</p>
            <button
              type="button"
              onClick={dismissHint}
              className="mt-1 text-[10px] font-semibold text-neutral-500 underline"
            >
              Dispensar
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? handleClose() : handleOpen())}
        className={`fixed right-3 z-[9999] flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 shadow-[0_8px_28px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-[0_10px_32px_rgba(0,0,0,0.22)] dark:border-neutral-700 dark:bg-neutral-900/95 sm:right-5 ${bottomClass} ${
          isMinimized ? 'opacity-80' : 'opacity-100'
        } ${open ? 'ring-2 ring-neutral-300 dark:ring-neutral-600' : ''}`}
        aria-label="Abrir central de ajuda"
        aria-expanded={open}
      >
        <div className={buttonSize}>
          <CompanyHelpAvatar
            brand={brand}
            size={isMinimized ? 'sm' : isDiscreet ? 'md' : 'lg'}
            ring
            className="h-full w-full"
          />
        </div>
        <span
          className={`hidden pr-3 text-xs font-semibold text-neutral-800 dark:text-neutral-100 md:inline ${
            isDiscreet ? 'opacity-80' : ''
          }`}
        >
          Ajuda
        </span>
      </button>

      <span className="sr-only" aria-live="polite">
        {open
          ? `Ajuda aberta para ${routeContext.title}`
          : `Ajuda disponível para ${brand.displayName}`}
      </span>
    </>
  )
}
