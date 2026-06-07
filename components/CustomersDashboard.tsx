'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCustomerDisplayName } from '@/Lib/getCustomerDisplayName'
import {
  filterCustomersBySearch,
  sortCustomersByRecency,
  type CustomerSearchRecord,
} from '@/Lib/searchCustomers'

type CustomerRow = CustomerSearchRecord & { id: string }

async function fetchCustomersFromApi(query: string): Promise<CustomerRow[]> {
  const params = new URLSearchParams({ _: String(Date.now()) })
  if (query.trim()) params.set('q', query.trim())

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
    sortCustomersByRecency(initialCustomers),
  )
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredCustomers = useMemo(
    () => filterCustomersBySearch(customers, search),
    [customers, search],
  )

  const refreshCustomers = useCallback(async (query = search) => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchCustomersFromApi(query)
      setCustomers(sortCustomersByRecency(next))
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Erro ao atualizar clientes.',
      )
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    setCustomers(sortCustomersByRecency(initialCustomers))
  }, [initialCustomers])

  async function handleDeactivate(customer: CustomerRow) {
    const label = getCustomerDisplayName(customer)
    const confirmed = window.confirm(
      `Excluir cadastro de "${label}"?\n\nO cliente será desativado (soft delete) e não aparecerá em novas cotações.`,
    )
    if (!confirmed) return

    setDeletingId(customer.id)
    setError(null)

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível excluir cadastro.')
      }
      setCustomers((current) => current.filter((row) => row.id !== customer.id))
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Erro ao excluir cadastro.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-cdl-title sm:text-3xl">
              Clientes
            </h1>
            <p className="mt-1 text-sm text-cdl-muted">
              Address Book · cadastros ativos da empresa
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/quotes/new"
              className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
            >
              Nova cotação
            </Link>
            <button
              type="button"
              onClick={() => void refreshCustomers()}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg disabled:opacity-50"
            >
              {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-4 sm:p-6">
          <label className="flex flex-col gap-2">
            <span className="cdl-eyebrow">Buscar cliente</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => void refreshCustomers(search)}
              placeholder="Nome, telefone, e-mail ou AB number"
              className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
            />
          </label>
          {error ? (
            <p className="mt-3 text-sm text-cdl-action">{error}</p>
          ) : null}
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-8 text-center text-cdl-muted">
            {loading ? 'Buscando clientes…' : 'Nenhum cliente encontrado.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <article
                key={customer.id}
                className="flex flex-col gap-3 rounded-2xl border border-cdl-border bg-cdl-surface p-5 shadow-cdl"
              >
                <div>
                  <h2 className="text-lg font-bold text-cdl-fg">
                    {getCustomerDisplayName(customer)}
                  </h2>
                  {customer.ab_number ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                      {customer.ab_number}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1 text-sm text-cdl-muted">
                  {customer.phone ? <p>{customer.phone}</p> : null}
                  {customer.email ? <p>{customer.email}</p> : null}
                  {customer.company_name ? <p>{customer.company_name}</p> : null}
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => void handleDeactivate(customer)}
                    disabled={deletingId === customer.id}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-cdl-action px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-action disabled:opacity-50"
                  >
                    {deletingId === customer.id
                      ? 'Excluindo…'
                      : 'Excluir cadastro'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
