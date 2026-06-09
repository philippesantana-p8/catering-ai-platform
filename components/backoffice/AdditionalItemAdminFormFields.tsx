'use client'

import {
  BackofficeField,
  BackofficeInput,
  BackofficeSelect,
} from '@/components/backoffice/BackofficeCardPrimitives'
import {
  BackofficeFormSectionTitle,
  BackofficeTextarea,
} from '@/components/backoffice/BackofficeSectionPrimitives'
import { ADDITIONAL_ITEM_CATEGORY_ORDER } from '@/Lib/additionalItemCatalogAdmin'
import { calcMarginPercent, calcProfit, formatUsd } from '@/Lib/backofficeFinance'
import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'

export const EMPTY_ADDITIONAL_ITEM_ROW: AdditionalItemsInsertPayload = {
  item_key: '',
  item_name: '',
  label_pt: '',
  label_en: '',
  label_es: '',
  category_pt: '',
  category_group: '',
  description_pt: '',
  description_en: '',
  description_es: '',
  price: 0,
  cost: 0,
  margin_percent: 0,
  charge_type: 'UNIT',
  pricing_type: 'PER_UNIT',
  unit_label: 'UN',
  currency_code: 'USD',
  display_order: 0,
  image_url: '',
  inventory_enabled: false,
  supplier_name: '',
  internal_notes: '',
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
    category_pt: String(item.category_pt ?? ''),
    category_group: String(item.category_group ?? ''),
    description_pt: String(item.description_pt ?? ''),
    description_en: String(item.description_en ?? ''),
    description_es: String(item.description_es ?? ''),
    price: Number(item.price ?? 0),
    cost: Number(item.cost ?? 0),
    margin_percent: Number(item.margin_percent ?? 0),
    charge_type: String(item.charge_type ?? 'UNIT'),
    pricing_type: String(item.pricing_type ?? 'PER_UNIT'),
    unit_label: String(item.unit_label ?? 'UN'),
    currency_code: String(item.currency_code ?? 'USD'),
    display_order: Number(item.display_order ?? 0),
    image_url: String(item.image_url ?? ''),
    image_status: String(item.image_status ?? ''),
    image_notes: item.image_notes == null ? null : String(item.image_notes),
    inventory_enabled: item.inventory_enabled === true,
    supplier_name: String(item.supplier_name ?? ''),
    internal_notes: String(item.internal_notes ?? ''),
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
  const price = Number(draft.price ?? 0)
  const cost = Number(draft.cost ?? 0)
  const margin = calcMarginPercent(price, cost)
  const profit = calcProfit(price, cost)

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
      <BackofficeField label="Categoria">
        <BackofficeSelect
          value={String(draft.category_pt ?? '')}
          onChange={(v) =>
            setDraft((c) => ({
              ...c,
              category_pt: v,
              category_group: c.category_group || v,
            }))
          }
        >
          <option value="">—</option>
          {ADDITIONAL_ITEM_CATEGORY_ORDER.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="Grupo de categoria">
        <BackofficeInput
          value={draft.category_group ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, category_group: v }))}
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

      <BackofficeFormSectionTitle>Descrições</BackofficeFormSectionTitle>
      <BackofficeField label="Descrição PT" className="sm:col-span-2 lg:col-span-3">
        <BackofficeTextarea
          value={draft.description_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, description_pt: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Descrição EN" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.description_en ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, description_en: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Descrição ES" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.description_es ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, description_es: v }))}
        />
      </BackofficeField>

      <BackofficeFormSectionTitle>Financeiro</BackofficeFormSectionTitle>
      <BackofficeField label="Preço">
        <BackofficeInput
          type="number"
          value={draft.price ?? 0}
          onChange={(v) => setDraft((c) => ({ ...c, price: Number(v) }))}
        />
      </BackofficeField>
      <BackofficeField label="Custo">
        <BackofficeInput
          type="number"
          value={draft.cost ?? 0}
          onChange={(v) => setDraft((c) => ({ ...c, cost: Number(v) }))}
        />
      </BackofficeField>
      <BackofficeField label="Margem estimada">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-800">
          {margin.toFixed(2)}% · Lucro {formatUsd(profit)}
        </div>
      </BackofficeField>

      <BackofficeFormSectionTitle>Inventário e fornecedor</BackofficeFormSectionTitle>
      <BackofficeField label="Habilitar inventário">
        <BackofficeSelect
          value={draft.inventory_enabled ? 'true' : 'false'}
          onChange={(v) =>
            setDraft((c) => ({ ...c, inventory_enabled: v === 'true' }))
          }
        >
          <option value="false">Não</option>
          <option value="true">Sim</option>
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="Fornecedor">
        <BackofficeInput
          value={draft.supplier_name ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, supplier_name: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Observações internas" className="sm:col-span-2 lg:col-span-3">
        <BackofficeTextarea
          value={draft.internal_notes ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, internal_notes: v }))}
        />
      </BackofficeField>
    </>
  )
}
