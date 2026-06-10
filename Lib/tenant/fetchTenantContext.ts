import { supabase } from '@/Lib/supabase'
import type { Branch, Company, FeatureFlagKey, TenantContext } from './types'
import {
  getActiveBranchIdFromEnv,
  getActiveCompanyId,
  getActiveRoleFromEnv,
} from './resolveTenant'

export async function fetchTenantContext(options?: {
  companyId?: string
  branchId?: string | null
}): Promise<TenantContext> {
  const companyId = options?.companyId?.trim() || getActiveCompanyId()
  const envBranchId = options?.branchId ?? getActiveBranchIdFromEnv()

  const [companyRes, branchesRes, flagsRes] = await Promise.all([
    supabase
      .from('companies')
      .select(
        'id, franchise_group_id, company_name, company_code, legal_name, trade_name, slug, currency_code, default_language, timezone, subscription_status, google_calendar_enabled, google_calendar_id, google_calendar_timezone, active',
      )
      .eq('id', companyId)
      .maybeSingle(),
    supabase
      .from('branches')
      .select(
        'id, company_id, name, slug, branch_code, city, state, country, timezone, google_calendar_enabled, google_calendar_id, service_radius_miles, mileage_fee_per_mile, active',
      )
      .eq('company_id', companyId)
      .eq('active', true)
      .order('name'),
    supabase
      .from('feature_flags')
      .select('feature_key, enabled')
      .eq('company_id', companyId),
  ])

  const company = (companyRes.data as Company | null) ?? null
  const branches = (branchesRes.data ?? []) as Branch[]

  let branchId = envBranchId
  if (!branchId && branches.length === 1) {
    branchId = branches[0]!.id
  }

  const branch =
    branchId != null
      ? branches.find((row) => row.id === branchId) ?? null
      : null

  const featureFlags: Record<string, boolean> = {}
  for (const row of flagsRes.data ?? []) {
    featureFlags[String(row.feature_key)] = Boolean(row.enabled)
  }

  return {
    companyId,
    company,
    branchId: branch?.id ?? branchId,
    branch,
    branches,
    role: getActiveRoleFromEnv(),
    featureFlags: featureFlags as Partial<Record<FeatureFlagKey, boolean>>,
  }
}
