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
import { calcMarginPercent, calcProfit, formatUsd } from '@/Lib/backofficeFinance'
import type { PackagesInsertPayload } from '@/Lib/packagesTableSchema'

export const EMPTY_PACKAGE_ROW: PackagesInsertPayload = {
  package_key: '',
  package_name: '',
  label_pt: '',
  label_en: '',
  label_es: '',
  price_per_person: 0,
  currency_code: 'USD',
  display_order: 0,
  image_url: '',
  active: true,
  package_type: 'base',
  base_package_code: '',
  has_garnish: false,
  garnish_price_per_person: 0,
  cost_per_person: 0,
  margin_percent: 0,
  inventory_enabled: false,
  items_description_pt: '',
  items_description_en: '',
  items_description_es: '',
  garnish_description_pt: '',
  garnish_description_en: '',
  garnish_description_es: '',
  card_description_pt: '',
  card_description_en: '',
  card_description_es: '',
}

export function packageDraftFromListItem(
  pkg: Record<string, unknown>,
): PackagesInsertPayload {
  return {
    package_key: String(pkg.package_key ?? ''),
    package_name: String(pkg.package_name ?? ''),
    label_pt: String(pkg.label_pt ?? ''),
    label_en: String(pkg.label_en ?? ''),
    label_es: String(pkg.label_es ?? ''),
    description_pt: String(pkg.description_pt ?? ''),
    description_en: String(pkg.description_en ?? ''),
    description_es: String(pkg.description_es ?? ''),
    items_description_pt: String(pkg.items_description_pt ?? ''),
    items_description_en: String(pkg.items_description_en ?? ''),
    items_description_es: String(pkg.items_description_es ?? ''),
    garnish_description_pt: String(pkg.garnish_description_pt ?? ''),
    garnish_description_en: String(pkg.garnish_description_en ?? ''),
    garnish_description_es: String(pkg.garnish_description_es ?? ''),
    card_description_pt: String(pkg.card_description_pt ?? ''),
    card_description_en: String(pkg.card_description_en ?? ''),
    card_description_es: String(pkg.card_description_es ?? ''),
    package_type: String(pkg.package_type ?? 'base'),
    base_package_code: String(pkg.base_package_code ?? ''),
    has_garnish: pkg.has_garnish === true,
    garnish_price_per_person: Number(pkg.garnish_price_per_person ?? 0),
    cost_per_person: Number(pkg.cost_per_person ?? 0),
    margin_percent: Number(pkg.margin_percent ?? 0),
    inventory_enabled: pkg.inventory_enabled === true,
    price_per_person: Number(pkg.price_per_person ?? 0),
    currency_code: String(pkg.currency_code ?? 'USD'),
    display_order: Number(pkg.display_order ?? 0),
    image_url: String(pkg.image_url ?? ''),
    active: pkg.active !== false,
  }
}

export function PackageAdminFormFields({
  draft,
  setDraft,
  basePackageOptions = [],
}: {
  draft: PackagesInsertPayload
  setDraft: React.Dispatch<React.SetStateAction<PackagesInsertPayload>>
  basePackageOptions?: Array<{ code: string; label: string }>
}) {
  const price = Number(draft.price_per_person ?? 0)
  const cost = Number(draft.cost_per_person ?? 0)
  const margin = calcMarginPercent(price, cost)
  const profit = calcProfit(price, cost)

  return (
    <>
      <BackofficeFormSectionTitle>Dados principais</BackofficeFormSectionTitle>
      <BackofficeField label="Código">
        <BackofficeInput
          value={draft.package_key ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, package_key: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Nome">
        <BackofficeInput
          value={draft.package_name ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, package_name: v }))}
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

      <BackofficeFormSectionTitle>Classificação</BackofficeFormSectionTitle>
      <BackofficeField label="Tipo do pacote">
        <BackofficeSelect
          value={String(draft.package_type ?? 'base')}
          onChange={(v) =>
            setDraft((c) => ({
              ...c,
              package_type: v,
              has_garnish: v === 'with_garnish',
            }))
          }
        >
          <option value="base">Sem guarnições</option>
          <option value="with_garnish">Com guarnições</option>
          <option value="custom">Personalizado</option>
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="Pacote base relacionado">
        <BackofficeSelect
          value={String(draft.base_package_code ?? '')}
          onChange={(v) => setDraft((c) => ({ ...c, base_package_code: v }))}
        >
          <option value="">—</option>
          {basePackageOptions.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.code} · {opt.label}
            </option>
          ))}
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="Tem guarnições?">
        <BackofficeSelect
          value={draft.has_garnish ? 'true' : 'false'}
          onChange={(v) => setDraft((c) => ({ ...c, has_garnish: v === 'true' }))}
        >
          <option value="false">Não</option>
          <option value="true">Sim</option>
        </BackofficeSelect>
      </BackofficeField>
      <BackofficeField label="Guarnição / pessoa">
        <BackofficeInput
          type="number"
          value={draft.garnish_price_per_person ?? 0}
          onChange={(v) =>
            setDraft((c) => ({
              ...c,
              garnish_price_per_person: Number(v),
            }))
          }
        />
      </BackofficeField>
      <BackofficeField label="Inventário habilitado?">
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

      <BackofficeFormSectionTitle>Descrições</BackofficeFormSectionTitle>
      <BackofficeField label="Itens do pacote PT" className="sm:col-span-2 lg:col-span-3">
        <BackofficeTextarea
          value={draft.items_description_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, items_description_pt: v }))}
          rows={3}
        />
      </BackofficeField>
      <BackofficeField label="Itens EN" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.items_description_en ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, items_description_en: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Itens ES" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.items_description_es ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, items_description_es: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Guarnições PT" className="sm:col-span-2 lg:col-span-3">
        <BackofficeTextarea
          value={draft.garnish_description_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, garnish_description_pt: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Guarnições EN" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.garnish_description_en ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, garnish_description_en: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Guarnições ES" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.garnish_description_es ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, garnish_description_es: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Card PT" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.card_description_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, card_description_pt: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Card EN" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.card_description_en ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, card_description_en: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Card ES" className="sm:col-span-2">
        <BackofficeTextarea
          value={draft.card_description_es ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, card_description_es: v }))}
        />
      </BackofficeField>

      <BackofficeFormSectionTitle>Financeiro</BackofficeFormSectionTitle>
      <BackofficeField label="Preço / pessoa">
        <BackofficeInput
          type="number"
          value={draft.price_per_person ?? 0}
          onChange={(v) =>
            setDraft((c) => ({ ...c, price_per_person: Number(v) }))
          }
        />
      </BackofficeField>
      <BackofficeField label="Custo / pessoa">
        <BackofficeInput
          type="number"
          value={draft.cost_per_person ?? 0}
          onChange={(v) =>
            setDraft((c) => ({ ...c, cost_per_person: Number(v) }))
          }
        />
      </BackofficeField>
      <BackofficeField label="Margem estimada">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-800">
          {margin.toFixed(2)}% · Lucro {formatUsd(profit)}
        </div>
      </BackofficeField>
    </>
  )
}
