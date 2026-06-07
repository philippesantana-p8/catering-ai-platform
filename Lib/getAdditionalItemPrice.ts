/** Campos de preço possíveis no catálogo `additional_items`. */
export type AdditionalItemPriceSource = {
  price?: unknown
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Preço do item adicional no catálogo.
 * Usa `price` como fonte principal; fallback 0.
 */
export function getAdditionalItemPrice(
  item: AdditionalItemPriceSource | null | undefined,
): number {
  if (!item) return 0
  return toNumber(item.price) ?? 0
}

/** @deprecated Use getAdditionalItemPrice */
export function getAdditionalItemUnitPrice(
  item: AdditionalItemPriceSource | null | undefined,
): number {
  return getAdditionalItemPrice(item)
}
