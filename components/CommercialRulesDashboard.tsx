'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import BackofficeTableShell from '@/components/BackofficeTableShell'
import type { CommercialRuleRow } from '@/Lib/commercialRulesTableSchema'
import type { CommercialRulesSnapshot } from '@/Lib/supabaseCommercialRules'

type ActiveFilter = 'active' | 'all'

type RulesApiResponse = {
  rules: CommercialRulesSnapshot
  rows: CommercialRuleRow[]
  editable: boolean
  table: string | null
  fallback: CommercialRulesSnapshot
}

const EMPTY_RULE: Omit<CommercialRuleRow, 'id'> = {
  rule_key: '',
  rule_value: '',
  rule_type: 'text',
  description: '',
  active: true,
}

export default function CommercialRulesDashboard({
  initialData,
}: {
  initialData: RulesApiResponse
}) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState(EMPTY_RULE)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = data.rows
    if (activeFilter === 'active') {
      rows = rows.filter((row) => row.active !== false)
    }
    if (!q) return rows
    return rows.filter(
      (row) =>
        row.rule_key.toLowerCase().includes(q) ||
        (row.description ?? '').toLowerCase().includes(q) ||
        (row.rule_value ?? '').toLowerCase().includes(q),
    )
  }, [data.rows, search, activeFilter])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        _: String(Date.now()),
        active: activeFilter === 'all' ? 'all' : 'true',
      })
      const response = await fetch(`/api/commercial-rules?${params}`, {
        cache: 'no-store',
      })
      const result = (await response.json()) as RulesApiResponse & { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível carregar regras.')
      }
      setData(result)
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Erro ao atualizar regras.',
      )
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  function startNew() {
    setEditingId('new')
    setDraft({ ...EMPTY_RULE })
  }

  function startEdit(row: CommercialRuleRow) {
    setEditingId(row.id)
    setDraft({
      rule_key: row.rule_key,
      rule_value: row.rule_value ?? '',
      rule_type: row.rule_type ?? 'text',
      description: row.description ?? '',
      active: row.active !== false,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({ ...EMPTY_RULE })
  }

  async function saveRow() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/commercial-rules', {
        method: editingId === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId === 'new' ? draft : { id: editingId, ...draft },
        ),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar regra.')
      }
      cancelEdit()
      await refresh()
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Erro ao salvar regra.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function seedDefaults() {
    setSeeding(true)
    setError(null)
    try {
      const response = await fetch('/api/commercial-rules/seed', {
        method: 'POST',
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível criar regras padrão.')
      }
      await refresh()
    } catch (seedError) {
      setError(
        seedError instanceof Error
          ? seedError.message
          : 'Erro ao criar regras padrão.',
      )
    } finally {
      setSeeding(false)
    }
  }

  async function deactivate(row: CommercialRuleRow) {
    if (!window.confirm(`Inativar regra "${row.rule_key}"?`)) return
    const response = await fetch('/api/commercial-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, active: false }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? 'Não foi possível inativar regra.')
      return
    }
    await refresh()
  }

  function renderEditableField(
    value: string,
    onChange: (value: string) => void,
    multiline = false,
  ) {
    const className =
      'w-full min-w-[100px] rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs text-cdl-fg'
    if (multiline) {
      return (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    )
  }

  return (
    <BackofficeTableShell
      title="Regras comerciais"
      subtitle="Parâmetros editáveis · Catering AI (fallback se tabela ausente)"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="rule_key ou descrição"
      activeFilter={activeFilter}
      onActiveFilterChange={setActiveFilter}
      onRefresh={() => void refresh()}
      loading={loading}
      error={error}
      actions={
        <>
          {data.editable && data.rows.length === 0 ? (
            <button
              type="button"
              onClick={() => void seedDefaults()}
              disabled={seeding}
              className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50"
            >
              {seeding ? 'Criando…' : 'Criar regras padrão'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={startNew}
            disabled={!data.editable}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold disabled:opacity-50"
          >
            Nova regra
          </button>
        </>
      }
    >
      {!data.editable ? (
        <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-6 text-sm text-cdl-muted">
          Tabela <code className="text-cdl-fg">commercial_rules</code> não encontrada.
          Execute <code className="text-cdl-fg">scripts/sql/commercial-rules-key-value.sql</code> no
          Supabase. Valores atuais vêm do fallback em código.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-cdl-border bg-cdl-inset/50">
              {['rule_key', 'rule_value', 'rule_type', 'description', 'Ações', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-cdl-muted"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {editingId === 'new' ? (
              <tr className="border-b border-cdl-border bg-[color-mix(in_srgb,var(--brand-accent)_8%,transparent)]">
                <td className="px-3 py-2">
                  {renderEditableField(draft.rule_key, (v) =>
                    setDraft((c) => ({ ...c, rule_key: v })),
                  )}
                </td>
                <td className="px-3 py-2">
                  {renderEditableField(draft.rule_value ?? '', (v) =>
                    setDraft((c) => ({ ...c, rule_value: v })),
                    true,
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={draft.rule_type ?? 'text'}
                    onChange={(e) =>
                      setDraft((c) => ({ ...c, rule_type: e.target.value }))
                    }
                    className="rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
                  >
                    <option value="text">text</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  {renderEditableField(draft.description ?? '', (v) =>
                    setDraft((c) => ({ ...c, description: v })),
                  )}
                </td>
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
                <td className="px-3 py-2 text-xs">Novo</td>
              </tr>
            ) : null}

            {filteredRows.length === 0 && editingId !== 'new' ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-cdl-muted">
                  {loading ? 'Carregando…' : 'Nenhuma regra encontrada.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-cdl-border ${row.active === false ? 'opacity-50' : ''}`}
                >
                  <td className="px-3 py-2 align-top text-sm font-mono text-cdl-fg">
                    {editingId === row.id
                      ? renderEditableField(draft.rule_key, (v) =>
                          setDraft((c) => ({ ...c, rule_key: v })),
                        )
                      : row.rule_key}
                  </td>
                  <td className="px-3 py-2 align-top text-sm text-cdl-fg max-w-xs">
                    {editingId === row.id
                      ? renderEditableField(draft.rule_value ?? '', (v) =>
                          setDraft((c) => ({ ...c, rule_value: v })),
                          true,
                        )
                      : row.rule_value ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-top text-sm">
                    {editingId === row.id ? (
                      <select
                        value={draft.rule_type ?? 'text'}
                        onChange={(e) =>
                          setDraft((c) => ({ ...c, rule_type: e.target.value }))
                        }
                        className="rounded-lg border border-cdl-border bg-cdl-inset px-2 py-1.5 text-xs"
                      >
                        <option value="text">text</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                    ) : (
                      row.rule_type ?? '—'
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-sm text-cdl-muted">
                    {editingId === row.id
                      ? renderEditableField(draft.description ?? '', (v) =>
                          setDraft((c) => ({ ...c, description: v })),
                        )
                      : row.description ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {editingId === row.id ? (
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
                            onClick={() => startEdit(row)}
                            className="rounded-lg border border-cdl-border px-2 py-1 text-xs font-bold"
                          >
                            Editar
                          </button>
                          {row.active !== false ? (
                            <button
                              type="button"
                              onClick={() => void deactivate(row)}
                              className="rounded-lg border border-cdl-action px-2 py-1 text-xs font-bold text-cdl-action"
                            >
                              Inativar
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-cdl-muted">
                    {row.active === false ? 'Inativo' : 'Ativo'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-cdl-muted">
        Fonte do cálculo: {data.rules.source === 'supabase' ? 'Supabase' : 'fallback em código'} ·
        Reserva {data.rules.reservationPercentage}% · Base {data.rules.mileageBaseLocation} ·{' '}
        {data.rules.mileageFreeLimit} mi grátis · ${data.rules.mileageRate}/mi
      </p>
    </BackofficeTableShell>
  )
}
