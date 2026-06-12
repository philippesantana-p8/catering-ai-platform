'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTenant } from '@/components/tenant/TenantProvider'

function IconSparkles({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3l1.2 4.2L17.5 8 13.2 9.2 12 13.5 10.8 9.2 6.5 8l4.3-.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 14l.8 2.8L8.5 18l-2.7 1.2L5 22l-.8-2.8L1.5 18l2.7-1.2L5 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClose({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconHelp({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 9.25a2.75 2.75 0 015.1 1.35c0 1.65-2.35 1.9-2.35 3.65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

function IconAlert({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 4.5 20.5 19H3.5L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}

function IconHeadphones({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 14v4a2 2 0 002 2h1v-8H5a1 1 0 00-1 1Zm15-1h-2v8h1a2 2 0 002-2v-4a1 1 0 00-1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 14a6 6 0 0112 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export type FloatingAIConciergeProps = {
  /** Rota ou identificador da tela — padrão: pathname atual */
  currentPage?: string
  companyId?: string
  quoteId?: string | null
  packageId?: string | null
  userRole?: string | null
}

type QuickAction = 'screen-help' | 'pending' | 'concierge'

const HIDDEN_ROUTE_PREFIXES = ['/login', '/auth', '/sign-in', '/signin']

function isHiddenRoute(pathname: string): boolean {
  const path = pathname.toLowerCase()
  return HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

function isQuoteFlowRoute(pathname: string): boolean {
  return (
    pathname === '/quotes/new' ||
    /^\/quotes\/[^/]+\/edit$/.test(pathname)
  )
}

function pageLabel(pathname: string): string {
  if (pathname === '/quotes/new') return 'Nova cotação'
  if (/^\/quotes\/[^/]+\/edit$/.test(pathname)) return 'Editar cotação'
  if (pathname.startsWith('/quotes/')) return 'Detalhe da cotação'
  if (pathname.startsWith('/packages')) return 'Pacotes'
  if (pathname.startsWith('/additional-items')) return 'Adicionais'
  if (pathname === '/' || pathname === '/quotes') return 'Cotações'
  return pathname || 'aplicativo'
}

function buildMockResponse(
  action: QuickAction,
  context: {
    currentPage: string
    companyId: string
    quoteId?: string | null
    packageId?: string | null
    userRole?: string | null
  },
): string {
  const screen = pageLabel(context.currentPage)

  if (action === 'screen-help') {
    if (context.currentPage === '/quotes/new') {
      return `Você está em **${screen}**. Posso ajudar com cliente, data, pacote, adicionais, endereço e revisão. Na etapa Pacote, confira itens fixos, escolhas inclusas e guarnições antes de avançar.`
    }
    if (context.currentPage.startsWith('/packages')) {
      return `Você está em **${screen}**. Aqui você configura itens fixos, guarnições e escolhas inclusas de cada pacote, com vínculo a adicionais para bloqueio e custo.`
    }
    return `Você está em **${screen}**. Em breve responderei com contexto desta tela. Por enquanto, use o menu superior ou fale com o concierge humano.`
  }

  if (action === 'pending') {
    const parts: string[] = []
    if (context.currentPage.includes('/quotes')) {
      parts.push('Verifique se o pacote tem todas as escolhas obrigatórias.')
      parts.push('Confira endereço, distância e data do evento.')
      if (!context.quoteId) {
        parts.push('Cotação ainda não salva — finalize a revisão para gerar o registro.')
      }
    } else {
      parts.push('Nenhuma pendência automática detectada nesta tela.')
    }
    if (context.packageId) {
      parts.push(`Pacote em contexto: ${context.packageId.slice(0, 8)}…`)
    }
    return parts.join(' ')
  }

  return `Concierge humano PSCS: em breve você poderá abrir chat ou WhatsApp direto daqui. Contexto enviado: empresa ${context.companyId.slice(0, 8)}… · papel ${context.userRole ?? '—'} · tela ${screen}.`
}

function MascotAvatar({ className = '' }: { className?: string }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {imageError ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-200">
          <div className="relative">
            <IconHeadphones className="h-7 w-7 text-amber-900" />
            <IconSparkles className="absolute -right-1 -top-1 h-4 w-4 text-yellow-500" />
          </div>
        </div>
      ) : (
        <Image
          src="/images/pp8x-ai-concierge.png"
          alt="PP8X AI Concierge"
          fill
          className="object-cover"
          sizes="56px"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )
}

export default function FloatingAIConcierge({
  currentPage: currentPageProp,
  companyId: companyIdProp,
  quoteId = null,
  packageId = null,
  userRole: userRoleProp,
}: FloatingAIConciergeProps = {}) {
  const pathname = usePathname() ?? ''
  const { companyId: tenantCompanyId, role: tenantRole } = useTenant()
  const [open, setOpen] = useState(false)
  const [mockReply, setMockReply] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null)

  const currentPage = currentPageProp ?? pathname
  const companyId = companyIdProp ?? tenantCompanyId ?? ''
  const userRole = userRoleProp ?? tenantRole ?? null

  const context = useMemo(
    () => ({
      currentPage,
      companyId,
      quoteId,
      packageId,
      userRole,
    }),
    [currentPage, companyId, quoteId, packageId, userRole],
  )

  if (isHiddenRoute(pathname)) return null

  const quoteFlow = isQuoteFlowRoute(pathname)
  const buttonPosition = quoteFlow
    ? 'bottom-24 sm:bottom-6'
    : 'bottom-5 sm:bottom-6'
  const panelPosition = quoteFlow
    ? 'bottom-[7.5rem] sm:bottom-28'
    : 'bottom-28 sm:bottom-28'

  function handleQuickAction(action: QuickAction) {
    setActiveAction(action)
    setMockReply(buildMockResponse(action, context))
  }

  function toggleOpen() {
    setOpen((value) => {
      if (value) {
        setMockReply(null)
        setActiveAction(null)
      }
      return !value
    })
  }

  return (
    <>
      {open ? (
        <div
          className={`fixed right-4 z-[9998] w-[min(100vw-2rem,22rem)] rounded-3xl border border-amber-300/80 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] dark:border-amber-500/40 dark:bg-neutral-900 ${panelPosition}`}
          role="dialog"
          aria-label="PP8X AI Concierge"
        >
          <div className="flex items-start justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <IconSparkles className="h-4 w-4 shrink-0 text-amber-500" />
                <h3 className="truncate text-sm font-bold text-neutral-900 dark:text-white">
                  PP8X AI Concierge
                </h3>
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Ajuda inteligente para esta tela
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleOpen()}
              className="shrink-0 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Fechar PP8X AI Concierge"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto p-4">
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
              Olá! Eu sou o PP8X AI Concierge. Posso te ajudar com cotação,
              pacotes, guarnições, adicionais, preços, endereço e inventário.
            </p>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => handleQuickAction('screen-help')}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  activeAction === 'screen-help'
                    ? 'border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <IconHelp className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-300" />
                Tirar dúvida desta tela
              </button>

              <button
                type="button"
                onClick={() => handleQuickAction('pending')}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  activeAction === 'pending'
                    ? 'border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <IconAlert className="h-5 w-5 shrink-0 text-red-500" />
                Verificar pendências
              </button>

              <button
                type="button"
                onClick={() => handleQuickAction('concierge')}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  activeAction === 'concierge'
                    ? 'border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <IconHeadphones className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-300" />
                Falar com o concierge
              </button>
            </div>

            {mockReply ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-3 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-100">
                {mockReply.replace(/\*\*(.*?)\*\*/g, '$1')}
              </div>
            ) : (
              <div className="rounded-2xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                Em breve: respostas com IA usando o contexto da cotação (
                {pageLabel(currentPage)}).
              </div>
            )}

            <p className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
              ctx: {companyId ? `${companyId.slice(0, 8)}…` : '—'}
              {quoteId ? ` · quote ${quoteId.slice(0, 8)}…` : ''}
              {packageId ? ` · pkg ${packageId.slice(0, 8)}…` : ''}
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleOpen}
        className={`fixed right-4 z-[9999] flex items-center gap-2 rounded-full border-2 border-amber-400 bg-white px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:scale-[1.03] active:scale-[0.98] dark:bg-neutral-900 ${buttonPosition}`}
        aria-label="Abrir PP8X AI Concierge"
        aria-expanded={open}
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-amber-300 bg-white shadow-lg dark:bg-neutral-800">
          <MascotAvatar className="absolute inset-0" />
        </div>

        <span className="hidden rounded-full bg-neutral-900 px-3 py-2 text-xs font-bold text-white shadow md:inline dark:bg-amber-500 dark:text-neutral-950">
          PP8X AI Concierge
        </span>
      </button>
    </>
  )
}
