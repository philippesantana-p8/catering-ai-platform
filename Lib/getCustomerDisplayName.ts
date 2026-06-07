/**
 * Shape mínima para exibir nome de cliente (colunas reais de `customers`).
 * Mesma ordem de `public.vw_customer_display.customer_display_name` (SQL).
 * @see scripts/sql/vw-customer-display.sql
 */
export type CustomerNameSource = {
  ab_name?: string | null
  full_name?: string | null
  contact_name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
}

export const CUSTOMER_DISPLAY_NAME_EMPTY = 'Cliente sem nome'

export function getCustomerDisplayName(
  customer: CustomerNameSource | null | undefined,
  options?: { emptyLabel?: string },
): string {
  const emptyLabel = options?.emptyLabel ?? CUSTOMER_DISPLAY_NAME_EMPTY
  if (!customer) return emptyLabel

  const candidates = [
    customer.ab_name,
    customer.full_name,
    customer.contact_name,
    customer.company_name,
    customer.email,
    customer.phone,
  ]

  for (const value of candidates) {
    const text = value == null ? '' : String(value).trim()
    if (text) return text
  }

  return emptyLabel
}

/** Resolve nome a partir de payload de cotação/view (sem referenciar colunas inexistentes). */
export function getCustomerDisplayNameFromQuote(
  quote: CustomerNameSource | null | undefined,
  options?: { emptyLabel?: string },
): string {
  return getCustomerDisplayName(quote, options)
}
