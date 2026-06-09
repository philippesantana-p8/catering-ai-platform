'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import {
  BackofficeBtnDanger,
  BackofficeBtnPrimary,
  BackofficeBtnSecondary,
  BackofficeCardGrid,
  BackofficeEmptyState,
  BackofficeEntityCard,
  BackofficeField,
  BackofficeFormCard,
  BackofficeInput,
  BackofficeMetaRow,
  BackofficeOpenQuoteBadge,
} from '@/components/backoffice/BackofficeCardPrimitives'
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

async function fetchCustomersFromApi(
  query: string,
  activeFilter: ActiveFilter,
): Promise<{ customers: CustomerRow[]; openQuoteCounts: Record<string, number> }> {
  const params = new URLSearchParams({ _: String(Date.now()) })
  if (query.trim()) params.set('q', query.trim())
  if (activeFilter === 'all') params.set('active', 'all')

  const response = await fetch(`/api/customers?${params.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
  const result = (await response.json()) as {
    data?: CustomerRow[]
    openQuoteCounts?: Record<string, number>
    error?: string
  }
  if (!response.ok) {
    throw new Error(result.error ?? 'Não foi possível buscar clientes.')
  }
  return {
    customers: result.data ?? [],
    openQuoteCounts: result.openQuoteCounts ?? {},
  }
}

function CustomerEditFields({
  draft,
  setDraft,
  abNumber,
}: {
  draft: CustomerForm
  setDraft: React.Dispatch<React.SetStateAction<CustomerForm>>
  abNumber?: string | null
}) {
  return (
    <>
      <BackofficeField label="AB number">
        <BackofficeInput value={abNumber ?? 'auto'} onChange={() => {}} disabled />
      </BackofficeField>
      <BackofficeField label="ab_name">
        <BackofficeInput
          value={draft.ab_name ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, ab_name: v }))}
        />
      </BackofficeField>
      <BackofficeField label="full_name">
        <BackofficeInput
          value={draft.full_name ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, full_name: v }))}
        />
      </BackofficeField>
      <BackofficeField label="contact_name">
        <BackofficeInput
          value={draft.contact_name ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, contact_name: v }))}
        />
      </BackofficeField>
      <BackofficeField label="company_name">
        <BackofficeInput
          value={draft.company_name ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, company_name: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Telefone">
        <BackofficeInput
          value={draft.phone ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, phone: v }))}
        />
      </BackofficeField>
      <BackofficeField label="E-mail">
        <BackofficeInput
          value={draft.email ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, email: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Cidade">
        <BackofficeInput
          value={draft.city ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, city: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Estado">
        <BackofficeInput
          value={draft.state ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, state: v }))}
        />
      </BackofficeField>
      <BackofficeField label="Origem">
        <BackofficeInput
          value={draft.source ?? ''}
          onChange={(v) => setDraft((c) => ({ ...c, source: v }))}
        />
      </BackofficeField>
    </>
  )
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
  const [openQuoteCounts, setOpenQuoteCounts] = useState<Record<string, number>>(
    {},
  )

  const filteredCustomers = useMemo(
    () => filterCustomersBySearch(customers, search),
    [customers, search],
  )

  const refreshCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { customers: next, openQuoteCounts: counts } =
        await fetchCustomersFromApi(search, activeFilter)
      setCustomers(dedupeCustomersList(sortCustomersByRecency(next)))
      setOpenQuoteCounts(counts)
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
    const openCount = openQuoteCounts[customer.id] ?? 0
    if (openCount > 0) {
      setError(
        `Não é possível excluir este cadastro porque existem ${openCount} cotação(ões) em aberto vinculadas a ele.`,
      )
      return
    }

    const label = getCustomerDisplayName(customer)
    if (
      !window.confirm(
        `Excluir cadastro de "${label}"?\n\nO cliente será desativado (soft delete).`,
      )
    ) {
      return
    }

    setError(null)
    const response = await fetch(`/api/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const result = (await response.json()) as {
      error?: string
      openQuoteCount?: number
    }
    if (!response.ok) {
      setError(
        result.error ??
          'Não é possível excluir este cadastro porque existem cotações em aberto vinculadas a ele.',
      )
      return
    }
    setCustomers((current) => current.filter((row) => row.id !== customer.id))
    setOpenQuoteCounts((current) => {
      const next = { ...current }
      delete next[customer.id]
      return next
    })
  }

  function renderCustomerCard(customer: CustomerRow) {
    const isEditing = editingId === customer.id
    const displayName = getCustomerDisplayName(customer)
    const openCount = openQuoteCounts[customer.id] ?? 0
    const location = [customer.city, customer.state].filter(Boolean).join(', ')

    if (isEditing) {
      return (
        <BackofficeFormCard
          key={customer.id}
          title={`Editar cadastro · ${displayName}`}
          actions={
            <>
              <BackofficeBtnPrimary
                onClick={() => void saveRow()}
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </BackofficeBtnPrimary>
              <BackofficeBtnSecondary onClick={cancelEdit}>Cancelar</BackofficeBtnSecondary>
            </>
          }
        >
          <CustomerEditFields
            draft={draft}
            setDraft={setDraft}
            abNumber={customer.ab_number}
          />
        </BackofficeFormCard>
      )
    }

    return (
      <BackofficeEntityCard
        key={customer.id}
        actions={
          <>
            <BackofficeBtnSecondary onClick={() => startEdit(customer)}>
              Editar
            </BackofficeBtnSecondary>
            <Link
              href="/quotes/new"
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Nova cotação
            </Link>
            <Link
              href="/quotes"
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Ver cotações
            </Link>
            <BackofficeBtnDanger onClick={() => void handleDeactivate(customer)}>
              Excluir
            </BackofficeBtnDanger>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <BackofficeOpenQuoteBadge count={openCount} />
        </div>
        <h3 className="text-xl font-bold uppercase leading-snug text-neutral-900">
          {displayName}
        </h3>
        {customer.contact_name ? (
          <BackofficeMetaRow label="Contato" value={customer.contact_name} />
        ) : null}
        <BackofficeMetaRow label="Telefone" value={customer.phone ?? '—'} />
        <BackofficeMetaRow label="E-mail" value={customer.email ?? '—'} />
        <BackofficeMetaRow label="Local" value={location || '—'} />
        <BackofficeMetaRow label="Origem" value={customer.source ?? '—'} />
        {customer.ab_number ? (
          <BackofficeMetaRow label="AB" value={customer.ab_number} />
        ) : null}
      </BackofficeEntityCard>
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
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-800 shadow-sm"
          >
            Cotações
          </Link>
        </>
      }
    >
      <BackofficeCardGrid>
        {editingId === 'new' ? (
          <BackofficeFormCard
            title="Novo cadastro"
            actions={
              <>
                <BackofficeBtnPrimary
                  onClick={() => void saveRow()}
                  disabled={saving}
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </BackofficeBtnPrimary>
                <BackofficeBtnSecondary onClick={cancelEdit}>
                  Cancelar
                </BackofficeBtnSecondary>
              </>
            }
          >
            <CustomerEditFields draft={draft} setDraft={setDraft} />
          </BackofficeFormCard>
        ) : null}

        {filteredCustomers.length === 0 && editingId !== 'new' ? (
          <BackofficeEmptyState loading={loading} message="Nenhum cliente encontrado." />
        ) : (
          filteredCustomers.map((customer) => renderCustomerCard(customer))
        )}
      </BackofficeCardGrid>
    </BackofficeTableShell>
  )
}
