/**
 * Colunas seguras para insert em `public.customers`.
 * Ajuste conforme schema real — não assumir `name` sem fallback.
 */
export const CUSTOMERS_INSERT_COLUMNS = [
  'phone',
  'email',
  'full_name',
  'customer_name',
  'contact_name',
  'first_name',
  'last_name',
  'company_name',
  'ab_name',
  'company_id',
  'active',
] as const

export type CustomersInsertColumn = (typeof CUSTOMERS_INSERT_COLUMNS)[number]

export type CustomersInsertPayload = Partial<
  Record<CustomersInsertColumn, string | boolean | null>
>

export function pickCustomersInsertPayload(
  row: CustomersInsertPayload,
): Record<string, string | boolean | null> {
  const payload: Record<string, string | boolean | null> = {}

  for (const key of CUSTOMERS_INSERT_COLUMNS) {
    if (!(key in row)) continue
    const value = row[key]
    if (value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    payload[key] = value
  }

  return payload
}
