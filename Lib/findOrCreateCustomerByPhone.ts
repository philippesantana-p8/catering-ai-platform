import { getCdlCompanyId } from './cdlCompany'
import { getCustomerDisplayName } from './getCustomerDisplayName'
import {
  buildCustomersListSelect,
  pickCustomersInsertPayload,
  type CustomersInsertPayload,
} from './customersTableSchema'
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

function buildInsertRow(
  input: FindOrCreateCustomerInput,
  companyId: string,
): CustomersInsertPayload {
  const name = resolveInsertName(input)
  const email = input.email?.trim() || null
  const phone = input.phone.trim()

  const row: CustomersInsertPayload = {
    phone,
    email,
    company_id: companyId,
    active: true,
  }

  if (name) {
    row.contact_name = name
    row.full_name = name
    row.ab_name = name
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
  // US: match last 10 digits when country code differs
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

  const existing = ((rows ?? []) as CustomerRecord[]).find((row) =>
    phonesMatch(row.phone, normalized),
  )

  if (existing) {
    return { customer: existing, created: false, error: null }
  }

  const insertRow = pickCustomersInsertPayload(
    buildInsertRow(input, companyId),
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

  const customer = created as CustomerRecord
  if (!getCustomerDisplayName(customer) && resolveInsertName(input)) {
    // best-effort — display name resolved client-side from draft
  }

  return { customer, created: true, error: null }
}
