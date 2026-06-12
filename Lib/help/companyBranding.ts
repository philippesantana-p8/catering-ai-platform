import type { Company } from '@/Lib/tenant/types'

export type CompanyBrand = {
  companyId: string
  displayName: string
  logoUrl: string | null
  initials: string
}

export function resolveCompanyDisplayName(company: Company | null): string {
  const name =
    company?.trade_name?.trim() ||
    company?.company_name?.trim() ||
    company?.legal_name?.trim()
  return name || 'Catering Help'
}

export function resolveCompanyLogoUrl(company: Company | null): string | null {
  const fromDb =
    company?.logo_url?.trim() || company?.brand_logo_url?.trim() || null
  if (fromDb) return fromDb

  const fromEnv =
    process.env.NEXT_PUBLIC_COMPANY_LOGO_URL?.trim() ||
    process.env.NEXT_PUBLIC_TENANT_LOGO_URL?.trim() ||
    null
  return fromEnv || null
}

export function resolveCompanyInitials(
  company: Company | null,
  displayName?: string,
): string {
  const code = company?.company_code?.trim()
  if (code) return code.slice(0, 4).toUpperCase()

  const name = displayName ?? resolveCompanyDisplayName(company)
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 3).toUpperCase()
  return words
    .slice(0, 3)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
}

export function resolveCompanyBrand(
  companyId: string,
  company: Company | null,
): CompanyBrand {
  const displayName = resolveCompanyDisplayName(company)
  return {
    companyId,
    displayName,
    logoUrl: resolveCompanyLogoUrl(company),
    initials: resolveCompanyInitials(company, displayName),
  }
}
