/** Campos de preço possíveis no catálogo `additional_items` (somente os que existem no row). */
export type AdditionalItemPriceSource = {
  price?: unknown
  price_per_person?: unknown
  price_per_unit?: unknown
  amount?: unknown
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Preço unitário do item adicional — não usa `unit_price` (coluna inexistente no catálogo). */
export function getAdditionalItemUnitPrice(
  item: AdditionalItemPriceSource | null | undefined,
): number {
  if (!item) return 0

  const candidates = [
    item.price,
    item.price_per_person,
    item.price_per_unit,
    item.amount,
  ]

  for (const candidate of candidates) {
    const parsed = toNumber(candidate)
    if (parsed != null) return parsed
  }

  return 0
}
