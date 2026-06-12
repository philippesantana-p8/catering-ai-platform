export type HelpRouteContext = {
  title: string
  description: string
  quickTips: string[]
}

const DEFAULT_CONTEXT: HelpRouteContext = {
  title: 'Ajuda',
  description: 'Posso ajudar você a navegar e utilizar o sistema.',
  quickTips: [
    'Use o menu superior para alternar entre módulos.',
    'Em dúvida, revise os dados antes de salvar.',
  ],
}

function matchContext(
  pathname: string,
  rules: Array<{ test: (path: string) => boolean; ctx: HelpRouteContext }>,
): HelpRouteContext | null {
  for (const rule of rules) {
    if (rule.test(pathname)) return rule.ctx
  }
  return null
}

const ROUTE_RULES: Array<{
  test: (path: string) => boolean
  ctx: HelpRouteContext
}> = [
  {
    test: (path) => path === '/quotes/new',
    ctx: {
      title: 'Ajuda na cotação',
      description:
        'Posso ajudar com cliente, pacote, adicionais, regras e revisão da proposta.',
      quickTips: [
        'Confirme cliente, data e número de convidados.',
        'Na etapa Pacote, revise itens fixos, escolhas e guarnições.',
        'Antes de enviar, valide endereço e distância.',
      ],
    },
  },
  {
    test: (path) => /^\/quotes\/[^/]+\/edit$/.test(path),
    ctx: {
      title: 'Ajuda na edição da cotação',
      description:
        'Posso ajudar a revisar alterações, pacote, adicionais e pendências antes de salvar.',
      quickTips: [
        'Alterações no pacote podem resetar escolhas inclusas.',
        'Revise o total por pessoa após mudanças.',
      ],
    },
  },
  {
    test: (path) => path === '/packages' || path.startsWith('/packages/'),
    ctx: {
      title: 'Ajuda nos pacotes',
      description:
        'Posso ajudar a revisar itens, guarnições, diferenciais e escolhas configuráveis.',
      quickTips: [
        'Separe itens fixos, guarnições e escolhas inclusas.',
        'Vincule adicionais para bloqueio e custo.',
      ],
    },
  },
  {
    test: (path) =>
      path === '/additional-items' || path.startsWith('/additional-items/'),
    ctx: {
      title: 'Ajuda no cadastro de itens',
      description:
        'Posso ajudar com categoria, preço, vínculo comercial e uso no sistema.',
      quickTips: [
        'Itens inativos não aparecem na cotação.',
        'Categoria e preço impactam a etapa de adicionais.',
      ],
    },
  },
  {
    test: (path) => path === '/customers' || path.startsWith('/customers/'),
    ctx: {
      title: 'Ajuda no cadastro de clientes',
      description:
        'Posso ajudar com nome, telefone, endereço e validação.',
      quickTips: [
        'Telefone válido facilita contato e confirmação.',
        'Endereço completo ajuda na etapa de logística.',
      ],
    },
  },
  {
    test: (path) =>
      path === '/commercial-rules' || path.startsWith('/commercial-rules/'),
    ctx: {
      title: 'Ajuda nas regras comerciais',
      description:
        'Posso ajudar com mínimos, taxas, descontos e critérios de cobrança.',
      quickTips: [
        'Regras afetam cálculo automático da cotação.',
        'Revise valores mínimos antes de fechar propostas.',
      ],
    },
  },
  {
    test: (path) => path === '/quotes' || /^\/quotes\/[^/]+$/.test(path),
    ctx: {
      title: 'Ajuda nas cotações',
      description: 'Posso ajudar a revisar status, pendências e envio.',
      quickTips: [
        'Filtre por data para encontrar eventos próximos.',
        'Abra a cotação para ver detalhes e PDF.',
      ],
    },
  },
  {
    test: (path) =>
      path === '/customer-quote' || path.startsWith('/customer-quote/'),
    ctx: {
      title: 'Ajuda da proposta',
      description: 'Posso explicar a proposta e orientar o cliente.',
      quickTips: [
        'Revise pacote, adicionais e valores com o cliente.',
        'Confirme data, local e número de convidados.',
      ],
    },
  },
  {
    test: (path) => path === '/' || path === '/quote-request',
    ctx: {
      title: 'Ajuda do sistema',
      description:
        'Central de ajuda para operação comercial e cotações.',
      quickTips: [
        'Comece uma nova cotação pelo menu Cotações.',
        'Mantenha pacotes e adicionais atualizados no cadastro.',
      ],
    },
  },
]

export function resolveHelpContext(pathname: string): HelpRouteContext {
  const normalized = pathname.split('?')[0]?.trim() || '/'
  return matchContext(normalized, ROUTE_RULES) ?? DEFAULT_CONTEXT
}

export function isHelpHiddenRoute(pathname: string): boolean {
  const path = pathname.toLowerCase()
  const hidden = ['/login', '/auth', '/sign-in', '/signin', '/onboarding']
  return hidden.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

export function isQuoteFlowRoute(pathname: string): boolean {
  return (
    pathname === '/quotes/new' ||
    /^\/quotes\/[^/]+\/edit$/.test(pathname)
  )
}
