import fs from 'fs'
import path from 'path'
import {
  CDL_LOGO_FILE_CANDIDATES,
  type PdfLogoSource,
} from './cdlLogo'

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const IMAGE_EXT_PATTERN = /\.(png|jpe?g|webp)$/i

function encodeLogoFile(filePath: string): PdfLogoSource {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime = MIME_BY_EXT[ext] ?? 'image/png'
  const data = fs.readFileSync(filePath)

  return {
    src: `data:${mime};base64,${data.toString('base64')}`,
  }
}

export function resolveCdlLogoForPdf(): PdfLogoSource {
  const dir = path.join(process.cwd(), 'public', 'cdl')

  if (!fs.existsSync(dir)) {
    return { src: null }
  }

  for (const fileName of CDL_LOGO_FILE_CANDIDATES) {
    const filePath = path.join(dir, fileName)
    if (!fs.existsSync(filePath)) continue
    return encodeLogoFile(filePath)
  }

  const discovered = fs
    .readdirSync(dir)
    .filter((fileName) => IMAGE_EXT_PATTERN.test(fileName))
    .sort((a, b) => a.localeCompare(b, 'en'))

  if (discovered.length > 0) {
    return encodeLogoFile(path.join(dir, discovered[0]!))
  }

  return { src: null }
}
