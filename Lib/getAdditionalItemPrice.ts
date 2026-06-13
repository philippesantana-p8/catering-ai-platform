import { getCatalogItemSalePrice } from '@/Lib/itemCatalog'

/** Campos de preço possíveis no catálogo mestre (`catalog_items`). */
export type AdditionalItemPriceSource = {
  price?: unknown
  sale_price?: unknown
  current_price?: unknown
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Preço de venda do item no catálogo.
 * Usa `sale_price` com fallback em `price`.
 */
export function getAdditionalItemPrice(
  item: AdditionalItemPriceSource | null | undefined,
): number {
  return getCatalogItemSalePrice(item)
}

/** @deprecated Use getAdditionalItemPrice */
export function getAdditionalItemUnitPrice(
  item: AdditionalItemPriceSource | null | undefined,
): number {
  return getAdditionalItemPrice(item)
}

/** @deprecated Use getCatalogItemSalePrice from itemCatalog */
export { getCatalogItemSalePrice } from '@/Lib/itemCatalog'

/** Preço vigente com fallback catalog_items. */
export { resolveCatalogItemSalePrice } from '@/Lib/catalogItemPrices'
