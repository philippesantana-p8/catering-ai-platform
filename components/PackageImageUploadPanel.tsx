'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type PackageRow = {
  id: string
  package_key?: string | null
  package_name?: string | null
  label_pt?: string | null
  image_url?: string | null
  photo_url?: string | null
}

function getPackageLabel(pkg: PackageRow) {
  return (
    pkg.label_pt?.trim() ||
    pkg.package_name?.trim() ||
    pkg.package_key?.trim() ||
    pkg.id
  )
}

function getPackageImage(pkg: PackageRow) {
  return pkg.image_url ?? pkg.photo_url ?? null
}

export default function PackageImageUploadPanel({
  packages,
}: {
  packages: PackageRow[]
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(packages[0]?.id ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selected = packages.find((pkg) => pkg.id === selectedId) ?? null
  const previewUrl = selected ? getPackageImage(selected) : null

  async function handleUpload(file: File | null) {
    if (!file || !selectedId) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/packages/${selectedId}/image`, {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as {
        image_url?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(result.error ?? 'Falha ao enviar imagem.')
      }

      setSuccess('Imagem atualizada com sucesso.')
      router.refresh()
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Falha ao enviar imagem.',
      )
    } finally {
      setUploading(false)
    }
  }

  if (packages.length === 0) {
    return (
      <p className="text-sm text-cdl-muted">Nenhum pacote ativo encontrado.</p>
    )
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="cdl-eyebrow">Pacote</span>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value)
            setError(null)
            setSuccess(null)
          }}
          className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-3 text-sm text-cdl-fg"
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {getPackageLabel(pkg)}
            </option>
          ))}
        </select>
      </label>

      <div className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-inset">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={selected ? getPackageLabel(selected) : 'Pacote'}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm font-semibold uppercase tracking-wider text-cdl-muted">
            Sem imagem
          </div>
        )}
      </div>

      <label className="block">
        <span className="cdl-eyebrow">Nova imagem</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            void handleUpload(file)
          }}
          className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-surface px-3 py-3 text-sm text-cdl-fg file:mr-3 file:rounded-lg file:border-0 file:bg-cdl-accent file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:text-cdl-on-accent"
        />
      </label>

      <p className="text-xs text-cdl-muted">
        Bucket Supabase: <code>package-images</code> · salva em{' '}
        <code>packages.image_url</code>
      </p>
      {/* Future: additional_items.image_url and bucket additional-item-images. */}

      {uploading ? (
        <p className="text-sm text-cdl-muted">Enviando imagem…</p>
      ) : null}
      {error ? <p className="text-sm text-cdl-action">{error}</p> : null}
      {success ? <p className="text-sm text-cdl-success">{success}</p> : null}
    </div>
  )
}
