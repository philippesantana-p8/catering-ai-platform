export function calcMarginPercent(
  price: number | null | undefined,
  cost: number | null | undefined,
): number {
  const sale = Number(price ?? 0)
  const unitCost = Number(cost ?? 0)
  if (!Number.isFinite(sale) || sale <= 0) return 0
  return Math.round(((sale - unitCost) / sale) * 10000) / 100
}

export function calcProfit(
  price: number | null | undefined,
  cost: number | null | undefined,
): number {
  return Math.round((Number(price ?? 0) - Number(cost ?? 0)) * 100) / 100
}

export function formatUsd(value: number | null | undefined): string {
  return `$${Number(value ?? 0).toFixed(2)}`
}
