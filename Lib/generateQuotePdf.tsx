import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument } from '@/app/quotes/[id]/QuotePdfDocument'
import type { QuoteDetail } from '@/app/quotes/[id]/quoteDetailTypes'
import { getQuotePdfFilename } from '@/Lib/quotePdfFilename'

export async function generateQuotePdfBuffer(quote: QuoteDetail) {
  return renderToBuffer(<QuotePdfDocument quote={quote} />)
}

export function getQuotePdfResponseHeaders(
  quoteNumber: string | null | undefined,
) {
  const filename = getQuotePdfFilename(quoteNumber)
  return {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  }
}
