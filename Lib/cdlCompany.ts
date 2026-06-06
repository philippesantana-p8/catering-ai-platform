/** CDL tenant default when env is not configured (single-tenant deployment). */
export const CDL_DEFAULT_COMPANY_ID = '65fd576f-8d97-49ba-bf38-61bc1e94e94a'

export function getCdlCompanyId(): string {
  return (
    process.env.NEXT_PUBLIC_CDL_COMPANY_ID?.trim() ||
    process.env.CDL_COMPANY_ID?.trim() ||
    CDL_DEFAULT_COMPANY_ID
  )
}
