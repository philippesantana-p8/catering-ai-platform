import { fetchTenantContext } from '@/Lib/tenant/fetchTenantContext'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await fetchTenantContext()
    return Response.json(
      { data: context },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar contexto do tenant.',
      },
      { status: 500 },
    )
  }
}
