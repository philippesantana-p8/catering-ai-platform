import { getCdlCompanyId } from '@/Lib/cdlCompany'
import { buildPackagesListSelect } from '@/Lib/packagesTableSchema'
import {
  pickPackagesUpdatePayload,
  type PackagesInsertPayload,
} from '@/Lib/packagesTableSchema'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function scopedPackageQuery(id: string) {
  const companyId = getCdlCompanyId()
  let query = supabase
    .from('packages')
    .select(buildPackagesListSelect())
    .eq('id', id)

  if (companyId?.trim()) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`)
  }

  return query
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const { data, error } = await scopedPackageQuery(id).maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return Response.json({ error: 'Pacote não encontrado.' }, { status: 404 })
  }

  return Response.json({ data })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  let body: PackagesInsertPayload & { active?: boolean }
  try {
    body = (await request.json()) as PackagesInsertPayload & { active?: boolean }
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const isDeactivateOnly =
    Object.keys(body).length === 1 && body.active === false

  const updatePayload: Record<string, unknown> = isDeactivateOnly
    ? { active: false }
  : {
      ...pickPackagesUpdatePayload(body),
      ...(body.package_name
        ? { package_name: body.package_name.toString().trim() }
        : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      updated_at: new Date().toISOString(),
    }

  const companyId = getCdlCompanyId()
  let query = supabase.from('packages').update(updatePayload).eq('id', id)

  if (companyId?.trim()) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`)
  }

  const { data, error } = await query.select('id').maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  if (!data?.id) {
    return Response.json({ error: 'Pacote não encontrado.' }, { status: 404 })
  }

  return Response.json({ id: data.id })
}
