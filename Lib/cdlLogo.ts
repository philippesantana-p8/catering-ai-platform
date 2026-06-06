export const CDL_LOGO_WEB_PATHS = [
  '/cdl/logo.png',
  '/cdl/logo-cdl.png',
  '/cdl/logo.jpg',
  '/cdl/logo.webp',
] as const

export const CDL_LOGO_ALT = 'CDL BBQ Logo'

export const CDL_LOGO_PLACEHOLDER = 'CDL BBQ'

/** @deprecated Use CDL_LOGO_WEB_PATHS[0] */
export const CDL_LOGO_SRC = CDL_LOGO_WEB_PATHS[0]

export const CDL_LOGO_FILE_CANDIDATES = [
  'logo.png',
  'logo-cdl.png',
  'logo.jpg',
  'logo.jpeg',
  'logo.webp',
] as const

export type PdfLogoSource = {
  src: string | null
}
