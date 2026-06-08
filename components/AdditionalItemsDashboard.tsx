'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import CatalogImageFrame from '@/components/CatalogImageFrame'
import type { AdditionalItemListItem } from '@/Lib/fetchAdditionalItems'
import { getAdditionalItemPrice } from '@/Lib/getAdditionalItemPrice'
import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'

type ActiveFilter = 'active' | 'all'

type ColumnKey = keyof AdditionalItemsInsertPayload | 'active'

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

const COLUMNS: Array<{
  key: ColumnKey
  label: string
  type?: 'text' | 'number'
}> = [
  { key: 'item_key', label: 'Chave', type: 'text' },
  { key: 'item_name', label: 'Nome', type: 'text' },
  { key: 'label_pt', label: 'PT', type: 'text' },
  { key: 'category_pt', label: 'Categoria', type: 'text' },
  { key: 'price', label: 'Preço', type: 'number' },
  { key: 'charge_type', label: 'charge_type', type: 'text' },
  { key: 'pricing_type', label: 'pricing_type', type: 'text' },
  { key: 'unit_label', label: 'unit_label', type: 'text' },
  { key: 'currency_code', label: 'Moeda', type: 'text' },
  { key: 'display_order', label: 'Ordem', type: 'number' },
  { key: 'image_url', label: 'image_url', type: 'text' },
  { key: 'active', label: 'Ativo', type: 'text' },
]

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

function getImageStatusLabel(
  item: AdditionalItemListItem,
  uploadError?: string | null,
) {
  if (uploadError) return 'Erro no upload'
  if (item.image_url?.trim() || item.image_status === 'uploaded') {
    return 'Imagem enviada'
  }
  return 'Sem imagem'
}

function imageStatusClass(label: string) {
  if (label === 'Imagem enviada') return 'text-cdl-success'
  if (label === 'Erro no upload') return 'text-cdl-action'
  return 'text-cdl-muted'
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

  function renderCell(
    item: AdditionalItemListItem,
    key: ColumnKey,
    type: 'text' | 'number' = 'text',
  ) {
    if (key === 'image_url') {
      const url =
        editingId === item.id
          ? String(draft.image_url ?? '').trim() || null
          : item.image_url?.trim() || null
      const label = item.item_name ?? item.label_pt ?? item.item_key ?? 'Item'
      const statusLabel = getImageStatusLabel(item, uploadErrors[item.id])
      return (
        <div className="flex max-w-[10rem] flex-col gap-2">
          <CatalogImageFrame
            src={url}
            alt={label}
            variant="additionalItem"
            size="thumbnail"
            rounded="all"
          />
          <span
            className={`text-[10px] font-bold uppercase tracking-wide ${imageStatusClass(statusLabel)}`}
          >
            {statusLabel}
          </span>
          {uploadErrors[item.id] ? (
            <span className="text-[10px] leading-snug text-cdl-action">
              {uploadErrors[item.id]}
            </span>
          ) : null}
          {editingId === item.id ? (
            <input
              type="text"
              value={String(draft.image_url ?? '')}
              onChange={(e) =>
                setDraft((c) => ({ ...c, image_url: e.target.value }))
              }
              className="w-full rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
            />
          ) : (
            <span className="line-clamp-2 text-xs text-cdl-muted">{url ?? '—'}</span>
          )}
        </div>
      )
    }

    if (key === 'active') {
      if (editingId === item.id) {
        return (
          <select
            value={draft.active === false ? 'false' : 'true'}
            onChange={(e) =>
              setDraft((c) => ({ ...c, active: e.target.value === 'true' }))
            }
            className="w-full rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        )
      }
      return item.active === false ? 'Inativo' : 'Ativo'
    }

    if (editingId === item.id) {
      if (key === 'pricing_type') {
        return (
          <select
            value={String(draft.pricing_type ?? 'PER_UNIT')}
            onChange={(e) =>
              setDraft((c) => ({ ...c, pricing_type: e.target.value }))
            }
            className="w-full rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
          >
            <option value="PER_UNIT">PER_UNIT</option>
            <option value="PER_PERSON">PER_PERSON</option>
          </select>
        )
      }
      const draftKey = key as keyof AdditionalItemsInsertPayload
      return (
        <input
          type={type}
          value={String(draft[draftKey] ?? '')}
          onChange={(e) =>
            setDraft((c) => ({
              ...c,
              [draftKey]:
                type === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
          className="w-full min-w-[70px] rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
        />
      )
    }
    if (key === 'price') {
      return String(getAdditionalItemPrice(item))
    }
    return String(item[key as keyof AdditionalItemListItem] ?? '—')
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
        <button
          type="button"
          onClick={startNew}
          className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
        >
          Novo item adicional
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

      <div className="overflow-x-auto rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
        <table className="w-full min-w-[1200px] border-collapse text-left">
          <thead>
            <tr className="border-b border-cdl-border bg-cdl-inset/50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {editingId === 'new' ? (
              <tr className="border-b border-cdl-border bg-[color-mix(in_srgb,var(--brand-accent)_8%,transparent)]">
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    {col.key === 'pricing_type' ? (
                      <select
                        value={String(draft.pricing_type ?? 'PER_UNIT')}
                        onChange={(e) =>
                          setDraft((c) => ({ ...c, pricing_type: e.target.value }))
                        }
                        className="w-full rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
                      >
                        <option value="PER_UNIT">PER_UNIT</option>
                        <option value="PER_PERSON">PER_PERSON</option>
                      </select>
                    ) : col.key === 'active' ? (
                      <select
                        value={draft.active === false ? 'false' : 'true'}
                        onChange={(e) =>
                          setDraft((c) => ({
                            ...c,
                            active: e.target.value === 'true',
                          }))
                        }
                        className="w-full rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    ) : (
                      <input
                        type={col.type ?? 'text'}
                        value={String(
                          draft[col.key as keyof AdditionalItemsInsertPayload] ?? '',
                        )}
                        onChange={(e) =>
                          setDraft((c) => ({
                            ...c,
                            [col.key]:
                              col.type === 'number'
                                ? Number(e.target.value)
                                : e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
                      />
                    )}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void saveRow()}
                      disabled={saving}
                      className="rounded-lg bg-[var(--brand-primary)] px-2 py-1 text-xs font-bold text-white"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}

            {filteredItems.length === 0 && editingId !== 'new' ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-4 py-10 text-center text-cdl-muted"
                >
                  {loading ? 'Carregando…' : 'Nenhum item encontrado.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-cdl-border ${item.active === false ? 'opacity-50' : ''}`}
                >
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2 align-top text-sm">
                      {renderCell(item, col.key, col.type)}
                    </td>
                  ))}
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {editingId === item.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void saveRow()}
                            disabled={saving}
                            className="rounded-lg bg-[var(--brand-primary)] px-2 py-1 text-xs font-bold text-white"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerUpload(item.id)}
                            disabled={uploadingId === item.id}
                            className="rounded-lg border border-[var(--brand-accent)] px-2 py-1 text-xs font-bold text-[var(--brand-accent)] disabled:opacity-50"
                          >
                            {uploadingId === item.id ? '…' : 'Imagem'}
                          </button>
                          {item.active !== false ? (
                            <button
                              type="button"
                              onClick={() => void deactivate(item)}
                              className="rounded-lg border border-cdl-action px-2 py-1 text-xs font-bold text-cdl-action"
                            >
                              Inativar
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </BackofficeTableShell>
  )
}
