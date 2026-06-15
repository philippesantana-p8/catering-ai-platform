'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import {
  BackofficeBtnDanger,
  BackofficeBtnOutline,
  BackofficeBtnPrimary,
  BackofficeBtnSecondary,
  BackofficeField,
  BackofficeFormCard,
  BackofficeInput,
  BackofficeMetaRow,
  BackofficeStatusBadge,
} from '@/components/backoffice/BackofficeCardPrimitives'
import {
  BackofficeCascadeLayout,
  BackofficeCascadeListButton,
  BackofficeCascadePanel,
} from '@/components/backoffice/BackofficeSectionPrimitives'
import CatalogImageFrame from '@/components/CatalogImageFrame'
import {
  getAdditionalItemImageUrl,
  getAdditionalItemLabel,
  mapAdditionalItemDraftToDeployed,
} from '@/Lib/additionalItemFieldAccess'
import { normalizeAdditionalItemDraft } from '@/Lib/additionalItemCatalogAdmin'
import type { CatalogItemListItem } from '@/Lib/fetchCatalogItems'
import { formatUsd } from '@/Lib/backofficeFinance'
import { getAdditionalItemPrice } from '@/Lib/getAdditionalItemPrice'
import type { CatalogItemsInsertPayload } from '@/Lib/catalogItemsTableSchema'
import { slugFromItemName } from '@/Lib/packageConfigKeys'

type ActiveFilter = 'active' | 'all'

export const EMPTY_SIDE_ITEM_ROW: CatalogItemsInsertPayload = {
  item_key: '',
  item_name: '',
  label_pt: '',
  label_en: '',
  label_es: '',
  category_key: 'GUARNICOES',
  category_pt: 'GUARNIÇÕES',
  category_en: 'SIDES',
  category_es: 'GUARNICIONES',
  price: 0,
  sale_price: 0,
  charge_type: 'UNIT',
  pricing_type: 'PER_UNIT',
  unit_label: 'UN',
  currency_code: 'USD',
  display_order: 0,
  image_url: '',
  active: true,
  customer_visible: true,
  item_type: 'SIDE',
  operational_item: false,
  can_be_side_item: true,
  can_be_additional: false,
  can_be_package_item: false,
  can_be_option_choice: false,
  inventory_enabled: false,
  cost_price: 0,
}

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

