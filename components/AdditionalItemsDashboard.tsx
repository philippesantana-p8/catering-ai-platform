'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import {
  BackofficeBtnDanger,
  BackofficeBtnOutline,
  BackofficeBtnPrimary,
  BackofficeBtnSecondary,
  BackofficeCardGrid,
  BackofficeCardImage,
  BackofficeEmptyState,
  BackofficeEntityCard,
  BackofficeField,
  BackofficeFormCard,
  BackofficeInput,
  BackofficeMetaRow,
  BackofficeSelect,
  BackofficeStatusBadge,
} from '@/components/backoffice/BackofficeCardPrimitives'
import CatalogImageFrame from '@/components/CatalogImageFrame'
import type { AdditionalItemListItem } from '@/Lib/fetchAdditionalItems'
import { getAdditionalItemPrice } from '@/Lib/getAdditionalItemPrice'
import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'

type ActiveFilter = 'active' | 'all'

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

const EMPTY_ROW: AdditionalItemsInsertPayload = {
  item_key: '',
  item_name: '',
  label_pt: '',
  category_pt: '',
  price: 0,
  charge_type: 'UNIT',
  pricing_type: 'PER_UNIT',
  unit_label: 'UN',
  currency_code: 'USD',
  display_order: 0,
  image_url: '',
  active: true,
}

