/**
 * Colunas reais de `public.additional_items` (schema-safe).
 * Não inclui: unit_price, price_per_person, photo_url, name.
 */
export const ADDITIONAL_ITEMS_TABLE_COLUMNS = [
  'id',
  'company_id',
  'item_name',
  'price',
  'charge_type',
  'unit_label',
  'active',
  'created_at',
  'item_key',
  'label_pt',
  'label_en',
  'label_es',
  'category_key',
  'category_pt',
  'category_en',
  'category_es',
  'quantity',
  'unit',
  'quantity_2',
  'uom_2',
  'pricing_type',
  'image_url',
  'image_status',
  'image_notes',
  'currency_code',
  'display_order',
  'updated_at',
] as const

export type AdditionalItemsTableColumn =
  (typeof ADDITIONAL_ITEMS_TABLE_COLUMNS)[number]

export const ADDITIONAL_ITEMS_INSERT_COLUMNS = [
  'company_id',
  'item_name',
  'price',
  'charge_type',
  'unit_label',
  'active',
  'item_key',
  'label_pt',
  'label_en',
  'label_es',
  'category_key',
  'category_pt',
  'category_en',
  'category_es',
  'quantity',
  'unit',
  'quantity_2',
  'uom_2',
  'pricing_type',
  'image_url',
  'image_status',
  'image_notes',
  'currency_code',
  'display_order',
] as const satisfies ReadonlyArray<AdditionalItemsTableColumn>

export type AdditionalItemsInsertColumn =
  (typeof ADDITIONAL_ITEMS_INSERT_COLUMNS)[number]

export type AdditionalItemsInsertPayload = Partial<
  Record<AdditionalItemsInsertColumn, string | number | boolean | null>
>

/** Colunas para listagem no backoffice e selects do app. */
export const ADDITIONAL_ITEMS_LIST_COLUMNS = [
  'id',
  'item_key',
  'item_name',
  'label_pt',
  'category_pt',
  'price',
  'charge_type',
  'pricing_type',
  'unit_label',
  'currency_code',
  'display_order',
  'image_url',
  'image_status',
  'image_notes',
  'active',
] as const

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
