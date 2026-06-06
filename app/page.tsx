import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cdl-bg px-6 py-16 text-cdl-fg">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-black text-cdl-title sm:text-5xl">
          BBQ AT HOME
        </h1>
        <p className="mt-4 text-lg text-cdl-text-secondary">
          Catering AI Platform · CDL
        </p>
        <Link
          href="/quotes"
          className="mt-8 inline-block rounded-xl bg-cdl-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-cdl-on-accent transition-opacity hover:opacity-90"
        >
          Ver cotações
        </Link>
      </div>
    </main>
  )
}
