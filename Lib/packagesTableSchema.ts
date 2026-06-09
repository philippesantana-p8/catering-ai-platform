/**
 * Schema de `public.packages` — colunas **deployadas** no Supabase hoje.
 * Campos do upgrade premium ficam em PACKAGES_UPGRADE_COLUMNS (não usar em SELECT/INSERT até migration).
 */
export const PACKAGES_DEPLOYED_COLUMNS = [
  'company_id',
  'package_key',
  'package_name',
  'label_pt',
  'label_en',
  'label_es',
  'description',
  'description_pt',
  'description_en',
  'description_es',
  'price_per_person',
  'currency_code',
  'display_order',
  'image_url',
  'active',
  'created_at',
  'updated_at',
] as const

/** Colunas do upgrade premium — executar scripts/sql/packages-catalog-upgrade.sql antes de usar. */
export const PACKAGES_UPGRADE_COLUMNS = [
  'items_description_pt',
  'items_description_en',
  'items_description_es',
  'garnish_description_pt',
  'garnish_description_en',
  'garnish_description_es',
  'card_description_pt',
  'card_description_en',
  'card_description_es',
  'package_type',
  'base_package_code',
  'has_garnish',
  'garnish_price_per_person',
  'cost_per_person',
  'margin_percent',
  'inventory_enabled',
] as const

export const PACKAGES_TABLE_COLUMNS = [
  ...PACKAGES_DEPLOYED_COLUMNS,
  ...PACKAGES_UPGRADE_COLUMNS,
] as const

export type PackagesTableColumn = (typeof PACKAGES_TABLE_COLUMNS)[number]

export const PACKAGES_INSERT_COLUMNS = [
  'company_id',
  'package_key',
  'package_name',
  'label_pt',
  'label_en',
  'label_es',
  'description_pt',
  'description_en',
  'description_es',
  'price_per_person',
  'currency_code',
  'display_order',
  'image_url',
  'active',
] as const satisfies ReadonlyArray<PackagesTableColumn>

export type PackagesInsertColumn = (typeof PACKAGES_INSERT_COLUMNS)[number]

export type PackagesInsertPayload = Partial<
  Record<PackagesInsertColumn, string | number | boolean | null>
> &
  Partial<Record<(typeof PACKAGES_UPGRADE_COLUMNS)[number], string | number | boolean | null>>

/** SELECT seguro — apenas colunas existentes no banco. */
export const PACKAGES_LIST_COLUMNS = [
  'id',
  'package_key',
  'package_name',
  'label_pt',
  'label_en',
  'label_es',
  'description_pt',
  'description_en',
  'description_es',
  'price_per_person',
  'currency_code',
  'display_order',
  'image_url',
  'active',
  'updated_at',
] as const

const PACKAGES_TABLE_COLUMN_SET = new Set<string>(PACKAGES_TABLE_COLUMNS)
const PACKAGES_INSERT_COLUMN_SET = new Set<string>(PACKAGES_INSERT_COLUMNS)

export function isPackagesTableColumn(key: string): key is PackagesTableColumn {
  return PACKAGES_TABLE_COLUMN_SET.has(key)
}

export function buildPackagesListSelect(): string {
  return PACKAGES_LIST_COLUMNS.join(', ')
}

export function pickPackagesInsertPayload(
  row: PackagesInsertPayload,
): Record<string, string | number | boolean | null> {
  const payload: Record<string, string | number | boolean | null> = {}

  for (const key of PACKAGES_INSERT_COLUMNS) {
    if (!(key in row)) continue
    const value = row[key]
    if (value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    payload[key] = value
  }

  return payload
}

export function pickPackagesUpdatePayload(
  row: PackagesInsertPayload,
): Record<string, string | number | boolean | null> {
  const payload = pickPackagesInsertPayload(row)
  delete payload.company_id
  return payload
}

/** Remove campos de upgrade que ainda não existem no banco. */
export function stripPackagesUpgradeFields<T extends Record<string, unknown>>(
  row: T,
): T {
  const next = { ...row }
  for (const key of PACKAGES_UPGRADE_COLUMNS) {
    delete next[key]
  }
  return next
}

export function isPackagesDeployedInsertColumn(
  key: string,
): key is PackagesInsertColumn {
  return PACKAGES_INSERT_COLUMN_SET.has(key)
}
