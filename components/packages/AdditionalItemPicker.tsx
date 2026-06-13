'use client'

import { BackofficeSelect } from '@/components/backoffice/BackofficeCardPrimitives'
import { getAdditionalItemPrice } from '@/Lib/getAdditionalItemPrice'

export type AdditionalItemOption = {
  id: string
  item_key?: string | null
  item_name?: string | null
  label_pt?: string | null
  category_pt?: string | null
  price?: number | null
  sale_price?: number | null
  can_be_package_item?: boolean | null
  can_be_side_item?: boolean | null
  can_be_additional?: boolean | null
  can_be_option_choice?: boolean | null
}

/** @deprecated Use AdditionalItemOption — alias semântico para o catálogo mestre. */
export type CatalogItemOption = AdditionalItemOption

function formatPickerLabel(item: AdditionalItemOption): string {
  const name = (item.item_name ?? item.label_pt ?? item.item_key ?? '—').trim()
  const category = (item.category_pt ?? 'Outros').trim()
  const price = getAdditionalItemPrice(item)
  return `${name} — ${category} — $${price.toFixed(2)}`
}

export default function AdditionalItemPicker({
  catalogItems,
  additionalItems,
  value,
  onChange,
  placeholder = 'Selecionar item do cadastro…',
}: {
  catalogItems?: ReadonlyArray<AdditionalItemOption>
  /** @deprecated Use catalogItems */
  additionalItems?: ReadonlyArray<AdditionalItemOption>
  value: string
  onChange: (catalogItemId: string, item: AdditionalItemOption | null) => void
  placeholder?: string
}) {
  const items = catalogItems ?? additionalItems ?? []

  const sorted = [...items].sort((a, b) => {
    const cat = (a.category_pt ?? '').localeCompare(b.category_pt ?? '', 'pt-BR')
    if (cat !== 0) return cat
    return (a.item_name ?? a.label_pt ?? '').localeCompare(
      b.item_name ?? b.label_pt ?? '',
      'pt-BR',
    )
  })

  return (
    <BackofficeSelect
      value={value}
      onChange={(nextId) => {
        const item = sorted.find((row) => row.id === nextId) ?? null
        onChange(nextId, item)
      }}
    >
      <option value="">{placeholder}</option>
      {sorted.map((item) => (
        <option key={item.id} value={item.id}>
          {formatPickerLabel(item)}
        </option>
      ))}
    </BackofficeSelect>
  )
}
