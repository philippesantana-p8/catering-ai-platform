'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import {
  BackofficeAccentBadge,
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

function formatPrice(value: number | null | undefined, currency = 'USD') {
  const amount = Number(value ?? 0)
  return `${currency === 'USD' ? '$' : ''}${amount.toFixed(2)}`
}

function PackageEditFields({
  draft,
  setDraft,
}: {
  draft: PackagesInsertPayload
  setDraft: React.Dispatch<React.SetStateAction<PackagesInsertPayload>>
}) {
  return (
    <>
      <BackofficeField label="Chave">
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
      <BackofficeField label="PT">
        <BackofficeInput
          value={draft.label_pt ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, label_pt: v }))}
        />
      </BackofficeField>
      <BackofficeField label="EN">
        <BackofficeInput
          value={draft.label_en ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, label_en: v }))}
        />
      </BackofficeField>
      <BackofficeField label="ES">
        <BackofficeInput
          value={draft.label_es ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, label_es: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Preço / pessoa">
        <BackofficeInput
          type="number"
          value={draft.price_per_person ?? 0}
          onChange={(v) =>
            setDraft((c) => ({ ...c, price_per_person: Number(v) }))
          }
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
      <BackofficeField label="Imagem URL" className="sm:col-span-2 lg:col-span-3">
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

  function renderPackageCard(pkg: PackageListItem) {
    const isEditing = editingId === pkg.id
    const packageKey = pkg.package_key ?? '—'
    const displayName = pkg.label_pt ?? pkg.package_name ?? packageKey
    const withSides = packageKey.trim().endsWith('+')
    const imageUrl = isEditing
      ? String(draft.image_url ?? '').trim() || null
      : pkg.image_url?.trim() || null
    const currency = pkg.currency_code ?? 'USD'

    if (isEditing) {
      return (
        <BackofficeFormCard
          key={pkg.id}
          title={`Editar pacote · ${packageKey}`}
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
                onClick={() => triggerUpload(pkg.id)}
                disabled={uploadingId === pkg.id}
              >
                {uploadingId === pkg.id ? 'Enviando…' : 'Enviar foto'}
              </BackofficeBtnOutline>
            </>
          }
        >
          <div className="col-span-full mb-2 max-w-xs">
            <CatalogImageFrame
              src={imageUrl}
              alt={displayName}
              variant="package"
              fallbackLabel="Sem imagem cadastrada"
              rounded="all"
              className="!aspect-[4/3] !min-h-0 !max-h-none"
            />
          </div>
          <PackageEditFields draft={draft} setDraft={setDraft} />
        </BackofficeFormCard>
      )
    }

    return (
      <BackofficeEntityCard
        key={pkg.id}
        inactive={pkg.active === false}
        image={
          <BackofficeCardImage>
            <CatalogImageFrame
              src={imageUrl}
              alt={displayName}
              variant="package"
              fallbackLabel="Sem imagem cadastrada"
              rounded="none"
              className="!h-full !min-h-0 !max-h-none !w-full !rounded-none"
            />
          </BackofficeCardImage>
        }
        actions={
          <>
            <BackofficeBtnSecondary onClick={() => startEdit(pkg)}>
              Editar
            </BackofficeBtnSecondary>
            <BackofficeBtnOutline
              accent
              onClick={() => triggerUpload(pkg.id)}
              disabled={uploadingId === pkg.id}
            >
              {uploadingId === pkg.id ? 'Enviando…' : 'Foto'}
            </BackofficeBtnOutline>
            {pkg.active !== false ? (
              <BackofficeBtnDanger onClick={() => void deactivate(pkg)}>
                Inativar
              </BackofficeBtnDanger>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {packageKey}
          </span>
          {withSides ? <BackofficeAccentBadge>Com guarnições</BackofficeAccentBadge> : null}
          <BackofficeStatusBadge active={pkg.active !== false} />
        </div>
        <h3 className="text-xl font-bold text-neutral-900">{displayName}</h3>
        <p className="text-2xl font-black text-red-600">
          {formatPrice(pkg.price_per_person, currency)}
          <span className="ml-1 text-sm font-semibold text-neutral-500">
            / pessoa
          </span>
        </p>
        <BackofficeMetaRow label="Moeda" value={currency} />
        <BackofficeMetaRow label="Ordem" value={pkg.display_order ?? 0} />
        {pkg.label_en ? (
          <BackofficeMetaRow label="EN" value={pkg.label_en} />
        ) : null}
      </BackofficeEntityCard>
    )
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
            href="/packages/images#pacotes"
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
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileSelected(e.target.files?.[0])}
      />

      <BackofficeCardGrid>
        {editingId === 'new' ? (
          <BackofficeFormCard
            title="Novo pacote"
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
            <PackageEditFields draft={draft} setDraft={setDraft} />
          </BackofficeFormCard>
        ) : null}

        {filteredPackages.length === 0 && editingId !== 'new' ? (
          <BackofficeEmptyState loading={loading} message="Nenhum pacote encontrado." />
        ) : (
          filteredPackages.map((pkg) => renderPackageCard(pkg))
        )}
      </BackofficeCardGrid>
    </BackofficeTableShell>
  )
}
