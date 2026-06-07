/** Shape mínima para exibir nome de cliente (várias colunas possíveis no schema). */
export type CustomerNameSource = {
  full_name?: string | null
  contact_name?: string | null
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  ab_name?: string | null
  /** Pode existir em payloads legados ou views; não é coluna de `customers`. */
  name?: string | null
  email?: string | null
}

const DEFAULT_EMPTY_LABEL = 'Cliente não informado'

export function getCustomerDisplayName(
  customer: CustomerNameSource | null | undefined,
  options?: { emptyLabel?: string },
): string {
  const emptyLabel = options?.emptyLabel ?? DEFAULT_EMPTY_LABEL
  if (!customer) return emptyLabel

  const firstLast = [customer.first_name, customer.last_name]
    .filter((part) => part && String(part).trim())
    .join(' ')
    .trim()

  const candidates = [
    customer.full_name,
    customer.contact_name,
    customer.name,
    customer.company_name,
    firstLast || null,
    customer.ab_name,
    customer.email,
  ]

  for (const value of candidates) {
    const text = value == null ? '' : String(value).trim()
    if (text) return text
  }

  return emptyLabel
}
