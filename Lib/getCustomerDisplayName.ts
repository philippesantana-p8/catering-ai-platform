/** Shape mínima para exibir nome de cliente (várias colunas possíveis no schema). */
export type CustomerNameSource = {
  full_name?: string | null
  customer_name?: string | null
  contact_name?: string | null
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  ab_name?: string | null
  name?: string | null
  email?: string | null
}

export function getCustomerDisplayName(
  customer: CustomerNameSource | null | undefined,
): string {
  if (!customer) return 'Cliente não informado'

  const firstLast = [customer.first_name, customer.last_name]
    .filter((part) => part && String(part).trim())
    .join(' ')
    .trim()

  const candidates = [
    customer.full_name,
    customer.customer_name,
    customer.contact_name,
    firstLast || null,
    customer.company_name,
    customer.ab_name,
    customer.name,
    customer.email,
  ]

  for (const value of candidates) {
    const text = value == null ? '' : String(value).trim()
    if (text) return text
  }

  return 'Cliente não informado'
}
