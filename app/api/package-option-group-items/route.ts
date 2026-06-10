import { getCdlCompanyId } from '@/Lib/cdlCompany'
import { insertPackageOptionGroupItem } from '@/Lib/writePackageConfig'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const companyId = getCdlCompanyId()
  if (!companyId?.trim()) {
    return Response.json({ error: 'company_id não configurado.' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const { data, error } = await insertPackageOptionGroupItem(body)
  if (error) {
    return Response.json(
      { error: error.message ?? 'Não foi possível criar opção.' },
      { status: 500 },
    )
  }
  return Response.json({ data }, { status: 201 })
}
