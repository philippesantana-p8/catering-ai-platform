/**
 * Colunas reais de `public.additional_items` (inferidas de queries do wizard).
 * `image_url` existe no catálogo; upload de imagem ainda não implementado.
 */
export const ADDITIONAL_ITEMS_TABLE_COLUMNS = [
  'company_id',
  'item_key',
  'label_pt',
  'label_en',
  'label_es',
  'category_pt',
  'category_en',
  'category_es',
  'unit_price',
  'price',
  'pricing_type',
  'charge_type',
  'quantity',
  'unit',
  'quantity_2',
  'uom_2',
  'unit_label',
  'display_order',
  'image_url',
  'photo_url',
  'active',
  'created_at',
  'updated_at',
] as const

export type AdditionalItemsTableColumn =
  (typeof ADDITIONAL_ITEMS_TABLE_COLUMNS)[number]

export const ADDITIONAL_ITEMS_INSERT_COLUMNS = [
  'company_id',
  'item_key',
  'label_pt',
  'label_en',
  'label_es',
  'category_pt',
  'category_en',
  'category_es',
  'unit_price',
  'price',
  'pricing_type',
  'charge_type',
  'quantity',
  'unit',
  'quantity_2',
  'uom_2',
  'unit_label',
  'display_order',
  'image_url',
  'active',
] as const satisfies ReadonlyArray<AdditionalItemsTableColumn>

export type AdditionalItemsInsertColumn =
  (typeof ADDITIONAL_ITEMS_INSERT_COLUMNS)[number]

export type AdditionalItemsInsertPayload = Partial<
  Record<
    AdditionalItemsInsertColumn,
    string | number | boolean | null
  >
>

export const ADDITIONAL_ITEMS_LIST_COLUMNS = [
  'id',
  'item_key',
  'label_pt',
  'label_en',
  'label_es',
  'category_pt',
  'category_en',
  'category_es',
  'unit_price',
  'price',
  'pricing_type',
  'charge_type',
  'quantity',
  'unit',
  'quantity_2',
  'uom_2',
  'unit_label',
  'display_order',
  'image_url',
  'photo_url',
  'active',
  'updated_at',
] as const

const ADDITIONAL_ITEMS_TABLE_COLUMN_SET = new Set<string>(
  ADDITIONAL_ITEMS_TABLE_COLUMNS,
)

export function buildAdditionalItemsListSelect(): string {
  return ADDITIONAL_ITEMS_LIST_COLUMNS.join(', ')
}

export function pickAdditionalItemsInsertPayload(
  row: AdditionalItemsInsertPayload,
): Record<string, string | number | boolean | null> {
  const payload: Record<string, string | number | boolean | null> = {}

  for (const key of ADDITIONAL_ITEMS_INSERT_COLUMNS) {
    if (!(key in row)) continue
    const value = row[key]
    if (value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    payload[key] = value
  }

  return payload
}

export function pickAdditionalItemsUpdatePayload(
  row: AdditionalItemsInsertPayload,
): Record<string, string | number | boolean | null> {
  const payload = pickAdditionalItemsInsertPayload(row)
  delete payload.company_id
  return payload
}
