'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AppMainNav from '@/components/AppMainNav'
import type { PackageListItem } from '@/Lib/fetchPackages'
import type { PackagesInsertPayload } from '@/Lib/packagesTableSchema'

type ActiveFilter = 'active' | 'all'

const EMPTY_FORM: PackagesInsertPayload = {
  package_key: '',
  package_name: '',
  label_pt: '',
  label_en: '',
  label_es: '',
  description_pt: '',
  description_en: '',
  description_es: '',
  price_per_person: 0,
  currency_code: 'USD',
  display_order: 0,
  image_url: '',
  active: true,
}

function formatPrice(value: number | null | undefined, currency?: string | null) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency?.trim() || 'USD',
  }).format(value)
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchPackagesFromApi(
  query: string,
  activeFilter: ActiveFilter,
): Promise<PackageListItem[]> {
  const params = new URLSearchParams({ _: String(Date.now()) })
  if (query.trim()) params.set('q', query.trim())
  params.set('active', activeFilter === 'all' ? 'all' : 'true')

  const response = await fetch(`/api/packages?${params.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
  const result = (await response.json()) as {
    data?: PackageListItem[]
    error?: string
  }
  if (!response.ok) {
    throw new Error(result.error ?? 'Não foi possível buscar pacotes.')
  }
  return result.data ?? []
}

export default function PackagesDashboard({
  initialPackages,
}: {
  initialPackages: PackageListItem[]
}) {
  const [packages, setPackages] = useState<PackageListItem[]>(initialPackages)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PackagesInsertPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return packages
    return packages.filter((pkg) => {
      const haystack = [
        pkg.package_name,
        pkg.package_key,
        pkg.label_pt,
        pkg.label_en,
        pkg.label_es,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [packages, search])

  const refreshPackages = useCallback(
    async (query = search, filter = activeFilter) => {
      setLoading(true)
      setError(null)
      try {
        const next = await fetchPackagesFromApi(query, filter)
        setPackages(next)
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : 'Erro ao atualizar pacotes.',
        )
      } finally {
        setLoading(false)
      }
    },
    [search, activeFilter],
  )

  useEffect(() => {
    setPackages(initialPackages)
  }, [initialPackages])

  useEffect(() => {
    void refreshPackages(search, activeFilter)
  }, [activeFilter])

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
  }

  function openEditForm(pkg: PackageListItem) {
    setEditingId(pkg.id)
    setForm({
      package_key: pkg.package_key ?? '',
      package_name: pkg.package_name ?? '',
      label_pt: pkg.label_pt ?? '',
      label_en: pkg.label_en ?? '',
      label_es: pkg.label_es ?? '',
      description_pt: pkg.description_pt ?? '',
      description_en: pkg.description_en ?? '',
      description_es: pkg.description_es ?? '',
      price_per_person: pkg.price_per_person ?? 0,
      currency_code: pkg.currency_code ?? 'USD',
      display_order: pkg.display_order ?? 0,
      image_url: pkg.image_url ?? '',
      active: pkg.active !== false,
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
      const url = editingId ? `/api/packages/${editingId}` : '/api/packages'
      const method = editingId ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar pacote.')
      }
      closeForm()
      await refreshPackages()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Erro ao salvar pacote.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(pkg: PackageListItem) {
    const label = pkg.label_pt ?? pkg.package_name ?? pkg.package_key ?? 'Pacote'
    const confirmed = window.confirm(
      `Excluir "${label}"?\n\nO pacote será desativado (soft delete).`,
    )
    if (!confirmed) return

    setDeletingId(pkg.id)
    setError(null)
    try {
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível excluir pacote.')
      }
      setPackages((current) => current.filter((row) => row.id !== pkg.id))
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Erro ao excluir pacote.',
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
              Pacotes
            </h1>
            <p className="mt-1 text-sm text-cdl-muted">
              Catálogo de pacotes da operação
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateForm}
              className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
            >
              Novo pacote
            </button>
            <Link
              href="/packages/images"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg"
            >
              Imagens
            </Link>
            <button
              type="button"
              onClick={() => void refreshPackages()}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg disabled:opacity-50"
            >
              {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-2">
              <span className="cdl-eyebrow">Buscar pacote</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, chave ou rótulo"
                className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
              />
            </label>
            <label className="flex flex-col gap-2 sm:w-48">
              <span className="cdl-eyebrow">Status</span>
              <select
                value={activeFilter}
                onChange={(e) =>
                  setActiveFilter(e.target.value as ActiveFilter)
                }
                className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
              >
                <option value="active">Ativos</option>
                <option value="all">Todos (incl. inativos)</option>
              </select>
            </label>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-cdl-action">{error}</p>
          ) : null}
        </div>

        {filteredPackages.length === 0 ? (
          <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-8 text-center text-cdl-muted">
            {loading ? 'Buscando pacotes…' : 'Nenhum pacote encontrado.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredPackages.map((pkg) => (
              <article
                key={pkg.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-cdl-surface p-5 shadow-cdl ${
                  pkg.active === false
                    ? 'border-cdl-border opacity-60'
                    : 'border-cdl-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {pkg.package_key ? (
                      <p className="text-xs font-semibold uppercase tracking-wider text-cdl-brand">
                        {pkg.package_key}
                      </p>
                    ) : null}
                    <h2 className="mt-1 text-lg font-bold text-cdl-fg">
                      {pkg.label_pt ?? pkg.package_name ?? '—'}
                    </h2>
                    <p className="mt-1 text-sm text-cdl-muted">
                      {formatPrice(pkg.price_per_person, pkg.currency_code)} / pessoa
                    </p>
                  </div>
                  {pkg.active === false ? (
                    <span className="rounded-full border border-cdl-border px-2 py-1 text-xs font-bold uppercase text-cdl-muted">
                      Inativo
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 text-sm text-cdl-muted">
                  {pkg.label_en ? <p>EN: {pkg.label_en}</p> : null}
                  {pkg.label_es ? <p>ES: {pkg.label_es}</p> : null}
                  <p className="text-xs">
                    Ordem {pkg.display_order ?? 0} · Atualizado em{' '}
                    {formatUpdatedAt(pkg.updated_at)}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(pkg)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-cdl-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-fg"
                  >
                    Editar
                  </button>
                  <Link
                    href={`/packages/images`}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-cdl-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-fg"
                  >
                    Imagem
                  </Link>
                  {pkg.active !== false ? (
                    <button
                      type="button"
                      onClick={() => void handleDeactivate(pkg)}
                      disabled={deletingId === pkg.id}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-cdl-action px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-action disabled:opacity-50"
                    >
                      {deletingId === pkg.id ? 'Excluindo…' : 'Excluir'}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cdl-border bg-cdl-surface p-6 shadow-cdl"
          >
            <h2 className="text-xl font-black text-cdl-title">
              {editingId ? 'Editar pacote' : 'Novo pacote'}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  ['package_key', 'Chave (package_key)', 'text'],
                  ['package_name', 'Nome interno', 'text'],
                  ['label_pt', 'Rótulo PT', 'text'],
                  ['label_en', 'Rótulo EN', 'text'],
                  ['label_es', 'Rótulo ES', 'text'],
                  ['price_per_person', 'Preço/pessoa', 'number'],
                  ['currency_code', 'Moeda', 'text'],
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
              {(
                [
                  ['description_pt', 'Descrição PT'],
                  ['description_en', 'Descrição EN'],
                  ['description_es', 'Descrição ES'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="col-span-full flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                    {label}
                  </span>
                  <textarea
                    rows={3}
                    value={String(form[key] ?? '')}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }))
                    }
                    className="rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
                  />
                </label>
              ))}
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
