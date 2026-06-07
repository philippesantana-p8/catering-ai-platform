import { getCdlCompanyId } from './cdlCompany'
import {
  buildCustomersListSelect,
  pickCustomersInsertPayload,
  type CustomersInsertPayload,
} from './customersTableSchema'
import {
  CUSTOMER_DISPLAY_NAME_EMPTY,
  getCustomerDisplayName,
} from './getCustomerDisplayName'
import { getNextAbNumber } from './getNextDocumentNumber'
import { isUsablePhone, normalizePhone } from './normalizePhone'
import { supabase } from './supabase'

export type CustomerRecord = {
  id: string
  phone?: string | null
  email?: string | null
  full_name?: string | null
  contact_name?: string | null
  company_name?: string | null
  ab_name?: string | null
  ab_number?: string | null
  active?: boolean | null
  company_id?: string | null
}

export type FindOrCreateCustomerInput = {
  phone: string
  name?: string | null
  email?: string | null
}

export type FindOrCreateCustomerResult = {
  customer: CustomerRecord | null
  created: boolean
  error: { message: string } | null
}

function resolveAbName(input: FindOrCreateCustomerInput): string {
  const name = input.name?.trim()
  if (name) return name
  return input.phone.trim()
}

async function buildInsertRow(
  input: FindOrCreateCustomerInput,
  companyId: string,
): Promise<CustomersInsertPayload> {
  const { number: abNumber, error: numberError } =
    await getNextAbNumber(companyId)

  if (numberError || !abNumber) {
    console.warn(
      '[CDL Customer] ab_number indisponível; criando cliente sem AB Number:',
      numberError?.message ?? 'RPC retornou vazio',
    )
  }

  const name = input.name?.trim() || null
  const email = input.email?.trim() || null
  const phone = input.phone.trim()
  const abName = resolveAbName(input)

  const row: CustomersInsertPayload = {
    phone,
    email,
    company_id: companyId,
    active: true,
    ab_name: abName,
    ...(abNumber ? { ab_number: abNumber } : {}),
  }

  if (name) {
    row.contact_name = name
    row.full_name = name
  }

  return row
}

function phonesMatch(
  stored: string | null | undefined,
  normalizedTarget: string,
): boolean {
  if (!stored || !normalizedTarget) return false
  const normalizedStored = normalizePhone(stored)
  if (!normalizedStored) return false
  if (normalizedStored === normalizedTarget) return true
  if (normalizedStored.length >= 10 && normalizedTarget.length >= 10) {
    return (
      normalizedStored.slice(-10) === normalizedTarget.slice(-10)
    )
  }
  return false
}

export async function findOrCreateCustomerByPhone(
  input: FindOrCreateCustomerInput,
): Promise<FindOrCreateCustomerResult> {
  const normalized = normalizePhone(input.phone)
  if (!isUsablePhone(input.phone)) {
    return {
      customer: null,
      created: false,
      error: { message: 'Telefone inválido (mínimo 10 dígitos).' },
    }
  }

  const companyId = getCdlCompanyId()
  if (!companyId?.trim()) {
    return {
      customer: null,
      created: false,
      error: { message: 'company_id não configurado.' },
    }
  }

  const { data: rows, error: searchError } = await supabase
    .from('customers')
    .select(buildCustomersListSelect())
    .eq('company_id', companyId)

  if (searchError) {
    return {
      customer: null,
      created: false,
      error: { message: searchError.message },
    }
  }

  const existing = ((rows ?? []) as unknown as CustomerRecord[]).find((row) =>
    phonesMatch(row.phone, normalized),
  )

  if (existing) {
    return { customer: existing, created: false, error: null }
  }

  const insertRow = pickCustomersInsertPayload(
    await buildInsertRow(input, companyId),
  )

  const { data: created, error: insertError } = await supabase
    .from('customers')
    .insert(insertRow)
    .select(buildCustomersListSelect())
    .single()

  if (insertError || !created) {
    return {
      customer: null,
      created: false,
      error: {
        message:
          insertError?.message ??
          'Não foi possível criar cliente automaticamente.',
      },
    }
  }

  const customer = created as unknown as CustomerRecord
  if (
    getCustomerDisplayName(customer) === CUSTOMER_DISPLAY_NAME_EMPTY &&
    insertRow.ab_name
  ) {
    customer.ab_name = insertRow.ab_name as string
  }

  return { customer, created: true, error: null }
}
