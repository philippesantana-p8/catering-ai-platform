import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'
import { pickAdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'
import { getCatalogItemImageUrl as resolveCatalogImageUrl } from '@/Lib/catalogItemVisual'
import { getCatalogItemSalePrice } from '@/Lib/itemCatalog'

export type AdditionalItemFieldSource = {
  item_key?: string | null
  item_name?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  category_key?: string | null
  category_pt?: string | null
  category_en?: string | null
  category_es?: string | null
  price?: number | null
  sale_price?: number | null
  current_price?: number | null
  charge_type?: string | null
  pricing_type?: string | null
  unit_label?: string | null
  currency_code?: string | null
  display_order?: number | null
  image_url?: string | null
  active?: boolean | null
}

export function getAdditionalItemCategoryKey(
  item: AdditionalItemFieldSource | null | undefined,
): string {
  return item?.category_key?.trim() || 'OUTROS'
}

export function getAdditionalItemCategoryLabel(
  item: AdditionalItemFieldSource | null | undefined,
): string {
  return (
    item?.category_pt?.trim() ||
    item?.category_en?.trim() ||
    item?.category_es?.trim() ||
    item?.category_key?.trim() ||
    'Outros'
  )
}

export function getAdditionalItemLabel(
  item: AdditionalItemFieldSource | null | undefined,
): string {
  return (
    item?.label_pt?.trim() ||
    item?.item_name?.trim() ||
    item?.label_en?.trim() ||
    item?.label_es?.trim() ||
    item?.item_key?.trim() ||
    'Item do catálogo'
  )
}

export function getAdditionalItemPrice(
  item: AdditionalItemFieldSource | null | undefined,
): number {
  return getCatalogItemSalePrice(item)
}
export function getAdditionalItemImageUrl(
  item: AdditionalItemFieldSource | null | undefined,
): string | null {
  return resolveCatalogImageUrl(item)
}

export function getAdditionalItemCurrencyCode(
  item: AdditionalItemFieldSource | null | undefined,
): string {
  return item?.currency_code?.trim() || 'USD'
}

export function getAdditionalItemDisplayOrder(
  item: AdditionalItemFieldSource | null | undefined,
): number {
  return Number(item?.display_order ?? 999)
}

export function mapAdditionalItemDraftToDeployed(
  draft: AdditionalItemsInsertPayload,
): AdditionalItemsInsertPayload {
  return pickAdditionalItemsInsertPayload(draft)
}
