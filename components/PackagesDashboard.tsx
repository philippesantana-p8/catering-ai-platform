'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import type { PackageListItem } from '@/Lib/fetchPackages'
import type { PackagesInsertPayload } from '@/Lib/packagesTableSchema'

type ActiveFilter = 'active' | 'all'

const EMPTY_ROW: PackagesInsertPayload = {
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
}

const TABLE_COLUMNS: Array<{
  key: keyof PackagesInsertPayload | 'actions'
  label: string
  type?: 'text' | 'number'
}> = [
  { key: 'package_key', label: 'Chave', type: 'text' },
  { key: 'package_name', label: 'Nome', type: 'text' },
  { key: 'label_pt', label: 'PT', type: 'text' },
  { key: 'label_en', label: 'EN', type: 'text' },
  { key: 'label_es', label: 'ES', type: 'text' },
  { key: 'price_per_person', label: 'Preço/pessoa', type: 'number' },
  { key: 'currency_code', label: 'Moeda', type: 'text' },
  { key: 'display_order', label: 'Ordem', type: 'number' },
  { key: 'image_url', label: 'Imagem URL', type: 'text' },
  { key: 'actions', label: 'Ações' },
]

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
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<PackagesInsertPayload>(EMPTY_ROW)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetIdRef = useRef<string | null>(null)

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return packages
    return packages.filter((pkg) =>
      [pkg.package_key, pkg.package_name, pkg.label_pt, pkg.label_en, pkg.label_es]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [packages, search])

  const refreshPackages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPackages(await fetchPackagesFromApi(search, activeFilter))
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Erro ao atualizar pacotes.',
      )
    } finally {
      setLoading(false)
    }
  }, [search, activeFilter])

  useEffect(() => {
    void refreshPackages()
  }, [activeFilter])

  function startNew() {
    setEditingId('new')
    setDraft({ ...EMPTY_ROW })
  }

  function startEdit(pkg: PackageListItem) {
    setEditingId(pkg.id)
    setDraft({
      package_key: pkg.package_key ?? '',
      package_name: pkg.package_name ?? '',
      label_pt: pkg.label_pt ?? '',
      label_en: pkg.label_en ?? '',
      label_es: pkg.label_es ?? '',
      price_per_person: pkg.price_per_person ?? 0,
      currency_code: pkg.currency_code ?? 'USD',
      display_order: pkg.display_order ?? 0,
      image_url: pkg.image_url ?? '',
      active: pkg.active !== false,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({ ...EMPTY_ROW })
  }

  async function saveRow() {
    setSaving(true)
    setError(null)
    try {
      const url =
        editingId && editingId !== 'new' ? `/api/packages/${editingId}` : '/api/packages'
      const method = editingId && editingId !== 'new' ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar pacote.')
      }
      cancelEdit()
      await refreshPackages()
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Erro ao salvar pacote.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(pkg: PackageListItem) {
    const label = pkg.label_pt ?? pkg.package_name ?? pkg.package_key ?? 'Pacote'
    if (!window.confirm(`Inativar "${label}"?`)) return

    setError(null)
    const response = await fetch(`/api/packages/${pkg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? 'Não foi possível inativar pacote.')
      return
    }
    setPackages((current) => current.filter((row) => row.id !== pkg.id))
  }

  function triggerUpload(pkgId: string) {
    uploadTargetIdRef.current = pkgId
    fileInputRef.current?.click()
  }

  async function handleFileSelected(file: File | undefined) {
    const pkgId = uploadTargetIdRef.current
    if (!file || !pkgId) return

    setUploadingId(pkgId)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`/api/packages/${pkgId}/image`, {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as {
        image_url?: string
        error?: string
      }
      if (!response.ok) {
        throw new Error(result.error ?? 'Falha no upload da imagem.')
      }
      if (editingId === pkgId && result.image_url) {
        setDraft((current) => ({ ...current, image_url: result.image_url }))
      }
      await refreshPackages()
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Erro ao enviar imagem.',
      )
    } finally {
      setUploadingId(null)
      uploadTargetIdRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function renderCell(
    pkg: PackageListItem,
    key: keyof PackagesInsertPayload,
    type: 'text' | 'number' = 'text',
  ) {
    if (editingId === pkg.id) {
      return (
        <input
          type={type}
          value={String(draft[key] ?? '')}
          onChange={(e) =>
            setDraft((current) => ({
              ...current,
              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
          className="w-full min-w-[80px] rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs text-cdl-fg"
        />
      )
    }
    const value = pkg[key as keyof PackageListItem]
    return <span className="text-sm text-cdl-fg">{String(value ?? '—')}</span>
  }

  return (
    <BackofficeTableShell
      title="Pacotes"
      subtitle="Catálogo de pacotes · Catering AI"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Nome, chave ou rótulo"
      activeFilter={activeFilter}
      onActiveFilterChange={setActiveFilter}
      onRefresh={() => void refreshPackages()}
      loading={loading}
      error={error}
      actions={
        <>
          <button
            type="button"
            onClick={startNew}
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
        </>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileSelected(e.target.files?.[0])}
      />

      <div className="overflow-x-auto rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="border-b border-cdl-border bg-cdl-inset/50">
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {editingId === 'new' ? (
              <tr className="border-b border-cdl-border bg-[color-mix(in_srgb,var(--brand-accent)_8%,transparent)]">
                {TABLE_COLUMNS.filter((c) => c.key !== 'actions').map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    <input
                      type={col.type ?? 'text'}
                      value={String(draft[col.key as keyof PackagesInsertPayload] ?? '')}
                      onChange={(e) =>
                        setDraft((current) => ({
                          ...current,
                          [col.key as keyof PackagesInsertPayload]:
                            col.type === 'number'
                              ? Number(e.target.value)
                              : e.target.value,
                        }))
                      }
                      className="w-full min-w-[80px] rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
                    />
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => void saveRow()}
                      disabled={saving}
                      className="rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-cdl-border px-3 py-1.5 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-cdl-muted">Novo</td>
              </tr>
            ) : null}

            {filteredPackages.length === 0 && editingId !== 'new' ? (
              <tr>
                <td
                  colSpan={TABLE_COLUMNS.length + 1}
                  className="px-4 py-10 text-center text-cdl-muted"
                >
                  {loading ? 'Carregando…' : 'Nenhum pacote encontrado.'}
                </td>
              </tr>
            ) : (
              filteredPackages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className={`border-b border-cdl-border ${pkg.active === false ? 'opacity-50' : ''}`}
                >
                  {TABLE_COLUMNS.filter((c) => c.key !== 'actions').map((col) => (
                    <td key={col.key} className="px-3 py-2 align-top">
                      {renderCell(pkg, col.key as keyof PackagesInsertPayload, col.type)}
                    </td>
                  ))}
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {editingId === pkg.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void saveRow()}
                            disabled={saving}
                            className="rounded-lg bg-[var(--brand-primary)] px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
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
                            onClick={() => startEdit(pkg)}
                            className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerUpload(pkg.id)}
                            disabled={uploadingId === pkg.id}
                            className="rounded-lg border border-[var(--brand-accent)] px-2 py-1 text-xs font-bold text-[var(--brand-accent)] disabled:opacity-50"
                          >
                            {uploadingId === pkg.id ? '…' : 'Foto'}
                          </button>
                          {pkg.active !== false ? (
                            <button
                              type="button"
                              onClick={() => void deactivate(pkg)}
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
                    {pkg.active === false ? 'Inativo' : 'Ativo'}
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
