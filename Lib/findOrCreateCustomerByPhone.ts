import { getCdlCompanyId } from './cdlCompany'
import {
  buildCustomersListSelect,
  pickCustomersInsertPayload,
  type CustomersInsertPayload,
} from './customersTableSchema'
import { getCustomerDisplayName } from './getCustomerDisplayName'
import { getNextAbNumber } from './getNextDocumentNumber'
import { isUsablePhone, normalizePhone } from './normalizePhone'
import { supabase } from './supabase'

export type CustomerRecord = {
  id: string
  phone?: string | null
  email?: string | null
  full_name?: string | null
  contact_name?: string | null
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  ab_name?: string | null
  ab_number?: string | null
  name?: string | null
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

function resolveInsertName(input: FindOrCreateCustomerInput): string | null {
  const name = input.name?.trim()
  return name || null
}

function resolveAbName(
  input: FindOrCreateCustomerInput,
  abNumber: string,
): string {
  const name = resolveInsertName(input)
  if (name) return name
  const phone = input.phone.trim()
  if (phone) return phone
  return `Cliente ${abNumber}`
}

async function buildInsertRow(
  input: FindOrCreateCustomerInput,
  companyId: string,
): Promise<
  | { row: CustomersInsertPayload; error: null }
  | { row: null; error: { message: string } }
> {
  const { number: abNumber, error: numberError } =
    await getNextAbNumber(companyId)

  if (numberError || !abNumber) {
    return {
      row: null,
      error: {
        message:
          numberError?.message ??
          'Não foi possível gerar ab_number via get_next_document_number.',
      },
    }
  }

  const name = resolveInsertName(input)
  const email = input.email?.trim() || null
  const phone = input.phone.trim()
  const abName = resolveAbName(input, abNumber)

  const row: CustomersInsertPayload = {
    phone,
    email,
    company_id: companyId,
    active: true,
    ab_number: abNumber,
    ab_name: abName,
  }

  if (name) {
    row.contact_name = name
    row.full_name = name
  }

  return { row, error: null }
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

  const built = await buildInsertRow(input, companyId)
  if (built.error || !built.row) {
    return {
      customer: null,
      created: false,
      error: { message: built.error?.message ?? 'Falha ao montar cliente.' },
    }
  }

  const insertRow = pickCustomersInsertPayload(built.row)

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
  if (!getCustomerDisplayName(customer) && built.row.ab_name) {
    customer.ab_name = built.row.ab_name as string
  }

  return { customer, created: true, error: null }
}
