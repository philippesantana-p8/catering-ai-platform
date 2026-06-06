'use client'

import { useState } from 'react'
import {
  CDL_LOGO_ALT,
  CDL_LOGO_PLACEHOLDER,
  CDL_LOGO_WEB_PATHS,
} from '../Lib/cdlLogo'

type CdlBrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass: Record<NonNullable<CdlBrandLogoProps['size']>, string> = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24 sm:h-28 sm:w-28',
  lg: 'h-32 w-32 sm:h-36 sm:w-36',
}

const placeholderClass: Record<NonNullable<CdlBrandLogoProps['size']>, string> =
  {
    sm: 'h-16 min-w-16 px-2 text-sm',
    md: 'h-24 min-w-24 px-3 text-base sm:h-28 sm:min-w-28 sm:text-lg',
    lg: 'h-32 min-w-32 px-4 text-lg sm:h-36 sm:min-w-36 sm:text-xl',
  }

export { CDL_LOGO_SRC, CDL_LOGO_WEB_PATHS } from '../Lib/cdlLogo'

export default function CdlBrandLogo({
  size = 'md',
  className = '',
}: CdlBrandLogoProps) {
  const [pathIndex, setPathIndex] = useState(0)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  if (usePlaceholder || pathIndex >= CDL_LOGO_WEB_PATHS.length) {
    return (
      <span
        role="img"
        aria-label={CDL_LOGO_ALT}
        className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-cdl-border bg-cdl-inset font-black uppercase tracking-wider text-cdl-title ${placeholderClass[size]} ${className}`}
      >
        {CDL_LOGO_PLACEHOLDER}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CDL_LOGO_WEB_PATHS[pathIndex]}
      alt={CDL_LOGO_ALT}
      width={size === 'lg' ? 144 : size === 'md' ? 112 : 64}
      height={size === 'lg' ? 144 : size === 'md' ? 112 : 64}
      className={`cdl-brand-logo shrink-0 object-contain ${sizeClass[size]} ${className}`}
      onError={() => {
        if (pathIndex < CDL_LOGO_WEB_PATHS.length - 1) {
          setPathIndex((current) => current + 1)
          return
        }
        setUsePlaceholder(true)
      }}
    />
  )
}
