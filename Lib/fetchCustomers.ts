import { getCdlCompanyId } from './cdlCompany'
import { buildCustomersListSelect } from './customersTableSchema'
import { sortCustomersByRecency, type CustomerSearchRecord } from './searchCustomers'
import { supabase } from './supabase'

export type CustomerListItem = CustomerSearchRecord & { id: string }

export async function fetchActiveCustomers() {
  const companyId = getCdlCompanyId()
  if (!companyId?.trim()) {
    return {
      data: [] as CustomerListItem[],
      error: { message: 'company_id não configurado.' },
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .select(buildCustomersListSelect())
    .eq('company_id', companyId)
    .eq('active', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })

  if (error) {
    return { data: null as CustomerListItem[] | null, error }
  }

  return {
    data: sortCustomersByRecency((data ?? []) as unknown as CustomerListItem[]),
    error: null,
  }
}
