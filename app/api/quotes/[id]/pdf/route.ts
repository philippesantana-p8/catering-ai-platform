import type { QuoteDetail } from '@/app/quotes/[id]/quoteDetailTypes'
import {
  generateQuotePdfBuffer,
  getQuotePdfResponseHeaders,
} from '@/Lib/generateQuotePdf'
import { supabase } from '@/Lib/supabase'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('quote_detail_view')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return new Response('Cotação não encontrada.', { status: 404 })
  }

  try {
    const buffer = await generateQuotePdfBuffer(data as QuoteDetail)
    const headers = getQuotePdfResponseHeaders(data as QuoteDetail)

    return new Response(new Uint8Array(buffer), { headers })
  } catch (pdfError) {
    console.error('PDF generation failed:', pdfError)
    return new Response('Erro ao gerar PDF.', { status: 500 })
  }
}
