import Link from 'next/link'
import AppMainNav from '@/components/AppMainNav'
import PackageImageUploadPanel from '@/components/PackageImageUploadPanel'
import { supabase } from '@/Lib/supabase'

export default async function PackageImagesPage() {
  const { data, error } = await supabase
    .from('packages')
    .select('id, package_key, package_name, label_pt, image_url, photo_url')
    .eq('active', true)
    .order('display_order', { ascending: true })

  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-8 text-cdl-fg sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <AppMainNav />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-cdl-title">
              Imagens dos pacotes
            </h1>
            <p className="mt-1 text-sm text-cdl-muted">
              Upload temporário para o catálogo de pacotes.
            </p>
          </div>
          <Link
            href="/quotes"
            className="text-sm font-semibold text-cdl-brand hover:underline"
          >
            ← Voltar às cotações
          </Link>
        </div>

        {error ? (
          <pre className="rounded-2xl border border-red-500/40 bg-cdl-surface p-4 text-sm text-red-400">
            {error.message}
          </pre>
        ) : (
          <section className="cdl-panel p-5 sm:p-7">
            <PackageImageUploadPanel packages={data ?? []} />
          </section>
        )}
      </div>
    </main>
  )
}
