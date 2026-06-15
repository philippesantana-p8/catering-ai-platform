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

export default function QuoteStepHeader({
  step,
  isEditMode = false,
}: {
  step: number
  isEditMode?: boolean
}) {
  const subtitle = STEP_SUBTITLES[step]

  return (
    <header className="mb-3 sm:mb-4">
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
        <h1 className="text-2xl font-black tracking-tight text-cdl-title sm:text-3xl">
          {isEditMode ? 'Editar cotação CDL' : 'Nova cotação CDL'}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-cdl-muted">{subtitle}</p>
        ) : null}
      </div>
    </header>
  )
}
