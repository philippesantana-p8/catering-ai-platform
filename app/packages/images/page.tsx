import Link from 'next/link'
import AppMainNav from '@/components/AppMainNav'
import AdditionalItemImageUploadPanel from '@/components/AdditionalItemImageUploadPanel'
import PackageImageUploadPanel from '@/components/PackageImageUploadPanel'
import { buildAdditionalItemsListSelect } from '@/Lib/additionalItemsTableSchema'
import { supabase } from '@/Lib/supabase'

export default async function CatalogImagesPage() {
  const [packagesRes, additionalRes] = await Promise.all([
    supabase
      .from('packages')
      .select('id, package_key, package_name, label_pt, image_url')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('additional_items')
      .select(buildAdditionalItemsListSelect())
      .eq('active', true)
      .order('category_pt', { ascending: true })
      .order('display_order', { ascending: true }),
  ])

  const packagesError = packagesRes.error?.message ?? null
  const additionalError = additionalRes.error?.message ?? null

  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-8 text-cdl-fg sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <AppMainNav />

        <div>
          <h1 className="text-2xl font-black text-cdl-title">Imagens do catálogo</h1>
          <p className="mt-1 text-sm text-cdl-muted">
            Upload de imagens para pacotes e itens adicionais.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          <a
            href="#pacotes"
            className="inline-flex min-h-[40px] items-center rounded-xl border border-cdl-border bg-cdl-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-fg hover:border-cdl-accent-border"
          >
            Pacotes
          </a>
          <a
            href="#adicionais"
            className="inline-flex min-h-[40px] items-center rounded-xl border border-cdl-border bg-cdl-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-fg hover:border-cdl-accent-border"
          >
            Itens adicionais
          </a>
        </nav>

        <section id="pacotes" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-cdl-title">Pacotes</h2>
              <p className="text-sm text-cdl-muted">
                Imagens exibidas na seleção de pacotes do wizard.
              </p>
            </div>
            <Link
              href="/packages"
              className="text-sm font-semibold text-cdl-brand hover:underline"
            >
              ← Voltar aos pacotes
            </Link>
          </div>

          {packagesError ? (
            <pre className="rounded-2xl border border-red-500/40 bg-cdl-surface p-4 text-sm text-red-400">
              {packagesError}
            </pre>
          ) : (
            <section className="cdl-panel p-5 sm:p-7">
              <PackageImageUploadPanel packages={packagesRes.data ?? []} />
            </section>
          )}
        </section>

        <section id="adicionais" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-cdl-title">
                Itens adicionais
              </h2>
              <p className="text-sm text-cdl-muted">
                Imagens exibidas na etapa de adicionais do wizard.
              </p>
            </div>
            <Link
              href="/additional-items"
              className="text-sm font-semibold text-cdl-brand hover:underline"
            >
              ← Voltar aos adicionais
            </Link>
          </div>

          {additionalError ? (
            <pre className="rounded-2xl border border-red-500/40 bg-cdl-surface p-4 text-sm text-red-400">
              {additionalError}
            </pre>
          ) : (
            <section className="cdl-panel p-5 sm:p-7">
              <AdditionalItemImageUploadPanel items={additionalRes.data ?? []} />
            </section>
          )}
        </section>
      </div>
    </main>
  )
}
