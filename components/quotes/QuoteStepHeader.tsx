'use client'

import CdlBrandLogo from '@/components/CdlBrandLogo'

const STEP_SUBTITLES: Record<number, string> = {
  0: 'Identifique o cliente para começar a cotação.',
  1: 'Informe data, local e detalhes do evento.',
  2: 'Escolha o pacote e confira as opções disponíveis.',
  3: 'Selecione itens extras, se desejar.',
  4: 'Configure churrasqueira e equipamentos.',
  5: 'Informe distância e dados de deslocamento.',
  6: 'Defina reserva e pagamento inicial.',
  7: 'Revise tudo antes de confirmar.',
}

const STEP_CARDS: Record<number, { title: string; body: string }> = {
  0: {
    title: 'Etapa 1 — Cliente',
    body: 'Busque ou cadastre o cliente que receberá a proposta.',
  },
  1: {
    title: 'Etapa 2 — Evento',
    body: 'Preencha data, horário e endereço do evento.',
  },
  2: {
    title: 'Etapa 3 — Pacote',
    body: 'Selecione o pacote, escolha as opções obrigatórias e confira o valor por pessoa.',
  },
  3: {
    title: 'Etapa 4 — Adicionais',
    body: 'Adicione itens extras à cotação, se necessário.',
  },
  4: {
    title: 'Etapa 5 — Churrasco',
    body: 'Informe se haverá churrasqueira no local e envie foto, se aplicável.',
  },
  5: {
    title: 'Etapa 6 — Dados',
    body: 'Confirme milhagem e informações de deslocamento.',
  },
  6: {
    title: 'Etapa 7 — Resumo',
    body: 'Revise valores, reserva e condições antes de salvar.',
  },
  7: {
    title: 'Etapa 8 — Confirmação',
    body: 'Salve a cotação e envie a proposta ao cliente.',
  },
}

export default function QuoteStepHeader({
  step,
  isEditMode = false,
}: {
  step: number
  isEditMode?: boolean
}) {
  const card = STEP_CARDS[step]
  const subtitle = STEP_SUBTITLES[step]

  return (
    <header className="mb-3 space-y-3 sm:mb-4">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cdl-border-subtle bg-white">
          <CdlBrandLogo size="sm" className="!h-8 !w-8 !max-h-8 !max-w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black text-cdl-title">
            {isEditMode ? 'Editar cotação CDL' : 'Nova cotação CDL'}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-cdl-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-black tracking-tight text-cdl-title">
          {isEditMode ? 'Editar cotação CDL' : 'Nova cotação CDL'}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-cdl-muted">{subtitle}</p>
        ) : null}
      </div>

      {card ? (
        <section className="rounded-2xl border border-cdl-border bg-cdl-surface px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <h2 className="text-sm font-bold text-cdl-title sm:text-base">
            {card.title}
          </h2>
          <p className="mt-1 text-sm text-cdl-muted">{card.body}</p>
        </section>
      ) : null}
    </header>
  )
}
