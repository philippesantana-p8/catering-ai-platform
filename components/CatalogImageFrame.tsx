'use client'

export type CatalogImageVariant = 'package' | 'additionalItem'

export type CatalogImageFrameSize = 'default' | 'thumbnail'

const FRAME_BG = 'bg-[#f7f7f7]'

const VARIANT_FRAMES: Record<
  CatalogImageVariant,
  Record<CatalogImageFrameSize, string>
> = {
  package: {
    default:
      'aspect-square w-full min-h-[12rem] max-h-[min(85vw,28rem)] sm:min-h-[14rem] md:max-h-[22rem]',
    thumbnail: 'aspect-square h-16 w-16 min-h-0 max-h-16 shrink-0 rounded-lg',
  },
  additionalItem: {
    default:
      'aspect-[4/3] w-full min-h-[9rem] max-h-[min(70vw,16rem)] sm:min-h-[10rem] md:max-h-[13rem]',
    thumbnail: 'aspect-square h-14 w-14 min-h-0 max-h-14 shrink-0 rounded-lg',
  },
}

const DEFAULT_FALLBACK: Record<CatalogImageVariant, string> = {
  package: 'SEM IMAGEM',
  additionalItem: 'Sem imagem',
}

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export default function CatalogImageFrame({
  src,
  alt,
  variant = 'package',
  fallbackLabel,
  size = 'default',
  className,
  rounded = 'top',
}: {
  src?: string | null
  alt: string
  variant?: CatalogImageVariant
  fallbackLabel?: string
  size?: CatalogImageFrameSize
  className?: string
  /** Cantos arredondados do frame — cards usam `top`, previews admin usam `all`. */
  rounded?: 'top' | 'all' | 'none'
}) {
  const normalizedSrc = src?.trim() || null
  const label = fallbackLabel ?? DEFAULT_FALLBACK[variant]
  const roundedClass =
    rounded === 'all'
      ? 'rounded-2xl'
      : rounded === 'top'
        ? 'rounded-t-2xl'
        : ''

  const frameClass = joinClasses(
    'flex w-full items-center justify-center overflow-hidden',
    FRAME_BG,
    VARIANT_FRAMES[variant][size],
    roundedClass,
    className,
  )

  if (!normalizedSrc) {
    return (
      <div className={frameClass} role="img" aria-label={label}>
        <span
          className={joinClasses(
            'px-2 text-center font-semibold uppercase tracking-wider text-cdl-faint',
            size === 'thumbnail' ? 'text-[8px] leading-tight' : 'text-[10px] sm:text-xs',
          )}
        >
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className={frameClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={normalizedSrc}
        alt={alt}
        className="h-full w-full object-contain object-center"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
