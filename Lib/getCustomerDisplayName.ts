/** Shape mínima para exibir nome de cliente (várias colunas possíveis no schema). */
export type CustomerNameSource = {
  ab_name?: string | null
  full_name?: string | null
  contact_name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
  /** Legado — não é coluna de `customers`. */
  first_name?: string | null
  last_name?: string | null
  name?: string | null
}

const DEFAULT_EMPTY_LABEL = 'Cliente não informado'

export function getCustomerDisplayName(
  customer: CustomerNameSource | null | undefined,
  options?: { emptyLabel?: string },
): string {
  const emptyLabel = options?.emptyLabel ?? DEFAULT_EMPTY_LABEL
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
