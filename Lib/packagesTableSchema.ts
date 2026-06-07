/**
 * Colunas reais de `public.packages` (inferidas de queries e scripts de seed).
 * `company_id` é opcional — incluir via migração para multi-empresa.
 */
export const PACKAGES_TABLE_COLUMNS = [
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
  'photo_url',
  'active',
  'created_at',
  'updated_at',
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
  Record<
    PackagesInsertColumn,
    string | number | boolean | null
  >
>

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
  'photo_url',
  'active',
  'updated_at',
] as const

const PACKAGES_TABLE_COLUMN_SET = new Set<string>(PACKAGES_TABLE_COLUMNS)

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
