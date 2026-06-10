import { getActiveCompanyId } from '@/Lib/tenant/resolveTenant'

/** CDL tenant default when env is not configured (single-tenant deployment). */
export const CDL_DEFAULT_COMPANY_ID = '65fd576f-8d97-49ba-bf38-61bc1e94e94a'

/** @deprecated Prefer getActiveCompanyId() from Lib/tenant */
export function getCdlCompanyId(): string {
  return getActiveCompanyId()
}

export { getActiveCompanyId }
