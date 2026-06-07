'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import type { AdditionalItemListItem } from '@/Lib/fetchAdditionalItems'
import { getAdditionalItemUnitPrice } from '@/Lib/getAdditionalItemUnitPrice'
import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'

type ActiveFilter = 'active' | 'all'

const EMPTY_ROW: AdditionalItemsInsertPayload = {
  item_key: '',
  label_pt: '',
  label_en: '',
  label_es: '',
  category_pt: '',
  price: 0,
  pricing_type: 'PER_UNIT',
  charge_type: 'UNIT',
  display_order: 0,
  image_url: '',
  active: true,
}

const COLUMNS: Array<{
  key: keyof AdditionalItemsInsertPayload
  label: string
  type?: 'text' | 'number'
}> = [
  { key: 'item_key', label: 'Chave', type: 'text' },
  { key: 'label_pt', label: 'PT', type: 'text' },
  { key: 'label_en', label: 'EN', type: 'text' },
  { key: 'label_es', label: 'ES', type: 'text' },
  { key: 'category_pt', label: 'Categoria', type: 'text' },
  { key: 'price', label: 'Preço', type: 'number' },
  { key: 'pricing_type', label: 'Tipo', type: 'text' },
  { key: 'display_order', label: 'Ordem', type: 'number' },
  { key: 'image_url', label: 'image_url', type: 'text' },
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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      [item.item_key, item.label_pt, item.label_en, item.category_pt]
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
      label_pt: item.label_pt ?? '',
      label_en: item.label_en ?? '',
      label_es: item.label_es ?? '',
      category_pt: item.category_pt ?? '',
      price: getAdditionalItemUnitPrice(item),
      pricing_type: item.pricing_type ?? 'PER_UNIT',
      charge_type: item.charge_type ?? 'UNIT',
      display_order: item.display_order ?? 0,
      image_url: item.image_url ?? '',
      active: item.active !== false,
    })
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
        draft.pricing_type === 'PER_PERSON' ? 'PERSON' : 'UNIT',
      price: getAdditionalItemUnitPrice(draft),
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
    const label = item.label_pt ?? item.item_key ?? 'Item'
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
    key: keyof AdditionalItemsInsertPayload,
    type: 'text' | 'number' = 'text',
  ) {
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
      return (
        <input
          type={type}
          value={String(draft[key] ?? '')}
          onChange={(e) =>
            setDraft((c) => ({
              ...c,
              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
          className="w-full min-w-[70px] rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
        />
      )
    }
    if (key === 'price') {
      return String(getAdditionalItemUnitPrice(item))
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
        <>
          <button
            type="button"
            onClick={startNew}
            className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
          >
            Novo item adicional
          </button>
          {/* TODO: upload para bucket additional-item-images quando API existir */}
          <button
            type="button"
            disabled
            title="Upload de foto em breve"
            className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-xl border border-cdl-border px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-muted opacity-50"
          >
            Foto em breve
          </button>
        </>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
        <table className="w-full min-w-[1000px] border-collapse text-left">
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
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted">
                Status
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
                    ) : (
                      <input
                        type={col.type ?? 'text'}
                        value={String(draft[col.key] ?? '')}
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
                <td className="px-3 py-2 text-xs">Novo</td>
              </tr>
            ) : null}

            {filteredItems.length === 0 && editingId !== 'new' ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 2}
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
                  <td className="px-3 py-2 text-xs text-cdl-muted">
                    {item.active === false ? 'Inativo' : 'Ativo'}
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
