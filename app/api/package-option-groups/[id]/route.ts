import {
  deletePackageOptionGroup,
  updatePackageOptionGroup,
} from '@/Lib/writePackageConfig'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const { data, error } = await updatePackageOptionGroup(id, body)
  if (error) {
    return Response.json(
      { error: error.message ?? 'Não foi possível atualizar grupo.' },
      { status: 500 },
    )
  }
  return Response.json({ data })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const { error } = await deletePackageOptionGroup(id)
  if (error) {
    return Response.json(
      { error: error.message ?? 'Não foi possível excluir grupo.' },
      { status: 500 },
    )
  }
  return Response.json({ ok: true })
}
