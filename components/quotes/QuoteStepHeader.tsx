'use client'

import CdlBrandLogo from '@/components/CdlBrandLogo'
import { getQuoteStrings } from '@/Lib/quoteTranslations'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

export default function QuoteStepHeader({
  step,
  language = 'pt',
  isEditMode = false,
}: {
  step: number
  language?: QuoteLanguage
  isEditMode?: boolean
}) {
  const t = getQuoteStrings(language)
  const subtitle = t.stepSubtitles[step]
  const title = isEditMode ? t.editQuoteTitle : t.newQuoteTitle

  return (
    <header className="mb-3 sm:mb-4">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cdl-border-subtle bg-white">
          <CdlBrandLogo size="sm" className="!h-8 !w-8 !max-h-8 !max-w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black text-cdl-title">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-cdl-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block">
        <h1 className="text-2xl font-black tracking-tight text-cdl-title sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-cdl-muted">{subtitle}</p>
        ) : null}
      </div>
    </header>
  )
}
