import { getCdlCompanyId } from '@/Lib/cdlCompany'
import { fetchAdditionalItems } from '@/Lib/fetchAdditionalItems'
import { getAdditionalItemPrice } from '@/Lib/getAdditionalItemPrice'
import {
  pickAdditionalItemsInsertPayload,
  type AdditionalItemsInsertPayload,
} from '@/Lib/additionalItemsTableSchema'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function itemMatchesSearch(
  item: {
    item_key?: string | null
    item_name?: string | null
    label_pt?: string | null
    category_pt?: string | null
  },
  query: string,
) {
  const haystack = [
    item.item_key,
    item.item_name,
    item.label_pt,
    item.category_pt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const activeFilter = url.searchParams.get('active')
  const category = url.searchParams.get('category')?.trim() ?? ''

  const { data, error } = await fetchAdditionalItems({
    includeInactive: activeFilter === 'all',
    activeOnly: activeFilter === 'true',
  })

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? 'Não foi possível buscar itens adicionais.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  let result = data
  if (query) {
    result = result.filter((item) => itemMatchesSearch(item, query))
  }
  if (category) {
    result = result.filter(
      (item) => (item.category_pt ?? '').toLowerCase() === category.toLowerCase(),
    )
  }

  return Response.json(
    { data: result },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
  )
}

export async function POST(request: Request) {
  const companyId = getCdlCompanyId()
  if (!companyId?.trim()) {
    return Response.json({ error: 'company_id não configurado.' }, { status: 500 })
  }

  let body: AdditionalItemsInsertPayload
  try {
    body = (await request.json()) as AdditionalItemsInsertPayload
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  if (!body.item_key?.toString().trim()) {
    return Response.json({ error: 'item_key é obrigatório.' }, { status: 400 })
  }
  if (!body.item_name?.toString().trim()) {
    return Response.json({ error: 'item_name é obrigatório.' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const price = getAdditionalItemPrice(body)
  const payload = {
    ...pickAdditionalItemsInsertPayload(body),
    company_id: companyId,
    price,
    active: body.active !== false,
    display_order: Number(body.display_order) || 0,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('additional_items')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ id: data?.id }, { status: 201 })
}
