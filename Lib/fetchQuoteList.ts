import { getCdlCompanyId } from './cdlCompany'
import { supabase } from './supabase'

export type QuoteListItem = {
  id: string
  quote_number: string
  customer_name: string
  event_date: string | null
  quote_total: number | null
  quote_status: string | null
  created_at: string
}

type QuoteRow = {
  id: string
  quote_number: string | null
  quote_total: number | null
  quote_status: string | null
  created_at: string
  customer_id: string | null
}

type CustomerRow = {
  id: string
  ab_name?: string | null
}

type QuoteDetailRow = {
  id: string
  event_date?: string | null
  customer_name?: string | null
}

function resolveCustomerName(
  abName: string | null | undefined,
  detailName: string | null | undefined,
): string {
  return abName?.trim() || detailName?.trim() || 'Cliente não informado'
}

export async function fetchQuoteList() {
  const companyId = getCdlCompanyId()

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(
      'id, quote_number, quote_total, quote_status, created_at, customer_id',
    )
    .eq('active', true)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null as QuoteListItem[] | null, error }
  }

  const rows = (quotes ?? []) as QuoteRow[]
  if (rows.length === 0) {
    return { data: [], error: null }
  }

  const quoteIds = rows.map((row) => row.id)
  const customerIds = [
    ...new Set(rows.map((row) => row.customer_id).filter(Boolean)),
  ] as string[]

  const [customersRes, detailsRes] = await Promise.all([
    customerIds.length > 0
      ? supabase.from('customers').select('id, ab_name').in('id', customerIds)
      : Promise.resolve({ data: [] as CustomerRow[], error: null }),
    supabase
      .from('quote_detail_view')
      .select('id, event_date, customer_name')
      .in('id', quoteIds),
  ])

  if (customersRes.error) {
    return { data: null, error: customersRes.error }
  }

  if (detailsRes.error) {
    return { data: null, error: detailsRes.error }
  }

  const customerMap = new Map(
    (customersRes.data ?? []).map((customer) => [
      customer.id,
      customer.ab_name,
    ]),
  )
  const detailMap = new Map(
    (detailsRes.data ?? []).map((detail) => [detail.id, detail]),
  )

  const data: QuoteListItem[] = rows.map((row) => {
    const detail = detailMap.get(row.id) as QuoteDetailRow | undefined
    const abName = row.customer_id
      ? customerMap.get(row.customer_id)
      : undefined

    return {
      id: row.id,
      quote_number: row.quote_number ?? '—',
      customer_name: resolveCustomerName(abName, detail?.customer_name),
      event_date: detail?.event_date ?? null,
      quote_total: row.quote_total,
      quote_status: row.quote_status,
      created_at: row.created_at,
    }
  })

  return { data, error: null }
}
