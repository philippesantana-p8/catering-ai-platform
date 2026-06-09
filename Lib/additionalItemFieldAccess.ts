import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'
import {
  pickAdditionalItemsInsertPayload,
  stripAdditionalItemsUpgradeFields,
} from '@/Lib/additionalItemsTableSchema'

export type AdditionalItemFieldSource = {
  category_pt?: string | null
  category_en?: string | null
  category_es?: string | null
  category_group?: string | null
  category?: string | null
  category_name?: string | null
  type?: string | null
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  cost?: number | null
  margin_percent?: number | null
  inventory_enabled?: boolean | null
  supplier_name?: string | null
  internal_notes?: string | null
}

export function getAdditionalItemCategory(
  item: AdditionalItemFieldSource | null | undefined,
): string {
  const category =
    item?.category_group?.trim() ||
    item?.category_pt?.trim() ||
    item?.category?.trim() ||
    item?.category_name?.trim() ||
    item?.type?.trim() ||
    'Outros'
  return category || 'Outros'
}

export function getAdditionalItemDescription(
  item: AdditionalItemFieldSource | null | undefined,
  language: 'pt' | 'en' | 'es' = 'pt',
): string {
  if (!item) return ''
  if (language === 'en') return item.description_en?.trim() || ''
  if (language === 'es') return item.description_es?.trim() || ''
  return item.description_pt?.trim() || ''
}

export function getAdditionalItemCost(
  item: AdditionalItemFieldSource | null | undefined,
): number {
  return Number(item?.cost ?? 0)
}

export function getAdditionalItemMarginPercent(
  item: AdditionalItemFieldSource | null | undefined,
): number {
  return Number(item?.margin_percent ?? 0)
}

/** Mapeia rascunho do formulário premium para colunas deployadas no Supabase. */
export function mapAdditionalItemDraftToDeployed(
  draft: Record<string, unknown>,
): AdditionalItemsInsertPayload {
  const category = getAdditionalItemCategory(draft as AdditionalItemFieldSource)

  const deployed: AdditionalItemsInsertPayload = {
    ...stripAdditionalItemsUpgradeFields(draft),
    category_pt: draft.category_pt?.toString().trim() || category,
    category_en: draft.category_en?.toString().trim() || undefined,
    category_es: draft.category_es?.toString().trim() || undefined,
  }

  return pickAdditionalItemsInsertPayload(deployed)
}
