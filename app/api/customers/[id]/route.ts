import { getCdlCompanyId } from '@/Lib/cdlCompany'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const companyId = getCdlCompanyId()

  if (!companyId?.trim()) {
    return Response.json({ error: 'company_id não configurado.' }, { status: 500 })
  }

  let body: { active?: boolean }
  try {
    body = (await request.json()) as { active?: boolean }
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  if (body.active !== false) {
    return Response.json(
      { error: 'Somente desativação (active=false) é suportada.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('customers')
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .eq('active', true)
    .select('id')
    .maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!data?.id) {
    return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 })
  }

  return Response.json({ id: data.id, active: false })
}
