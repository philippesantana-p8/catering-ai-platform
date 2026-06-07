'use client'

import type { ReactNode } from 'react'
import AppMainNav from '@/components/AppMainNav'

type ActiveFilter = 'active' | 'all'

export default function BackofficeTableShell({
  title,
  subtitle,
  actions,
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  activeFilter,
  onActiveFilterChange,
  showActiveFilter = true,
  onRefresh,
  loading,
  error,
  children,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  activeFilter?: ActiveFilter
  onActiveFilterChange?: (value: ActiveFilter) => void
  showActiveFilter?: boolean
  onRefresh: () => void
  loading?: boolean
  error?: string | null
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <AppMainNav />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-cdl-title sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-cdl-muted">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>

        <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-2">
              <span className="cdl-eyebrow">Buscar</span>
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
              />
            </label>
            {showActiveFilter && onActiveFilterChange ? (
              <label className="flex flex-col gap-2 sm:w-48">
                <span className="cdl-eyebrow">Status</span>
                <select
                  value={activeFilter}
                  onChange={(e) =>
                    onActiveFilterChange(e.target.value as ActiveFilter)
                  }
                  className="rounded-xl border border-cdl-border bg-cdl-inset px-4 py-3 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border"
                >
                  <option value="active">Ativos</option>
                  <option value="all">Todos</option>
                </select>
              </label>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg disabled:opacity-50"
            >
              {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-cdl-action">{error}</p> : null}
        </div>

        {children}
      </div>
    </main>
  )
}
