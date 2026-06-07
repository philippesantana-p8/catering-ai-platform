'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import { getCustomerDisplayName } from '@/Lib/getCustomerDisplayName'
import type { CustomersUpdatePayload } from '@/Lib/customersTableSchema'
import {
  dedupeCustomersList,
  filterCustomersBySearch,
  sortCustomersByRecency,
  type CustomerSearchRecord,
} from '@/Lib/searchCustomers'

type CustomerRow = CustomerSearchRecord & { id: string }
type ActiveFilter = 'active' | 'all'

type CustomerForm = CustomersUpdatePayload & {
  phone: string
  ab_name?: string | null
}

const EMPTY_FORM: CustomerForm = {
  phone: '',
  ab_name: '',
  full_name: '',
  contact_name: '',
  company_name: '',
  email: '',
  city: '',
  state: '',
  source: '',
  active: true,
}

const COLUMNS: Array<{ key: keyof CustomerForm; label: string }> = [
  { key: 'ab_number' as keyof CustomerForm, label: 'AB' },
  { key: 'ab_name', label: 'ab_name' },
  { key: 'full_name', label: 'full_name' },
  { key: 'contact_name', label: 'contact_name' },
  { key: 'company_name', label: 'company_name' },
  { key: 'phone', label: 'phone' },
  { key: 'email', label: 'email' },
  { key: 'city', label: 'city' },
  { key: 'state', label: 'state' },
  { key: 'source', label: 'source' },
]

async function fetchCustomersFromApi(
  query: string,
  activeFilter: ActiveFilter,
): Promise<CustomerRow[]> {
  const params = new URLSearchParams({ _: String(Date.now()) })
  if (query.trim()) params.set('q', query.trim())
  if (activeFilter === 'all') params.set('active', 'all')

  const response = await fetch(`/api/customers?${params.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
  const result = (await response.json()) as {
    data?: CustomerRow[]
    error?: string
  }
  if (!response.ok) {
    throw new Error(result.error ?? 'Não foi possível buscar clientes.')
  }
  return result.data ?? []
}

export default function CustomersDashboard({
  initialCustomers,
}: {
  initialCustomers: CustomerRow[]
}) {
  const [customers, setCustomers] = useState<CustomerRow[]>(() =>
    dedupeCustomersList(sortCustomersByRecency(initialCustomers)),
  )
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<CustomerForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filteredCustomers = useMemo(
    () => filterCustomersBySearch(customers, search),
    [customers, search],
  )

  const refreshCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchCustomersFromApi(search, activeFilter)
      setCustomers(dedupeCustomersList(sortCustomersByRecency(next)))
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Erro ao atualizar clientes.',
      )
    } finally {
      setLoading(false)
    }
  }, [search, activeFilter])

  useEffect(() => {
    void refreshCustomers()
  }, [activeFilter])

  function startNew() {
    setEditingId('new')
    setDraft({ ...EMPTY_FORM })
  }

  function startEdit(customer: CustomerRow) {
    setEditingId(customer.id)
    setDraft({
      phone: customer.phone ?? '',
      ab_name: customer.ab_name ?? '',
      full_name: customer.full_name ?? '',
      contact_name: customer.contact_name ?? '',
      company_name: customer.company_name ?? '',
      email: customer.email ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      source: customer.source ?? '',
      active: true,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({ ...EMPTY_FORM })
  }

  async function saveRow() {
    setSaving(true)
    setError(null)
    try {
      const url =
        editingId && editingId !== 'new'
          ? `/api/customers/${editingId}`
          : '/api/customers'
      const method = editingId && editingId !== 'new' ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar cadastro.')
      }
      cancelEdit()
      await refreshCustomers()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Erro ao salvar cadastro.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(customer: CustomerRow) {
    const label = getCustomerDisplayName(customer)
    if (
      !window.confirm(
        `Excluir cadastro de "${label}"?\n\nO cliente será desativado (soft delete).`,
      )
    ) {
      return
    }
    const response = await fetch(`/api/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? 'Não foi possível excluir cadastro.')
      return
    }
    setCustomers((current) => current.filter((row) => row.id !== customer.id))
  }

  function renderDisplay(customer: CustomerRow, key: string) {
    if (key === 'ab_number') return customer.ab_number ?? '—'
    const value = customer[key as keyof CustomerRow]
    return String(value ?? '—')
  }

  function renderEditField(key: keyof CustomerForm) {
    if (key === ('ab_number' as keyof CustomerForm)) return null
    return (
      <input
        type="text"
        value={String(draft[key] ?? '')}
        onChange={(e) =>
          setDraft((c) => ({ ...c, [key]: e.target.value }))
        }
        className="w-full min-w-[80px] rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
      />
    )
  }

  return (
    <BackofficeTableShell
      title="Cadastros"
      subtitle="Clientes e contatos da operação · Catering AI"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Nome, telefone, e-mail ou AB number"
      activeFilter={activeFilter}
      onActiveFilterChange={setActiveFilter}
      onRefresh={() => void refreshCustomers()}
      loading={loading}
      error={error}
      actions={
        <>
          <button
            type="button"
            onClick={startNew}
            className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
          >
            Novo cadastro
          </button>
          <Link
            href="/quotes/new"
            className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
          >
            Nova cotação
          </Link>
          <Link
            href="/quotes"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg"
          >
            Cotações
          </Link>
        </>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
        <table className="w-full min-w-[1200px] border-collapse text-left">
          <thead>
            <tr className="border-b border-cdl-border bg-cdl-inset/50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted">
                Nome exibição
              </th>
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {editingId === 'new' ? (
              <tr className="border-b border-cdl-border bg-[color-mix(in_srgb,var(--brand-accent)_8%,transparent)]">
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    {col.key === ('ab_number' as keyof CustomerForm) ? (
                      <span className="text-xs text-cdl-muted">auto</span>
                    ) : (
                      renderEditField(col.key)
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-xs text-cdl-muted">—</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void saveRow()}
                      disabled={saving}
                      className="rounded-lg bg-[var(--brand-primary)] px-2 py-1 text-xs font-bold text-white"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}

            {filteredCustomers.length === 0 && editingId !== 'new' ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 2}
                  className="px-4 py-10 text-center text-cdl-muted"
                >
                  {loading ? 'Carregando…' : 'Nenhum cliente encontrado.'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-cdl-border">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2 align-top text-sm">
                      {editingId === customer.id
                        ? col.key === ('ab_number' as keyof CustomerForm)
                          ? (customer.ab_number ?? '—')
                          : renderEditField(col.key)
                        : renderDisplay(customer, col.key)}
                    </td>
                  ))}
                  <td className="px-3 py-2 align-top text-sm font-semibold text-cdl-fg">
                    {getCustomerDisplayName(customer)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {editingId === customer.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void saveRow()}
                            disabled={saving}
                            className="rounded-lg bg-[var(--brand-primary)] px-2 py-1 text-xs font-bold text-white"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(customer)}
                            className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(customer)}
                            className="rounded-lg border border-cdl-action px-2 py-1 text-xs font-bold text-cdl-action"
                          >
                            Inativar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </BackofficeTableShell>
  )
}
