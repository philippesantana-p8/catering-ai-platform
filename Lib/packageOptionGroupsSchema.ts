/**
 * Colunas reais Supabase para opções inclusas de pacote.
 *
 * package_option_groups:
 *   option_group_key, label_pt, label_en, label_es, required, active, ...
 *
 * package_option_group_items:
 *   option_item_key, label_pt, label_en, label_es, active, ...
 *
 * NÃO usar: group_key, title_pt, is_required, is_active, item_key
 */
export const PACKAGE_OPTION_GROUP_ITEM_COLUMNS = [
  'id',
  'company_id',
  'option_group_id',
  'additional_item_id',
  'option_item_key',
  'label_pt',
  'label_en',
  'label_es',
  'display_order',
  'active',
  'price_delta',
] as const

export const PACKAGE_OPTION_GROUP_COLUMNS = [
  'id',
  'company_id',
  'package_id',
  'option_group_key',
  'group_key',
  'label_pt',
  'label_en',
  'label_es',
  'min_choices',
  'max_choices',
  'required',
  'blocks_additional_items',
  'display_order',
  'active',
] as const

export function buildPackageOptionGroupsSelect(): string {
  const nested = PACKAGE_OPTION_GROUP_ITEM_COLUMNS.join(',\n        ')
  const parent = PACKAGE_OPTION_GROUP_COLUMNS.join(',\n      ')
  return `
      ${parent},
      package_option_group_items (
        ${nested}
      )
    `
}
