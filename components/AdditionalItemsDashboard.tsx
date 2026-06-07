'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AppMainNav from '@/components/AppMainNav'
import type { AdditionalItemListItem } from '@/Lib/fetchAdditionalItems'
import type { AdditionalItemsInsertPayload } from '@/Lib/additionalItemsTableSchema'

type ActiveFilter = 'active' | 'all'

const EMPTY_FORM: AdditionalItemsInsertPayload = {
  item_key: '',
  label_pt: '',
  label_en: '',
  label_es: '',
  category_pt: '',
  category_en: '',
  category_es: '',
  unit_price: 0,
  pricing_type: 'PER_UNIT',
  charge_type: 'UNIT',
  quantity: 1,
  unit: '',
  unit_label: '',
  display_order: 0,
  image_url: '',
  active: true,
}

function formatPrice(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function isPerPerson(item: AdditionalItemListItem) {
  return (
    item.pricing_type === 'PER_PERSON' || item.charge_type === 'PERSON'
  )
}

async function fetchItemsFromApi(
  query: string,
  activeFilter: ActiveFilter,
  category: string,
): Promise<AdditionalItemListItem[]> {
  const params = new URLSearchParams({ _: String(Date.now()) })
  if (query.trim()) params.set('q', query.trim())
  if (category.trim()) params.set('category', category.trim())
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
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AdditionalItemsInsertPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      const cat = item.category_pt?.trim()
      if (cat) set.add(cat)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [items])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (categoryFilter && (item.category_pt ?? '') !== categoryFilter) {
        return false
      }
      if (!q) return true
      const haystack = [
        item.item_key,
        item.label_pt,
        item.label_en,
        item.category_pt,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, search, categoryFilter])

  const refreshItems = useCallback(
    async (query = search, filter = activeFilter, category = categoryFilter) => {
      setLoading(true)
      setError(null)
      try {
        const next = await fetchItemsFromApi(query, filter, category)
        setItems(next)
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : 'Erro ao atualizar itens.',
        )
      } finally {
        setLoading(false)
      }
    },
    [search, activeFilter, categoryFilter],
  )

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    void refreshItems(search, activeFilter, categoryFilter)
  }, [activeFilter, categoryFilter])

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
  }

  function openEditForm(item: AdditionalItemListItem) {
    setEditingId(item.id)
    setForm({
      item_key: item.item_key ?? '',
      label_pt: item.label_pt ?? '',
      label_en: item.label_en ?? '',
      label_es: item.label_es ?? '',
      category_pt: item.category_pt ?? '',
      category_en: item.category_en ?? '',
      category_es: item.category_es ?? '',
      unit_price: item.unit_price ?? item.price ?? 0,
      pricing_type: item.pricing_type ?? 'PER_UNIT',
      charge_type: item.charge_type ?? 'UNIT',
      quantity: item.quantity ?? 1,
      unit: item.unit ?? '',
      unit_label: item.unit_label ?? '',
      display_order: item.display_order ?? 0,
      image_url: item.image_url ?? '',
      active: item.active !== false,
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const url = editingId
        ? `/api/additional-items/${editingId}`
        : '/api/additional-items'
      const method = editingId ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar item.')
      }
      closeForm()
      await refreshItems()
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Erro ao salvar item.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(item: AdditionalItemListItem) {
    const label = item.label_pt ?? item.item_key ?? 'Item'
    const confirmed = window.confirm(
      `Excluir "${label}"?\n\nO item será desativado (soft delete).`,
    )
    if (!confirmed) return

    setDeletingId(item.id)
    setError(null)
    try {
      const response = await fetch(`/api/additional-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível excluir item.')
      }
      setItems((current) => current.filter((row) => row.id !== item.id))
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Erro ao excluir item.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <AppMainNav />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-cdl-title sm:text-3xl">
              Itens adicionais
            </h1>
            <p className="mt-1 text-sm text-cdl-muted">
              Catálogo de adicionais para cotações
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateForm}
              className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
            >
              Novo item
            </button>
            <button
              type="button"
              onClick={() => void refreshItems()}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg disabled:opacity-50"
            >
              {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 sm:col-span-1">
              <span className="cdl-eyebrow">Buscar</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, chave ou categoria"
                className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="cdl-eyebrow">Categoria</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="cdl-eyebrow">Status</span>
              <select
                value={activeFilter}
                onChange={(e) =>
                  setActiveFilter(e.target.value as ActiveFilter)
                }
                className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
              >
                <option value="active">Ativos</option>
                <option value="all">Todos</option>
              </select>
            </label>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-cdl-action">{error}</p>
          ) : null}
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-8 text-center text-cdl-muted">
            {loading ? 'Buscando itens…' : 'Nenhum item encontrado.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-cdl-surface p-5 shadow-cdl ${
                  item.active === false ? 'opacity-60' : ''
                }`}
              >
                <div>
                  {item.category_pt ? (
                    <p className="text-xs font-semibold uppercase tracking-wider text-cdl-brand">
                      {item.category_pt}
                    </p>
                  ) : null}
                  <h2 className="mt-1 text-lg font-bold text-cdl-fg">
                    {item.label_pt ?? item.item_key ?? '—'}
                  </h2>
                  <p className="mt-1 text-sm text-cdl-muted">
                    {formatPrice(item.unit_price ?? item.price)}
                    {isPerPerson(item) ? ' / pessoa' : ' / unidade'}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-cdl-muted">
                  {item.item_key ? <p>Chave: {item.item_key}</p> : null}
                  {item.image_url ? (
                    <p className="truncate">Imagem: {item.image_url}</p>
                  ) : (
                    <p className="text-xs italic">
                      {/* TODO: upload de imagem quando bucket additional-item-images existir */}
                      Sem imagem
                    </p>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(item)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-cdl-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-fg"
                  >
                    Editar
                  </button>
                  {item.active !== false ? (
                    <button
                      type="button"
                      onClick={() => void handleDeactivate(item)}
                      disabled={deletingId === item.id}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-cdl-action px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-action disabled:opacity-50"
                    >
                      {deletingId === item.id ? 'Excluindo…' : 'Excluir'}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-cdl-muted">
          <Link href="/quotes/new" className="text-cdl-brand hover:underline">
            Nova cotação
          </Link>
        </p>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cdl-border bg-cdl-surface p-6 shadow-cdl"
          >
            <h2 className="text-xl font-black text-cdl-title">
              {editingId ? 'Editar item' : 'Novo item'}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  ['item_key', 'Chave (item_key)', 'text'],
                  ['label_pt', 'Rótulo PT', 'text'],
                  ['label_en', 'Rótulo EN', 'text'],
                  ['label_es', 'Rótulo ES', 'text'],
                  ['category_pt', 'Categoria PT', 'text'],
                  ['category_en', 'Categoria EN', 'text'],
                  ['category_es', 'Categoria ES', 'text'],
                  ['unit_price', 'Preço unitário', 'number'],
                  ['display_order', 'Ordem', 'number'],
                  ['image_url', 'URL da imagem', 'text'],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={String(form[key] ?? '')}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        [key]:
                          type === 'number'
                            ? Number(e.target.value)
                            : e.target.value,
                      }))
                    }
                    className="rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                  Tipo de cobrança
                </span>
                <select
                  value={String(form.pricing_type ?? 'PER_UNIT')}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      pricing_type: e.target.value,
                      charge_type:
                        e.target.value === 'PER_PERSON' ? 'PERSON' : 'UNIT',
                    }))
                  }
                  className="rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
                >
                  <option value="PER_UNIT">Por unidade</option>
                  <option value="PER_PERSON">Por pessoa</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border px-5 py-3 text-sm font-bold text-cdl-fg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
