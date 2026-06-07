import type { QuoteDetail } from '@/app/quotes/[id]/quoteDetailTypes'
import {
  getCustomerDisplayNameFromQuote,
  type CustomerNameSource,
} from '@/Lib/getCustomerDisplayName'

function sanitizeFilenamePart(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase()
      .slice(0, 40) || 'CLIENT'
  )
}

export function getEventDateForFilename(
  eventDate: string | null | undefined,
): string {
  if (!eventDate) return '0000-00-00'
  const normalized = eventDate.includes('T')
    ? eventDate.split('T')[0]
    : eventDate
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '0000-00-00'
}

export function getQuotePdfFilename(
  quote: Pick<QuoteDetail, 'quote_number' | 'event_date'> & CustomerNameSource,
) {
  const datePart = getEventDateForFilename(quote.event_date)
  const quoteNumber = (quote.quote_number ?? 'CDL-Q-0000')
    .trim()
    .replace(/\s+/g, '-')
  const clientName = sanitizeFilenamePart(
    getCustomerDisplayNameFromQuote(quote, { emptyLabel: 'CLIENT' }),
  )
  return `${datePart}_${quoteNumber}_${clientName}_BBQ-At-Home.pdf`
}

export function parseFilenameFromContentDisposition(
  header: string | null,
): string | null {
  if (!header) return null

  const utf8Match = header.match(/filename\*=UTF-8''([^;\n]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      return utf8Match[1].trim()
    }
  }

  const quotedMatch = header.match(/filename="([^"]+)"/i)
  if (quotedMatch?.[1]) return quotedMatch[1]

  const plainMatch = header.match(/filename=([^;\n]+)/i)
  if (plainMatch?.[1]) return plainMatch[1].trim().replace(/^"|"$/g, '')

  return null
}

export function getQuotePdfContentDisposition(quote: QuoteDetail) {
  const filename = getQuotePdfFilename(quote)
  const encoded = encodeURIComponent(filename)
  return `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`
}
