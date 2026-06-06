export const CDL_LOGO_SRC = '/cdl/logo-cdl.png'

type CdlBrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass: Record<NonNullable<CdlBrandLogoProps['size']>, string> = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24 sm:h-28 sm:w-28',
  lg: 'h-32 w-32 sm:h-36 sm:w-36',
}

export default function CdlBrandLogo({
  size = 'md',
  className = '',
}: CdlBrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CDL_LOGO_SRC}
      alt="CDL Services BBQ at Home"
      width={size === 'lg' ? 144 : size === 'md' ? 112 : 64}
      height={size === 'lg' ? 144 : size === 'md' ? 112 : 64}
      className={`cdl-brand-logo shrink-0 object-contain ${sizeClass[size]} ${className}`}
    />
  )
}
