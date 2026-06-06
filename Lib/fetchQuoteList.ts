import { getCdlCompanyId } from './cdlCompany'
import { supabase } from './supabase'

export type QuoteListGrillFields = {
  has_grill: boolean
  grill_photo_required: boolean
  grill_rental_required: boolean
}

export const QUOTE_LIST_GRILL_DEFAULTS: QuoteListGrillFields = {
  has_grill: false,
  grill_photo_required: false,
  grill_rental_required: false,
}

export type QuoteListItem = {
  id: string
  quote_number: string
  customer_name: string
  quote_status: string | null
  event_date: string | null
  created_at: string
  city: string | null
  state: string | null
  package_name: string | null
  quote_total: number | null
  reservation_amount: number | null
  balance_due: number | null
  physical_guest_count: number | null
  billable_guest_count: number | null
  has_additionals: boolean
  has_grill: boolean
  grill_photo_required: boolean
  grill_rental_required: boolean
  mileage_fee: number | null
}

type QuoteRow = {
  id: string
  quote_number: string | null
  quote_total: number | null
  quote_status: string | null
  created_at: string
  customer_id: string | null
  active: boolean | null
  reservation_amount: number | null
  balance_due: number | null
  physical_guest_count: number | null
  billable_guest_count: number | null
  additional_total: number | null
  mileage_fee: number | null
}

type ListViewRow = {
  id: string
  event_date?: string | null
  customer_name?: string | null
  city?: string | null
  state?: string | null
  package_name?: string | null
}

type CustomerRow = {
  id: string
  ab_name?: string | null
}

type GrillViewRow = {
  id: string
  has_grill?: boolean | null
  grill_photo_required?: boolean | null
  grill_rental_required?: boolean | null
}

/** Colunas base de `quotes` usadas na listagem (sem campos de churrasqueira). */
const QUOTE_LIST_SELECT =
  'id, quote_number, quote_total, quote_status, created_at, customer_id, active, reservation_amount, balance_due, physical_guest_count, billable_guest_count, additional_total, mileage_fee'

function isActiveQuote(row: Pick<QuoteRow, 'active'>): row is QuoteRow & { active: true } {
  return row.active === true
}

function resolveCustomerName(
  abName: string | null | undefined,
  detailName: string | null | undefined,
): string {
  return abName?.trim() || detailName?.trim() || 'Cliente não informado'
}

function resolveGrillFields(
  row: GrillViewRow | undefined,
): QuoteListGrillFields {
  if (!row) return QUOTE_LIST_GRILL_DEFAULTS

  return {
    has_grill: row.has_grill ?? false,
    grill_photo_required: row.grill_photo_required ?? false,
    grill_rental_required: row.grill_rental_required ?? false,
  }
}

async function fetchGrillFieldsByQuoteId(
  quoteIds: string[],
): Promise<Map<string, QuoteListGrillFields>> {
  if (quoteIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('quote_detail_view')
    .select('id, has_grill, grill_photo_required, grill_rental_required')
    .in('id', quoteIds)

  if (error) {
    console.warn(
      '[CDL Quote] grill fields unavailable in quote_detail_view; using defaults:',
      error.message,
    )
    return new Map()
  }

  return new Map(
    ((data ?? []) as GrillViewRow[]).map((row) => [
      row.id,
      resolveGrillFields(row),
    ]),
  )
}

export function sortQuoteListItems(items: QuoteListItem[]): QuoteListItem[] {
  return [...items].sort((a, b) => {
    const eventA = a.event_date ? new Date(a.event_date).getTime() : 0
    const eventB = b.event_date ? new Date(b.event_date).getTime() : 0
    if (eventA !== eventB) return eventB - eventA
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

/**
 * Lista cotações ativas da tabela `quotes`.
 * Usa `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Lib/supabase.ts).
 * Campos de churrasqueira vêm de `quote_detail_view` quando disponíveis; senão, defaults seguros.
 */
export async function fetchQuoteList() {
  const companyId = getCdlCompanyId()

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(QUOTE_LIST_SELECT)
    .eq('active', true)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null as QuoteListItem[] | null, error }
  }

  const rows = ((quotes ?? []) as QuoteRow[]).filter(isActiveQuote)
  if (rows.length === 0) {
    return { data: [], error: null }
  }

  const quoteIds = rows.map((row) => row.id)
  const customerIds = [
    ...new Set(rows.map((row) => row.customer_id).filter(Boolean)),
  ] as string[]

  const [customersRes, listViewRes, grillMap] = await Promise.all([
    customerIds.length > 0
      ? supabase.from('customers').select('id, ab_name').in('id', customerIds)
      : Promise.resolve({ data: [] as CustomerRow[], error: null }),
    supabase
      .from('quote_list_view')
      .select('id, event_date, customer_name, city, state, package_name')
      .in('id', quoteIds),
    fetchGrillFieldsByQuoteId(quoteIds),
  ])

  let listViewRows = (listViewRes.data ?? []) as ListViewRow[]
  if (listViewRes.error) {
    console.warn('[CDL Quote] quote_list_view enrichment failed:', listViewRes.error.message)
    const { data: detailRows } = await supabase
      .from('quote_detail_view')
      .select('id, event_date, customer_name, city, state, package_name_pt')
      .in('id', quoteIds)
    listViewRows = (detailRows ?? []).map((row) => ({
      id: row.id as string,
      event_date: row.event_date as string | null,
      customer_name: row.customer_name as string | null,
      city: row.city as string | null,
      state: row.state as string | null,
      package_name: row.package_name_pt as string | null,
    }))
  }

  if (customersRes.error) {
    return { data: null, error: customersRes.error }
  }

  const customerMap = new Map(
    (customersRes.data ?? []).map((customer) => [
      customer.id,
      customer.ab_name,
    ]),
  )
  const listViewMap = new Map(listViewRows.map((row) => [row.id, row]))

  const data = rows.map((row) => {
    const view = listViewMap.get(row.id)
    const abName = row.customer_id
      ? customerMap.get(row.customer_id)
      : undefined
    const grill = grillMap.get(row.id) ?? QUOTE_LIST_GRILL_DEFAULTS

    return {
      id: row.id,
      quote_number: row.quote_number ?? '—',
      customer_name: resolveCustomerName(abName, view?.customer_name),
      quote_status: row.quote_status,
      event_date: view?.event_date ?? null,
      created_at: row.created_at,
      city: view?.city ?? null,
      state: view?.state ?? null,
      package_name: view?.package_name ?? null,
      quote_total: row.quote_total,
      reservation_amount: row.reservation_amount,
      balance_due: row.balance_due,
      physical_guest_count: row.physical_guest_count,
      billable_guest_count: row.billable_guest_count,
      has_additionals: Number(row.additional_total ?? 0) > 0,
      has_grill: grill.has_grill,
      grill_photo_required: grill.grill_photo_required,
      grill_rental_required: grill.grill_rental_required,
      mileage_fee: row.mileage_fee,
    } satisfies QuoteListItem
  })

  return { data: sortQuoteListItems(data), error: null }
}
