'use client'

import CdlBrandLogo from '@/components/CdlBrandLogo'

export default function QuoteHeroBanner({
  isEditMode = false,
}: {
  isEditMode?: boolean
}) {
  return (
    <header className="relative mb-6 hidden overflow-hidden rounded-2xl border border-cdl-border bg-cdl-surface px-7 py-10 shadow-cdl md:block sm:px-10 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 cdl-hero-glow"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <CdlBrandLogo size="md" />
        <div className="min-w-0 flex-1">
          <span className="cdl-hero-tag">
            {isEditMode ? 'Editar cotação' : 'Nova cotação'}
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-cdl-title sm:text-5xl lg:text-[3.25rem]">
            BBQ AT HOME
          </h1>
          <p className="mt-3 max-w-2xl text-base text-cdl-text-secondary sm:text-lg">
            Premium Brazilian BBQ Experience · Orlando, Florida
          </p>
        </div>
      </div>
    </header>
  )
}
