'use client'

import {
  BackofficeField,
  BackofficeInput,
  BackofficeSelect,
} from '@/components/backoffice/BackofficeCardPrimitives'
import { BackofficeFormSectionTitle } from '@/components/backoffice/BackofficeSectionPrimitives'
import { ADDITIONAL_ITEM_CATEGORY_ORDER } from '@/Lib/additionalItemCatalogAdmin'
import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'

export const EMPTY_ADDITIONAL_ITEM_ROW: AdditionalItemsInsertPayload = {
  item_key: '',
  item_name: '',
  label_pt: '',
  label_en: '',
  label_es: '',
  category_key: '',
  category_pt: '',
  category_en: '',
  category_es: '',
  price: 0,
  charge_type: 'UNIT',
  pricing_type: 'PER_UNIT',
  unit_label: 'UN',
  currency_code: 'USD',
  display_order: 0,
  image_url: '',
  image_status: '',
  image_notes: '',
  quantity: 0,
  unit: '',
  quantity_2: 0,
  uom_2: '',
  active: true,
}

export function additionalItemDraftFromListItem(
  item: Record<string, unknown>,
): AdditionalItemsInsertPayload {
  return {
    item_key: String(item.item_key ?? ''),
    item_name: String(item.item_name ?? ''),
    label_pt: String(item.label_pt ?? ''),
    label_en: String(item.label_en ?? ''),
    label_es: String(item.label_es ?? ''),
    category_key: String(item.category_key ?? ''),
    category_pt: String(item.category_pt ?? ''),
    category_en: String(item.category_en ?? ''),
    category_es: String(item.category_es ?? ''),
    price: Number(item.price ?? 0),
    charge_type: String(item.charge_type ?? 'UNIT'),
    pricing_type: String(item.pricing_type ?? 'PER_UNIT'),
    unit_label: String(item.unit_label ?? 'UN'),
    currency_code: String(item.currency_code ?? 'USD'),
    display_order: Number(item.display_order ?? 0),
    image_url: String(item.image_url ?? ''),
    image_status: String(item.image_status ?? ''),
    image_notes: item.image_notes == null ? null : String(item.image_notes),
    quantity: Number(item.quantity ?? 0),
    unit: String(item.unit ?? ''),
    quantity_2: Number(item.quantity_2 ?? 0),
    uom_2: String(item.uom_2 ?? ''),
    active: item.active !== false,
  }
}

export function AdditionalItemAdminFormFields({
  draft,
  setDraft,
}: {
  draft: AdditionalItemsInsertPayload
  setDraft: React.Dispatch<React.SetStateAction<AdditionalItemsInsertPayload>>
}) {
  return (
    <>
      <BackofficeFormSectionTitle>Dados principais</BackofficeFormSectionTitle>
      <BackofficeField label="Chave">
        <BackofficeInput
          value={draft.item_key ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, item_key: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Nome">
        <BackofficeInput
          value={draft.item_name ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, item_name: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Nome PT">
        <BackofficeInput
          value={draft.label_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, label_pt: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Nome EN">
        <BackofficeInput
          value={draft.label_en ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, label_en: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Nome ES">
        <BackofficeInput
          value={draft.label_es ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, label_es: v }))}
        />
      </BackofficeField>
      <BackofficeField label="category_key">
        <BackofficeInput
          value={draft.category_key ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, category_key: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Categoria PT">
        <BackofficeSelect
          value={String(draft.category_pt ?? '')}
          onChange={(v) => setDraft((c) => ({ ...c, category_pt: v }))}
        >
          <option value="">—</option>
          {ADDITIONAL_ITEM_CATEGORY_ORDER.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="Categoria EN">
        <BackofficeInput
          value={draft.category_en ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, category_en: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Categoria ES">
        <BackofficeInput
          value={draft.category_es ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, category_es: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Preço">
        <BackofficeInput
          type="number"
          value={draft.price ?? 0}
          onChange={(v) => setDraft((c) => ({ ...c, price: Number(v) }))}
        />
      </BackofficeField>
      <BackofficeField label="Tipo de cobrança">
        <BackofficeSelect
          value={String(draft.pricing_type ?? 'PER_UNIT')}
          onChange={(v) => setDraft((c) => ({ ...c, pricing_type: v }))}
        >
          <option value="PER_UNIT">Por unidade</option>
          <option value="PER_PERSON">Por pessoa</option>
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="charge_type">
        <BackofficeInput
          value={draft.charge_type ?? 'UNIT'}
          onChange={(v) => setDraft((c) => ({ ...c, charge_type: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Unidade">
        <BackofficeInput
          value={draft.unit_label ?? 'UN'}
          onChange={(v) => setDraft((c) => ({ ...c, unit_label: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Moeda">
        <BackofficeInput
          value={draft.currency_code ?? 'USD'}
          onChange={(v) => setDraft((c) => ({ ...c, currency_code: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Ordem">
        <BackofficeInput
          type="number"
          value={draft.display_order ?? 0}
          onChange={(v) =>
            setDraft((c) => ({ ...c, display_order: Number(v) }))
          }
        />
      </BackofficeField>
      <BackofficeField label="Status">
        <BackofficeSelect
          value={draft.active === false ? 'false' : 'true'}
          onChange={(v) => setDraft((c) => ({ ...c, active: v === 'true' }))}
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="Imagem URL" className="sm:col-span-2">
        <BackofficeInput
          value={draft.image_url ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, image_url: v }))}
        />
      </BackofficeField>
      <BackofficeField label="image_status">
        <BackofficeInput
          value={draft.image_status ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, image_status: v }))}
        />
      </BackofficeField>
      <BackofficeField label="image_notes" className="sm:col-span-2">
        <BackofficeInput
          value={draft.image_notes ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, image_notes: v }))}
        />
      </BackofficeField>
      <BackofficeField label="quantity">
        <BackofficeInput
          type="number"
          value={draft.quantity ?? 0}
          onChange={(v) => setDraft((c) => ({ ...c, quantity: Number(v) }))}
        />
      </BackofficeField>
      <BackofficeField label="unit">
        <BackofficeInput
          value={draft.unit ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, unit: v }))}
        />
      </BackofficeField>
      <BackofficeField label="quantity_2">
        <BackofficeInput
          type="number"
          value={draft.quantity_2 ?? 0}
          onChange={(v) => setDraft((c) => ({ ...c, quantity_2: Number(v) }))}
        />
      </BackofficeField>
      <BackofficeField label="uom_2">
        <BackofficeInput
          value={draft.uom_2 ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, uom_2: v }))}
        />
      </BackofficeField>
    </>
  )
}
