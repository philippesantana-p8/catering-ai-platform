import { DEFAULT_COMMERCIAL_RULE_SEEDS } from '@/Lib/defaultCommercialRulesSeed'
import { fetchSupabaseCommercialRules } from '@/Lib/supabaseCommercialRules'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RULE_TABLE = 'commercial_rules'

export async function POST() {
  const { error: probeError } = await supabase.from(RULE_TABLE).select('id').limit(1)

  if (probeError) {
    return Response.json(
      {
        error:
          'Tabela commercial_rules não encontrada. Execute scripts/sql/commercial-rules-key-value.sql.',
      },
      { status: 409 },
    )
  }

  const { data: existingRows, error: existingError } = await supabase
    .from(RULE_TABLE)
    .select('rule_key')

  if (existingError) {
    return Response.json({ error: existingError.message }, { status: 500 })
  }

  const existingKeys = new Set(
    (existingRows ?? []).map((row) => String((row as { rule_key?: string }).rule_key ?? '')),
  )

  const now = new Date().toISOString()
  const rows = DEFAULT_COMMERCIAL_RULE_SEEDS.filter(
    (seed) => !existingKeys.has(seed.rule_key),
  ).map((seed) => ({
    ...seed,
    updated_at: now,
    created_at: now,
  }))

  if (rows.length > 0) {
    const { error } = await supabase.from(RULE_TABLE).insert(rows)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  }

  const { data: inserted } = await supabase
    .from(RULE_TABLE)
    .select('id, rule_key, rule_value, rule_type, description, active, updated_at')
    .order('rule_key', { ascending: true })

  const rules = await fetchSupabaseCommercialRules()

  return Response.json({
    data: inserted ?? [],
    rules,
    seeded: rows.length,
  })
}