async function fetchItemsFromApi(
  query: string,
  activeFilter: ActiveFilter,
): Promise<AdditionalItemListItem[]> {
  const params = new URLSearchParams({ _: String(Date.now()) })
  if (query.trim()) params.set('q', query.trim())
  params.set('active', activeFilter === 'all' ? 'all' : 'true')

  const response = await fetch(`/api/additional-items?${params.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
  const result = (await response.json()) as {
    data?: AdditionalItemListItem[]
    error?: string
  }
  if (!response.ok) {
    throw new Error(result.error ?? 'Não foi possível buscar itens.')
  }
  return result.data ?? []
}

function chargeLabel(item: AdditionalItemListItem | AdditionalItemsInsertPayload) {
  if (item.pricing_type === 'PER_PERSON' || item.charge_type === 'PERSON') {
    return 'por pessoa'
  }
  return 'por unidade'
}

function ItemEditFields({
  draft,
  setDraft,
}: {
  draft: AdditionalItemsInsertPayload
  setDraft: React.Dispatch<React.SetStateAction<AdditionalItemsInsertPayload>>
}) {
  return (
    <>
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
      <BackofficeField label="PT">
        <BackofficeInput
          value={draft.label_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, label_pt: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Categoria">
        <BackofficeInput
          value={draft.category_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, category_pt: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Preço">
        <BackofficeInput
          type="number"
          value={draft.price ?? 0}
          onChange={(v) => setDraft((c) => ({ ...c, price: Number(v) }))}
        />
      </BackofficeField>
      <BackofficeField label="Tipo de precificação">
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
      <BackofficeField label="unit_label">
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
      <BackofficeField label="Imagem URL" className="sm:col-span-2">
        <BackofficeInput
          value={draft.image_url ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, image_url: v }))}
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
    </>
  )
}

export default function AdditionalItemsDashboard({
  initialItems,
}: {
  initialItems: AdditionalItemListItem[]
}) {
  const [items, setItems] = useState<AdditionalItemListItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<AdditionalItemsInsertPayload>(EMPTY_ROW)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetIdRef = useRef<string | null>(null)

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      [item.item_key, item.item_name, item.label_pt, item.category_pt]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [items, search])

  const refreshItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchItemsFromApi(search, activeFilter))
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Erro ao atualizar itens.',
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
    setDraft({ ...EMPTY_ROW })
  }

  function startEdit(item: AdditionalItemListItem) {
    setEditingId(item.id)
    setDraft({
      item_key: item.item_key ?? '',
      item_name: item.item_name ?? '',
      label_pt: item.label_pt ?? '',
      category_pt: item.category_pt ?? '',
      price: getAdditionalItemPrice(item),
      charge_type: item.charge_type ?? 'UNIT',
      pricing_type: item.pricing_type ?? 'PER_UNIT',
      unit_label: item.unit_label ?? 'UN',
      currency_code: item.currency_code ?? 'USD',
      display_order: item.display_order ?? 0,
      image_url: item.image_url ?? '',
      image_status: item.image_status ?? '',
      image_notes: item.image_notes ?? '',
      active: item.active !== false,
    })
  }

  function triggerUpload(itemId: string) {
    uploadTargetIdRef.current = itemId
    fileInputRef.current?.click()
  }

  async function handleFileSelected(file: File | undefined) {
    const itemId = uploadTargetIdRef.current
    if (!file || !itemId) return

    if (!ACCEPTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      const message = 'Formato inválido. Use PNG, JPG, JPEG ou WebP.'
      setUploadErrors((current) => ({ ...current, [itemId]: message }))
      setError(message)
      uploadTargetIdRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploadingId(itemId)
    setUploadErrors((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
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
        image_url?: string
        item?: AdditionalItemListItem
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
          image_url: result.item?.image_url ?? result.image_url ?? current.image_url,
          image_status: result.item?.image_status ?? 'uploaded',
          image_notes: null,
        }))
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Erro ao enviar imagem.'
      setUploadErrors((current) => ({ ...current, [itemId]: message }))
      setError(message)
    } finally {
      setUploadingId(null)
      uploadTargetIdRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({ ...EMPTY_ROW })
  }

  async function saveRow() {
    setSaving(true)
    setError(null)
    const payload = {
      ...draft,
      charge_type:
        draft.pricing_type === 'PER_PERSON' ? 'PERSON' : draft.charge_type ?? 'UNIT',
      price: getAdditionalItemPrice(draft),
    }
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
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar item.')
      }
      cancelEdit()
      await refreshItems()
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Erro ao salvar item.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(item: AdditionalItemListItem) {
    const label = item.item_name ?? item.label_pt ?? item.item_key ?? 'Item'
    if (!window.confirm(`Inativar "${label}"?`)) return
    const response = await fetch(`/api/additional-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? 'Não foi possível inativar item.')
      return
    }
    setItems((current) => current.filter((row) => row.id !== item.id))
  }

  function renderItemCard(item: AdditionalItemListItem) {
    const isEditing = editingId === item.id
    const itemKey = item.item_key ?? '—'
    const displayName = item.item_name ?? item.label_pt ?? itemKey
    const imageUrl = isEditing
      ? String(draft.image_url ?? '').trim() || null
      : item.image_url?.trim() || null
    const uploadError = uploadErrors[item.id]

    if (isEditing) {
      return (
        <BackofficeFormCard
          key={item.id}
          title={`Editar item · ${itemKey}`}
          actions={
            <>
              <BackofficeBtnPrimary
                onClick={() => void saveRow()}
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </BackofficeBtnPrimary>
              <BackofficeBtnSecondary onClick={cancelEdit}>Cancelar</BackofficeBtnSecondary>
              <BackofficeBtnOutline
                accent
                onClick={() => triggerUpload(item.id)}
                disabled={uploadingId === item.id}
              >
                {uploadingId === item.id ? 'Enviando…' : 'Enviar imagem'}
              </BackofficeBtnOutline>
            </>
          }
        >
          <div className="col-span-full mb-2 max-w-xs">
            <CatalogImageFrame
              src={imageUrl}
              alt={displayName}
              variant="additionalItem"
              fallbackLabel="Sem imagem cadastrada"
              rounded="all"
              className="!aspect-[4/3] !min-h-0 !max-h-none"
            />
          </div>
          <ItemEditFields draft={draft} setDraft={setDraft} />
        </BackofficeFormCard>
      )
    }

    return (
      <BackofficeEntityCard
        key={item.id}
        inactive={item.active === false}
        image={
          <BackofficeCardImage>
            <CatalogImageFrame
              src={imageUrl}
              alt={displayName}
              variant="additionalItem"
              fallbackLabel="Sem imagem cadastrada"
              rounded="none"
              className="!h-full !min-h-0 !max-h-none !w-full !rounded-none"
            />
          </BackofficeCardImage>
        }
        actions={
          <>
            <BackofficeBtnSecondary onClick={() => startEdit(item)}>
              Editar
            </BackofficeBtnSecondary>
            <BackofficeBtnOutline
              accent
              onClick={() => triggerUpload(item.id)}
              disabled={uploadingId === item.id}
            >
              {uploadingId === item.id ? 'Enviando…' : 'Imagem'}
            </BackofficeBtnOutline>
            {item.active !== false ? (
              <BackofficeBtnDanger onClick={() => void deactivate(item)}>
                Inativar
              </BackofficeBtnDanger>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {itemKey}
          </span>
          <BackofficeStatusBadge active={item.active !== false} />
        </div>
        <h3 className="text-xl font-bold text-neutral-900">{displayName}</h3>
        <BackofficeMetaRow label="Categoria" value={item.category_pt ?? '—'} />
        <BackofficeMetaRow
          label="Preço"
          value={`$${getAdditionalItemPrice(item).toFixed(2)}`}
        />
        <BackofficeMetaRow label="Cobrança" value={chargeLabel(item)} />
        {uploadError ? (
          <p className="text-xs text-red-600">{uploadError}</p>
        ) : null}
      </BackofficeEntityCard>
    )
  }

  return (
    <BackofficeTableShell
      title="Itens adicionais"
      subtitle="Catálogo de adicionais · Catering AI"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Nome, chave ou categoria"
      activeFilter={activeFilter}
      onActiveFilterChange={setActiveFilter}
      onRefresh={() => void refreshItems()}
      loading={loading}
      error={error}
      actions={
        <>
          <button
            type="button"
            onClick={startNew}
            className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
          >
            Novo item adicional
          </button>
          <Link
            href="/packages/images#adicionais"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-800 shadow-sm"
          >
            Imagens
          </Link>
        </>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileSelected(e.target.files?.[0])}
      />

      <BackofficeCardGrid>
        {editingId === 'new' ? (
          <BackofficeFormCard
            title="Novo item adicional"
            actions={
              <>
                <BackofficeBtnPrimary
                  onClick={() => void saveRow()}
                  disabled={saving}
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </BackofficeBtnPrimary>
                <BackofficeBtnSecondary onClick={cancelEdit}>
                  Cancelar
                </BackofficeBtnSecondary>
              </>
            }
          >
            <ItemEditFields draft={draft} setDraft={setDraft} />
          </BackofficeFormCard>
        ) : null}

        {filteredItems.length === 0 && editingId !== 'new' ? (
          <BackofficeEmptyState loading={loading} message="Nenhum item encontrado." />
        ) : (
          filteredItems.map((item) => renderItemCard(item))
        )}
      </BackofficeCardGrid>
    </BackofficeTableShell>
  )
}
