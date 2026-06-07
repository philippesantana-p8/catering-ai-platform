import { getCdlCompanyId } from '@/Lib/cdlCompany'
import {
  buildAdditionalItemsListSelect,
  pickAdditionalItemsUpdatePayload,
  type AdditionalItemsInsertPayload,
} from '@/Lib/additionalItemsTableSchema'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  let body: AdditionalItemsInsertPayload & { active?: boolean }
  try {
    body = (await request.json()) as AdditionalItemsInsertPayload & {
      active?: boolean
    }
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const isDeactivateOnly =
    Object.keys(body).length === 1 && body.active === false

  const updatePayload: Record<string, unknown> = isDeactivateOnly
    ? { active: false }
    : {
        ...pickAdditionalItemsUpdatePayload(body),
        ...(body.unit_price != null || body.price != null
          ? {
              unit_price: Number(body.unit_price ?? body.price) || 0,
              price: Number(body.unit_price ?? body.price) || 0,
            }
          : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        updated_at: new Date().toISOString(),
      }

  const companyId = getCdlCompanyId()
  let query = supabase
    .from('additional_items')
    .update(updatePayload)
    .eq('id', id)

  if (companyId?.trim()) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`)
  }

  const { data, error } = await query.select('id').maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  if (!data?.id) {
    return Response.json({ error: 'Item não encontrado.' }, { status: 404 })
  }

  return Response.json({ id: data.id })
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const companyId = getCdlCompanyId()

  let query = supabase
    .from('additional_items')
    .select(buildAdditionalItemsListSelect())
    .eq('id', id)

  if (companyId?.trim()) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return Response.json({ error: 'Item não encontrado.' }, { status: 404 })
  }

  return Response.json({ data })
}
