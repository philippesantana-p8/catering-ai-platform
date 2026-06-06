import type { QuoteAdditionalItem, QuoteDetail } from '@/app/quotes/[id]/quoteDetailTypes'
import type { AdditionalItem, Customer, Package } from '@/app/quotes/new/QuoteWizard'
import { fetchQuoteDetail } from './fetchQuoteDetail'
import type { CommercialRulesSnapshot } from './supabaseCommercialRules'
import { fetchSupabaseCommercialRules } from './supabaseCommercialRules'
import { supabase } from './supabase'

type QuoteRow = {
  event_id?: string | null
  customer_id?: string | null
  package_id?: string | null
}

type EventRow = {
  event_name?: string | null
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  address_line?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  adults_count?: number | null
  children_count?: number | null
  has_grill?: boolean | null
  grill_photo_required?: boolean | null
  grill_rental_required?: boolean | null
  grill_rental_qty?: number | null
  grill_notes?: string | null
  distance_from_base?: number | null
  grill_photo_url?: string | null
  grill_photo_media_id?: string | null
}

type QuoteAdditionalRow = {
  additional_item_id: string
  quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
}

function mapQuoteAdditionalRows(
  rows: QuoteAdditionalRow[],
): QuoteAdditionalItem[] {
  return rows
    .filter((row) => row.additional_item_id && (row.quantity ?? 0) > 0)
    .map((row) => ({
      item_id: row.additional_item_id,
      quantity: row.quantity,
      unit_price: row.unit_price,
      total_price: row.total_price,
    }))
}

function mergeEventIntoQuote(quote: QuoteDetail, event: EventRow | null): QuoteDetail {
  if (!event) return quote

  return {
    ...quote,
    event_name: event.event_name ?? quote.event_name,
    event_date: event.event_date ?? quote.event_date,
    start_time: event.start_time ?? quote.start_time,
    end_time: event.end_time ?? quote.end_time,
    address_line: event.address_line ?? quote.address_line,
    city: event.city ?? quote.city,
    state: event.state ?? quote.state,
    postal_code: event.postal_code ?? quote.postal_code,
    zip_code: event.postal_code ?? quote.zip_code,
    has_grill: event.has_grill ?? quote.has_grill,
    grill_photo_required: event.grill_photo_required ?? quote.grill_photo_required,
    grill_rental_required: event.grill_rental_required ?? quote.grill_rental_required,
    grill_rental_qty: event.grill_rental_qty ?? quote.grill_rental_qty,
    grill_notes: event.grill_notes ?? quote.grill_notes,
    mileage_distance: event.distance_from_base ?? quote.mileage_distance,
    adult_count: event.adults_count ?? quote.adult_count,
    grill_photo_url: event.grill_photo_url ?? quote.grill_photo_url,
    grill_photo_media_id:
      event.grill_photo_media_id ?? quote.grill_photo_media_id,
  }
}

function mergePackages(
  activePackages: Package[],
  linkedPackage: Package | null,
): Package[] {
  if (!linkedPackage) return activePackages
  if (activePackages.some((pkg) => pkg.id === linkedPackage.id)) {
    return activePackages
  }
  return [...activePackages, linkedPackage]
}

export type FetchQuoteForEditResult = {
  quote: QuoteDetail | null
  linkedCustomer: Customer | null
  packages: Package[]
  additionalItems: AdditionalItem[]
  commercialRules: CommercialRulesSnapshot
  fetchErrors: string[]
  error: { message: string } | null
}

export async function fetchQuoteForEdit(
  quoteId: string,
): Promise<FetchQuoteForEditResult> {
  const fetchErrors: string[] = []

  const [quoteRes, commercialRules] = await Promise.all([
    fetchQuoteDetail(quoteId),
    fetchSupabaseCommercialRules(),
  ])

  if (quoteRes.error || !quoteRes.data) {
    return {
      quote: null,
      linkedCustomer: null,
      packages: [],
      additionalItems: [],
      commercialRules,
      fetchErrors,
      error: quoteRes.error ?? { message: 'Cotação não encontrada.' },
    }
  }

  const { data: quoteRow, error: quoteRowError } = await supabase
    .from('quotes')
    .select('event_id, customer_id, package_id')
    .eq('id', quoteId)
    .eq('active', true)
    .maybeSingle()

  if (quoteRowError) {
    fetchErrors.push(`Cotação: ${quoteRowError.message}`)
  }

  const row = (quoteRow ?? {}) as QuoteRow
  const eventId = row.event_id ?? null
  const customerId = row.customer_id ?? quoteRes.data.customer_id ?? null
  const packageId = row.package_id ?? quoteRes.data.package_id ?? null

  const [
    eventRes,
    customerRes,
    linkedPackageRes,
    quoteAdditionalsRes,
    packagesRes,
    additionalRes,
  ] = await Promise.all([
    eventId
      ? supabase.from('events').select('*').eq('id', eventId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    customerId
      ? supabase.from('customers').select('*').eq('id', customerId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    packageId
      ? supabase.from('packages').select('*').eq('id', packageId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('quote_additional_items')
      .select('additional_item_id, quantity, unit_price, total_price')
      .eq('quote_id', quoteId),
    supabase
      .from('packages')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('additional_items')
      .select('*')
      .eq('active', true)
      .order('category_pt', { ascending: true })
      .order('display_order', { ascending: true }),
  ])

  if (eventRes.error) fetchErrors.push(`Evento: ${eventRes.error.message}`)
  if (customerRes.error) fetchErrors.push(`Cliente: ${customerRes.error.message}`)
  if (linkedPackageRes.error) {
    fetchErrors.push(`Pacote vinculado: ${linkedPackageRes.error.message}`)
  }
  if (quoteAdditionalsRes.error) {
    fetchErrors.push(`Adicionais da cotação: ${quoteAdditionalsRes.error.message}`)
  }
  if (packagesRes.error) fetchErrors.push(`Pacotes: ${packagesRes.error.message}`)
  if (additionalRes.error) {
    fetchErrors.push(`Catálogo de adicionais: ${additionalRes.error.message}`)
  }

  const mappedAdditionals = mapQuoteAdditionalRows(
    (quoteAdditionalsRes.data ?? []) as QuoteAdditionalRow[],
  )

  let quote = mergeEventIntoQuote(
    quoteRes.data,
    (eventRes.data as EventRow | null) ?? null,
  )

  if (mappedAdditionals.length > 0) {
    quote = { ...quote, additional_items: mappedAdditionals }
  }

  if (customerId && !quote.customer_id) {
    quote = { ...quote, customer_id: customerId }
  }

  if (packageId && !quote.package_id) {
    quote = { ...quote, package_id: packageId }
  }

  const linkedCustomer = (customerRes.data as Customer | null) ?? null
  const linkedPackage = (linkedPackageRes.data as Package | null) ?? null
  const packages = mergePackages(
    (packagesRes.data ?? []) as Package[],
    linkedPackage,
  )

  return {
    quote,
    linkedCustomer,
    packages,
    additionalItems: (additionalRes.data ?? []) as AdditionalItem[],
    commercialRules,
    fetchErrors,
    error: null,
  }
}
