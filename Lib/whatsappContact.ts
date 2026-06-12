/** Substituir pelo número oficial da CDL/Caio em formato internacional, sem +, espaços ou traços. Ex.: 14075551234 */
export const WHATSAPP_PHONE = 'NUMERO_DO_CAIO_AQUI'

const DEFAULT_MESSAGE =
  'Olá! Preciso de ajuda com uma cotação da CDL BBQ.'

export type WhatsappQuoteContext = {
  quoteNumber?: string | null
  customerName?: string | null
  packageName?: string | null
  totalAmount?: string | null
  publicQuoteUrl?: string | null
}

export function getWhatsappMessage(
  pathname: string,
  quoteContext?: WhatsappQuoteContext,
): string {
  const path = pathname.split('?')[0] ?? '/'

  if (
    quoteContext?.quoteNumber ||
    quoteContext?.customerName ||
    quoteContext?.packageName
  ) {
    const lines = ['Olá! Preciso de ajuda com esta cotação da CDL BBQ:']
    if (quoteContext.quoteNumber?.trim()) {
      lines.push(`Cotação: ${quoteContext.quoteNumber.trim()}`)
    }
    if (quoteContext.customerName?.trim()) {
      lines.push(`Cliente: ${quoteContext.customerName.trim()}`)
    }
    if (quoteContext.packageName?.trim()) {
      lines.push(`Pacote: ${quoteContext.packageName.trim()}`)
    }
    if (quoteContext.totalAmount?.trim()) {
      lines.push(`Total: ${quoteContext.totalAmount.trim()}`)
    }
    if (quoteContext.publicQuoteUrl?.trim()) {
      lines.push(`Link: ${quoteContext.publicQuoteUrl.trim()}`)
    }
    return lines.join('\n')
  }

  if (path.includes('/quotes/new')) {
    return 'Olá! Estou montando uma cotação da CDL BBQ e preciso de ajuda.'
  }
  if (path.includes('/quotes')) {
    return 'Olá! Preciso de ajuda com minhas cotações da CDL BBQ.'
  }
  if (path.includes('/packages')) {
    return 'Olá! Preciso de ajuda com os pacotes da CDL BBQ.'
  }
  if (path.includes('/additional-items') || path.includes('/items')) {
    return 'Olá! Preciso de ajuda com o cadastro de itens da CDL BBQ.'
  }
  if (path.includes('/customers')) {
    return 'Olá! Preciso de ajuda com o cadastro de cliente/endereço da CDL BBQ.'
  }
  if (path.includes('/customer-quote')) {
    return 'Olá! Tenho uma dúvida sobre minha proposta da CDL BBQ.'
  }

  return DEFAULT_MESSAGE
}

export function buildWhatsappUrl(
  pathname: string,
  quoteContext?: WhatsappQuoteContext,
): string {
  const message = getWhatsappMessage(pathname, quoteContext)
  const phone = WHATSAPP_PHONE.replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function isWhatsappHiddenRoute(pathname: string): boolean {
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
