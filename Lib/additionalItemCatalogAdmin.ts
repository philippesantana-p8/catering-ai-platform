import { calcMarginPercent } from '@/Lib/backofficeFinance'
import { getAdditionalItemCategory } from '@/Lib/additionalItemFieldAccess'
import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'

export const ADDITIONAL_ITEM_CATEGORY_ORDER = [
  'Frutos do mar',
  'Bovino',
  'Suíno',
  'Aves',
  'Acompanhamentos',
  'Bebidas',
  'Serviços',
  'Estrutura',
  'Sobremesas',
  'Outros',
] as const

export function normalizeAdditionalItemDraft(
  draft: AdditionalItemsInsertPayload,
): AdditionalItemsInsertPayload {
  const price = Number(draft.price ?? 0)
  const cost = Number(draft.cost ?? 0)
  const category = getAdditionalItemCategory(draft)

  return {
    ...draft,
    category_pt: String(draft.category_pt ?? '').trim() || category,
    margin_percent: calcMarginPercent(price, cost),
    charge_type:
      draft.pricing_type === 'PER_PERSON' ? 'PERSON' : draft.charge_type ?? 'UNIT',
  }
}

export function sortAdditionalCategories(categories: string[]): string[] {
  const unique = [...new Set(categories.filter(Boolean))]
  return unique.sort((a, b) => {
    const ai = ADDITIONAL_ITEM_CATEGORY_ORDER.indexOf(
      a as (typeof ADDITIONAL_ITEM_CATEGORY_ORDER)[number],
    )
    const bi = ADDITIONAL_ITEM_CATEGORY_ORDER.indexOf(
      b as (typeof ADDITIONAL_ITEM_CATEGORY_ORDER)[number],
    )
    const aRank = ai === -1 ? 999 : ai
    const bRank = bi === -1 ? 999 : bi
    if (aRank !== bRank) return aRank - bRank
    return a.localeCompare(b, 'pt-BR')
  })
}

export function groupAdditionalItemsByCategory<T extends Record<string, unknown>>(
  items: T[],
) {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const category = getAdditionalItemCategory(item)
    const list = groups.get(category) ?? []
    list.push(item)
    groups.set(category, list)
  }

  return sortAdditionalCategories([...groups.keys()]).map((category) => ({
    category,
    items: [...(groups.get(category) ?? [])].sort((a, b) => {
      const nameA = (a as { item_name?: string | null }).item_name ?? ''
      const nameB = (b as { item_name?: string | null }).item_name ?? ''
      return nameA.localeCompare(nameB, 'pt-BR')
    }),
  }))
}
