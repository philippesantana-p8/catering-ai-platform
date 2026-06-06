import Link from 'next/link'
import CdlBrandLogo from '../../components/CdlBrandLogo'
import { CUSTOMER_QUOTE_SECTIONS } from '../../Lib/cdlCommercialRules'

export default function CustomerQuotePage() {
  return (
    <main className="min-h-screen bg-cdl-bg text-cdl-fg">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <CdlBrandLogo className="h-20 w-20 sm:h-24 sm:w-24" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cdl-muted">
            BBQ AT HOME · CDL
          </p>
          <h1 className="mt-3 text-3xl font-black text-cdl-title sm:text-4xl">
            Entenda como funciona
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-cdl-text-secondary sm:text-base">
            Antes de iniciar sua cotação, conheça o serviço, os pacotes e as
            regras comerciais da CDL.
          </p>
        </header>

        <div className="space-y-5">
          {CUSTOMER_QUOTE_SECTIONS.map((section, index) => (
            <section
              key={section.title}
              className="rounded-2xl border border-cdl-border bg-cdl-surface p-6 shadow-cdl sm:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cdl-accent text-sm font-black text-cdl-on-accent">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-cdl-title sm:text-xl">
                    {section.title}
                  </h2>
                  <ul className="mt-4 space-y-2 text-sm text-cdl-text-secondary sm:text-base">
                    {section.body.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="text-cdl-title" aria-hidden>
                          •
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/quotes/new" className="cdl-btn-primary w-full sm:w-auto">
            Iniciar minha cotação
          </Link>
          <Link
            href="/"
            className="w-full rounded-xl border border-cdl-border bg-cdl-surface px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border sm:w-auto"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  )
}
