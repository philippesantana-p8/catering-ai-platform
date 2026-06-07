import type { QuoteDetail } from '@/app/quotes/[id]/quoteDetailTypes'
import type { CustomerNameSource } from '@/Lib/getCustomerDisplayName'
import { supabase } from './supabase'

function normalizeQuoteDetailRow(
  raw: Record<string, unknown>,
): QuoteDetail {
  const viewDisplayName = raw.customer_display_name
  const viewCustomerLabel = raw.customer_name
  const displayFromView =
    (typeof viewDisplayName === 'string' ? viewDisplayName : null) ??
    (typeof viewCustomerLabel === 'string' ? viewCustomerLabel : null)
  const customerFields: CustomerNameSource = {
    ab_name:
      (raw.ab_name as string | null | undefined) ?? displayFromView,
    full_name: raw.full_name as string | null | undefined,
    contact_name: raw.contact_name as string | null | undefined,
    company_name: raw.company_name as string | null | undefined,
    email:
      (raw.email as string | null | undefined) ??
      (raw.customer_email as string | null | undefined),
    phone:
      (raw.phone as string | null | undefined) ??
      (raw.customer_phone as string | null | undefined),
  }

  const {
    customer_name: _legacyViewAlias,
    customer_display_name: _viewDisplayAlias,
    ...rest
  } = raw

  return {
    ...rest,
    ...customerFields,
  } as QuoteDetail
}

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

  const data = normalizeQuoteDetailRow({
    ...(viewRes.data as Record<string, unknown>),
    ...(guestRes.data ?? {}),
  })

  return { data, error: null }
}
