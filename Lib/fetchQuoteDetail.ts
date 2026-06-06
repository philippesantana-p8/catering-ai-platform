import { supabase } from './supabase'
import type { QuoteDetail } from '@/app/quotes/[id]/quoteDetailTypes'

const OFFICIAL_GUEST_COLUMNS =
  'adult_count, children_under_3_count, children_4_to_12_count, physical_guest_count, billable_guest_count'

export async function fetchQuoteDetail(id: string) {
  const [viewRes, guestRes] = await Promise.all([
    supabase.from('quote_detail_view').select('*').eq('id', id).single(),
    supabase
      .from('quotes')
      .select(OFFICIAL_GUEST_COLUMNS)
      .eq('id', id)
      .maybeSingle(),
  ])

  if (viewRes.error) {
    return { data: null as QuoteDetail | null, error: viewRes.error }
  }

  if (guestRes.error) {
    console.error(
      `[CDL Quote] Failed to load official guest fields for quote ${id}:`,
      guestRes.error.message,
    )
  }

  const data = {
    ...viewRes.data,
    ...(guestRes.data ?? {}),
  } as QuoteDetail

  return { data, error: null }
}