async function fetchSidesFromApi(
  query: string,
  activeFilter: ActiveFilter,
): Promise<CatalogItemListItem[]> {
  const params = new URLSearchParams({
    usage: 'side_item',
    audience: 'customer',
    _: String(Date.now()),
  })
  if (query.trim()) params.set('q', query.trim())
  params.set('active', activeFilter === 'all' ? 'all' : 'true')

  const response = await fetch(`/api/additional-items?${params.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
  const result = (await response.json()) as {
    data?: CatalogItemListItem[]
    error?: string
  }
  if (!response.ok) {
    throw new Error(result.error ?? 'Não foi possível buscar guarnições.')
  }
  return result.data ?? []
}

function sideDraftFromListItem(item: CatalogItemListItem): CatalogItemsInsertPayload {
  return {
    item_key: String(item.item_key ?? ''),
    item_name: String(item.item_name ?? ''),
    label_pt: String(item.label_pt ?? item.item_name ?? ''),
    label_en: String(item.label_en ?? ''),
    label_es: String(item.label_es ?? ''),
    category_key: String(item.category_key ?? 'GUARNICOES'),
    category_pt: String(item.category_pt ?? 'GUARNIÇÕES'),
    category_en: String(item.category_en ?? ''),
    category_es: String(item.category_es ?? ''),
    price: Number(item.price ?? 0),
    sale_price: Number(item.sale_price ?? item.price ?? 0),
    charge_type: String(item.charge_type ?? 'UNIT'),
    pricing_type: String(item.pricing_type ?? 'PER_UNIT'),
    unit_label: String(item.unit_label ?? 'UN'),
    currency_code: String(item.currency_code ?? 'USD'),
    display_order: Number(item.display_order ?? 0),
    image_url: String(item.image_url ?? ''),
    image_status: String(item.image_status ?? ''),
    image_notes: item.image_notes == null ? null : String(item.image_notes),
    active: item.active !== false,
    customer_visible: item.customer_visible !== false,
    item_type: 'SIDE',
    operational_item: item.operational_item === true,
    can_be_side_item: true,
    can_be_additional: item.can_be_additional === true,
    can_be_package_item: item.can_be_package_item === true,
    can_be_option_choice: false,
    inventory_enabled: false,
    cost_price: Number(item.cost_price ?? 0),
  }
}

function SideFormFields({
  draft,
  setDraft,
}: {
  draft: CatalogItemsInsertPayload
  setDraft: React.Dispatch<React.SetStateAction<CatalogItemsInsertPayload>>
}) {
  return (
    <>
      <BackofficeField label="Nome">
        <BackofficeInput
          value={draft.item_name ?? ''}
          onChange={(v) => {
            const name = v.trim()
            setDraft((c) => ({
              ...c,
              item_name: v,
              label_pt: String(c.label_pt ?? '').trim() ? c.label_pt : v,
              item_key:
                String(c.item_key ?? '').trim() ||
                (name ? slugFromItemName(name) : ''),
            }))
          }}
        />
      </BackofficeField>
      <BackofficeField label="Chave">
        <BackofficeInput
          value={draft.item_key ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, item_key: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Preço de venda">
        <BackofficeInput
          type="number"
          value={draft.sale_price ?? draft.price ?? 0}
          onChange={(v) =>
            setDraft((c) => ({
              ...c,
              sale_price: Number(v),
              price: Number(v),
            }))
          }
        />
      </BackofficeField>
      <BackofficeField label="Pode ser adicional na cotação">
        <select
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={draft.can_be_additional === false ? 'false' : 'true'}
          onChange={(e) =>
            setDraft((c) => ({
              ...c,
              can_be_additional: e.target.value === 'true',
            }))
          }
        >
          <option value="true">Sim</option>
          <option value="false">Não</option>
        </select>
      </BackofficeField>
      <BackofficeField label="Status">
        <select
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={draft.active === false ? 'false' : 'true'}
          onChange={(e) =>
            setDraft((c) => ({ ...c, active: e.target.value === 'true' }))
          }
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </BackofficeField>
      <BackofficeField label="Imagem URL" className="sm:col-span-2">
        <BackofficeInput
          value={draft.image_url ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, image_url: v }))}
        />
      </BackofficeField>
    </>
  )
}

export default function GuarnicoesDashboard({
  initialItems,
}: {
  initialItems: CatalogItemListItem[]
}) {
  const [items, setItems] = useState<CatalogItemListItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<CatalogItemsInsertPayload>(EMPTY_SIDE_ITEM_ROW)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    initialItems[0]?.id ?? null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetIdRef = useRef<string | null>(null)

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      [item.item_key, item.item_name, item.label_pt]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [items, search])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  )

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedItemId(null)
      return
    }
    if (!selectedItemId || !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id)
    }
  }, [filteredItems, selectedItemId])

  const refreshItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchSidesFromApi(search, activeFilter))
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Erro ao atualizar guarnições.',
      )
    } finally {
      setLoading(false)
    }
  }, [search, activeFilter])

  useEffect(() => {
    void refreshItems()
  }, [activeFilter])

  function startNew() {
    setEditingId('new')
    setDraft({ ...EMPTY_SIDE_ITEM_ROW })
  }

  function startEdit(item: CatalogItemListItem) {
    setEditingId(item.id)
    setSelectedItemId(item.id)
    setDraft(sideDraftFromListItem(item))
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({ ...EMPTY_SIDE_ITEM_ROW })
  }

  function triggerUpload(itemId: string) {
    uploadTargetIdRef.current = itemId
    fileInputRef.current?.click()
  }

  async function handleFileSelected(file: File | undefined) {
    const itemId = uploadTargetIdRef.current
    if (!file || !itemId) return

    if (!ACCEPTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      setError('Formato inválido. Use PNG, JPG, JPEG ou WebP.')
      uploadTargetIdRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploadingId(itemId)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`/api/additional-items/${itemId}/image`, {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as {
        success?: boolean
        item?: CatalogItemListItem
        error?: string
      }

      if (!response.ok || !result.success || !result.item) {
        throw new Error(result.error ?? 'Falha no upload da imagem.')
      }

      setItems((current) =>
        current.map((row) => (row.id === itemId ? { ...row, ...result.item } : row)),
      )

      if (editingId === itemId) {
        setDraft((current) => ({
          ...current,
          image_url: result.item?.image_url ?? current.image_url,
          image_status: result.item?.image_status ?? 'ready',
          image_notes:
            result.item?.image_notes ??
            'Imagem atualizada pelo cadastro de itens.',
        }))
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Erro ao enviar imagem.',
      )
    } finally {
      setUploadingId(null)
      uploadTargetIdRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function saveRow() {
    setSaving(true)
    setError(null)
    const normalized = normalizeAdditionalItemDraft({
      ...draft,
      item_type: 'SIDE',
      category_key: 'GUARNICOES',
      category_pt: String(draft.category_pt ?? '').trim() || 'GUARNIÇÕES',
      can_be_side_item: true,
      can_be_option_choice: false,
      operational_item: false,
      inventory_enabled: false,
      customer_visible: true,
      price: getAdditionalItemPrice(draft),
    })
    const payload = mapAdditionalItemDraftToDeployed(normalized)

    try {
      const url =
        editingId && editingId !== 'new'
          ? `/api/additional-items/${editingId}`
          : '/api/additional-items'
      const method = editingId && editingId !== 'new' ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { error?: string; id?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar guarnição.')
      }
      cancelEdit()
      await refreshItems()
      if (result.id) setSelectedItemId(result.id)
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Erro ao salvar guarnição.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(item: CatalogItemListItem) {
    const label = getAdditionalItemLabel(item)
    if (!window.confirm(`Inativar guarnição "${label}"?`)) return
    const response = await fetch(`/api/additional-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? 'Não foi possível inativar guarnição.')
      return
    }
    await refreshItems()
  }

  async function activate(item: CatalogItemListItem) {
    const response = await fetch(`/api/additional-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? 'Não foi possível reativar guarnição.')
      return
    }
    await refreshItems()
  }

  function renderDetailPanel() {
    if (editingId === 'new') {
      return (
        <BackofficeCascadePanel title="Nova guarnição" className="lg:col-span-7">
          <BackofficeFormCard
            title="Cadastro"
            actions={
              <>
                <BackofficeBtnPrimary onClick={() => void saveRow()} disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </BackofficeBtnPrimary>
                <BackofficeBtnSecondary onClick={cancelEdit}>
                  Cancelar
                </BackofficeBtnSecondary>
              </>
            }
          >
            <SideFormFields draft={draft} setDraft={setDraft} />
          </BackofficeFormCard>
        </BackofficeCascadePanel>
      )
    }

    if (!selectedItem) {
      return (
        <BackofficeCascadePanel
          title="Detalhe"
          subtitle="Selecione uma guarnição"
          className="lg:col-span-7"
        >
          <p className="text-sm text-neutral-500">
            Escolha uma guarnição na lista ou crie uma nova.
          </p>
        </BackofficeCascadePanel>
      )
    }

    const isEditing = editingId === selectedItem.id
    const displayName = getAdditionalItemLabel(selectedItem)
    const imageUrl = isEditing
      ? String(draft.image_url ?? '').trim() || null
      : getAdditionalItemImageUrl(selectedItem)

    if (isEditing) {
      return (
        <BackofficeCascadePanel
          title={`Editar · ${displayName}`}
          className="lg:col-span-7"
        >
          <div className="mb-4 max-w-xs">
            <CatalogImageFrame
              src={imageUrl}
              alt={displayName}
              variant="catalogItem"
              itemType="SIDE"
              categoryPt="GUARNIÇÕES"
              imageStatus={isEditing ? String(draft.image_status ?? '') : selectedItem.image_status}
              fallbackLabel="Sem imagem cadastrada"
              rounded="all"
              className="!aspect-square !min-h-0 !max-h-none"
            />
          </div>
          <BackofficeFormCard
            title="Editar guarnição"
            actions={
              <>
                <BackofficeBtnPrimary onClick={() => void saveRow()} disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </BackofficeBtnPrimary>
                <BackofficeBtnSecondary onClick={cancelEdit}>
                  Cancelar
                </BackofficeBtnSecondary>
                <BackofficeBtnOutline
                  accent
                  onClick={() => triggerUpload(selectedItem.id)}
                  disabled={uploadingId === selectedItem.id}
                >
                  {uploadingId === selectedItem.id ? 'Enviando…' : 'Enviar imagem'}
                </BackofficeBtnOutline>
              </>
            }
          >
            <SideFormFields draft={draft} setDraft={setDraft} />
          </BackofficeFormCard>
        </BackofficeCascadePanel>
      )
    }

    return (
      <BackofficeCascadePanel
        title={displayName}
        subtitle="Guarnição"
        className="lg:col-span-7 overflow-hidden !p-0"
      >
        <div className="flex aspect-square w-full items-center justify-center bg-neutral-50">
          <CatalogImageFrame
            src={imageUrl}
            alt={displayName}
            variant="catalogItem"
            itemType="SIDE"
            categoryPt="GUARNIÇÕES"
            imageStatus={selectedItem.image_status}
            fallbackLabel="Sem imagem cadastrada"
            rounded="none"
            className="!h-full !min-h-0 !max-h-none !w-full !rounded-none"
          />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              {selectedItem.item_key ?? '—'}
            </span>
            <BackofficeStatusBadge active={selectedItem.active !== false} />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">{displayName}</h3>
          <BackofficeMetaRow
            label="Preço vigente"
            value={formatUsd(getAdditionalItemPrice(selectedItem))}
          />
          <BackofficeMetaRow
            label="Adicional na cotação"
            value={selectedItem.can_be_additional !== false ? 'Sim' : 'Não'}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <BackofficeBtnSecondary onClick={() => startEdit(selectedItem)}>
              Editar
            </BackofficeBtnSecondary>
            <BackofficeBtnOutline
              accent
              onClick={() => triggerUpload(selectedItem.id)}
              disabled={uploadingId === selectedItem.id}
            >
              {uploadingId === selectedItem.id ? 'Enviando…' : 'Imagem'}
            </BackofficeBtnOutline>
            {selectedItem.active !== false ? (
              <BackofficeBtnDanger onClick={() => void deactivate(selectedItem)}>
                Inativar
              </BackofficeBtnDanger>
            ) : (
              <BackofficeBtnPrimary onClick={() => void activate(selectedItem)}>
                Reativar
              </BackofficeBtnPrimary>
            )}
          </div>
        </div>
      </BackofficeCascadePanel>
    )
  }

  return (
    <BackofficeTableShell
      title="Guarnições"
      subtitle="Catálogo de guarnições · Catering AI"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Nome ou chave"
      activeFilter={activeFilter}
      onActiveFilterChange={setActiveFilter}
      onRefresh={() => void refreshItems()}
      loading={loading}
      error={error}
      actions={
        <button
          type="button"
          onClick={startNew}
          className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
        >
          Nova guarnição
        </button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileSelected(e.target.files?.[0])}
      />

      {filteredItems.length === 0 && editingId !== 'new' ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
          {loading ? 'Carregando…' : 'Nenhuma guarnição encontrada.'}
        </p>
      ) : (
        <BackofficeCascadeLayout>
          <div className="lg:col-span-5">
            <BackofficeCascadePanel
              title="Guarnições"
              subtitle={`${filteredItems.length} itens`}
            >
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <BackofficeCascadeListButton
                    key={item.id}
                    active={selectedItemId === item.id}
                    onClick={() => {
                      setSelectedItemId(item.id)
                      if (editingId && editingId !== item.id) cancelEdit()
                    }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <CatalogImageFrame
                        src={getAdditionalItemImageUrl(item)}
                        alt={getAdditionalItemLabel(item)}
                        variant="catalogItem"
                        itemType="SIDE"
                        categoryPt="GUARNIÇÕES"
                        imageStatus={item.image_status}
                        size="thumbnail"
                        rounded="all"
                        className="!h-12 !w-12"
                      />
                      <div className="min-w-0">
                        <span className="block truncate">
                          {getAdditionalItemLabel(item)}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {formatUsd(getAdditionalItemPrice(item))}
                          {item.active === false ? ' · inativo' : ''}
                        </span>
                      </div>
                    </div>
                  </BackofficeCascadeListButton>
                ))}
              </div>
            </BackofficeCascadePanel>
          </div>

          <div className="lg:col-span-7">{renderDetailPanel()}</div>
        </BackofficeCascadeLayout>
      )}

      {editingId === 'new' && filteredItems.length === 0 ? (
        <div className="mt-4">{renderDetailPanel()}</div>
      ) : null}
    </BackofficeTableShell>
  )
}
