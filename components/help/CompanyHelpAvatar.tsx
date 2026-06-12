'use client'

import { useState } from 'react'
import type { CompanyBrand } from '@/Lib/help/companyBranding'
import { CDL_LOGO_PLACEHOLDER } from '@/Lib/cdlLogo'

const SIZE_MAP = {
  sm: 'h-9 w-9 text-[10px]',
  md: 'h-11 w-11 text-xs',
  lg: 'h-14 w-14 text-sm',
} as const

function IconHelpNeutral({ className = 'h-5 w-5' }: { className?: string }) {
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

export default function CompanyHelpAvatar({
  brand,
  size = 'md',
  className = '',
  ring = true,
}: {
  brand: CompanyBrand
  size?: keyof typeof SIZE_MAP
  className?: string
  ring?: boolean
}) {
  const [imageError, setImageError] = useState(false)
  const sizeClass = className.includes('h-full') ? 'h-full w-full' : SIZE_MAP[size]
  const ringClass = ring
    ? 'ring-1 ring-neutral-200 dark:ring-neutral-700'
    : ''

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-white shadow-sm dark:bg-neutral-900 ${sizeClass} ${ringClass} ${className}`}
      aria-hidden
    >
      {brand.logoUrl && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica por tenant
        <img
          src={brand.logoUrl}
          alt=""
          className="h-full w-full object-contain p-1"
          onError={() => setImageError(true)}
        />
      ) : brand.initials === 'CDL' || /cdl/i.test(brand.displayName) ? (
        <div className="flex h-full w-full items-center justify-center bg-neutral-900 px-1 text-[9px] font-black uppercase tracking-wide text-white">
          {CDL_LOGO_PLACEHOLDER}
        </div>
      ) : brand.initials && brand.initials !== '?' ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 font-bold text-neutral-700 dark:from-neutral-800 dark:to-neutral-700 dark:text-neutral-100">
          {brand.initials}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <IconHelpNeutral className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
      )}
    </div>
  )
}
