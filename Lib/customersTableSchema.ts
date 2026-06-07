/**
 * Colunas reais de `public.customers` (schema de produção).
 * Não inclui `customer_name` — coluna inexistente na tabela.
 */
export const CUSTOMERS_TABLE_COLUMNS = [
  'phone',
  'email',
  'full_name',
  'contact_name',
  'first_name',
  'last_name',
  'company_name',
  'ab_name',
  'ab_number',
  'company_id',
  'active',
] as const

export type CustomersTableColumn = (typeof CUSTOMERS_TABLE_COLUMNS)[number]

/** Subconjunto seguro para insert/update em `customers`. */
export const CUSTOMERS_INSERT_COLUMNS = CUSTOMERS_TABLE_COLUMNS

export type CustomersInsertColumn = CustomersTableColumn

export type CustomersInsertPayload = Partial<
  Record<CustomersInsertColumn, string | boolean | null>
>

/** Colunas reais usadas por `getCustomerDisplayName` em queries Supabase. */
export const CUSTOMERS_NAME_SOURCE_COLUMNS = [
  'ab_name',
  'full_name',
  'contact_name',
  'first_name',
  'last_name',
  'company_name',
  'email',
] as const

export type CustomersNameSourceColumn =
  (typeof CUSTOMERS_NAME_SOURCE_COLUMNS)[number]

const CUSTOMERS_TABLE_COLUMN_SET = new Set<string>(CUSTOMERS_TABLE_COLUMNS)

export function isCustomersTableColumn(
  key: string,
): key is CustomersTableColumn {
  return CUSTOMERS_TABLE_COLUMN_SET.has(key)
}

type CustomersSelectColumn =
  | 'id'
  | CustomersTableColumn
  | CustomersNameSourceColumn

/** Monta cláusula `.select()` sem colunas inexistentes (ex.: `customer_name`). */
export function buildCustomersSelect(
  include: ReadonlyArray<CustomersSelectColumn> = [
    'id',
    ...CUSTOMERS_NAME_SOURCE_COLUMNS,
  ],
): string {
  const columns = include.filter(
    (col) => col === 'id' || isCustomersTableColumn(col),
  )
  return [...new Set(columns)].join(', ')
}

/** Wizard, autocomplete e vínculo por telefone — id, phone e campos de nome. */
export function buildCustomersListSelect(): string {
  return buildCustomersSelect([
    'id',
    'phone',
    'ab_number',
    ...CUSTOMERS_NAME_SOURCE_COLUMNS,
  ])
}

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
