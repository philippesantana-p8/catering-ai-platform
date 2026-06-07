import { getCustomerDisplayName } from './getCustomerDisplayName'
import { normalizePhone } from './normalizePhone'

export type CustomerSearchRecord = {
  id?: string
  ab_name?: string | null
  full_name?: string | null
  contact_name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
  ab_number?: string | null
  updated_at?: string | null
  created_at?: string | null
}

function fieldMatchesQuery(field: string | null | undefined, query: string, queryDigits: string) {
  const text = field == null ? '' : String(field).trim().toLowerCase()
  if (!text) return false
  if (text.includes(query)) return true

  if (queryDigits.length < 3) return false

  const fieldDigits = normalizePhone(text)
  if (!fieldDigits) return false
  if (fieldDigits.includes(queryDigits) || queryDigits.includes(fieldDigits)) {
    return true
  }

  if (queryDigits.length >= 10 && fieldDigits.length >= 10) {
    return queryDigits.slice(-10) === fieldDigits.slice(-10)
  }

  return false
}

export function customerMatchesSearch(
  customer: CustomerSearchRecord,
  rawQuery: string,
): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true

  const queryDigits = normalizePhone(query)
  const displayName = getCustomerDisplayName(customer, { emptyLabel: '' })
    .trim()
    .toLowerCase()

  if (displayName && displayName.includes(query)) return true

  const fields = [
    customer.ab_name,
    customer.full_name,
    customer.contact_name,
    customer.company_name,
    customer.email,
    customer.phone,
    customer.ab_number,
  ]

  return fields.some((field) => fieldMatchesQuery(field, query, queryDigits))
}

export function filterCustomersBySearch<T extends CustomerSearchRecord>(
  customers: T[],
  rawQuery: string,
): T[] {
  const query = rawQuery.trim()
  if (!query) return customers
  return customers.filter((customer) => customerMatchesSearch(customer, query))
}

export function sortCustomersByRecency<T extends CustomerSearchRecord>(
  customers: T[],
): T[] {
  return [...customers].sort((a, b) => {
    const aTime = new Date(a.updated_at ?? a.created_at ?? 0).getTime()
    const bTime = new Date(b.updated_at ?? b.created_at ?? 0).getTime()
    return bTime - aTime
  })
}

export function mergeCustomerIntoList<T extends CustomerSearchRecord & { id: string }>(
  current: T[],
  incoming: T,
): T[] {
  const without = current.filter((row) => row.id !== incoming.id)
  return sortCustomersByRecency([incoming, ...without])
}
