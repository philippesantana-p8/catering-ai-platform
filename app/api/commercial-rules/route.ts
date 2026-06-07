import {
  CANCELLATION_POLICY_SUMMARY,
  IMPORTANT_RULES,
  RESERVATION_PAYMENT_TEXT,
} from '@/Lib/cdlCommercialRules'
import {
  fetchSupabaseCommercialRules,
  getFallbackCommercialRules,
  type CommercialRulesSnapshot,
} from '@/Lib/supabaseCommercialRules'
import type { CommercialRuleRow } from '@/Lib/commercialRulesTableSchema'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RULE_TABLE = 'commercial_rules'

function buildTextRules() {
  return {
    reservationPayment: RESERVATION_PAYMENT_TEXT,
    cancellation: [...CANCELLATION_POLICY_SUMMARY],
    minimumOrder: [...IMPORTANT_RULES.minimumOrder],
    mileage: [...IMPORTANT_RULES.mileage],
    reservation: [...IMPORTANT_RULES.reservation],
    foodPolicy: [...IMPORTANT_RULES.foodPolicy],
    latePayment: [...IMPORTANT_RULES.latePayment],
    decemberJanuary: [...IMPORTANT_RULES.decemberJanuary],
    quoteValidityDays: 30,
  }
}

async function tableExists(): Promise<boolean> {
  const { error } = await supabase.from(RULE_TABLE).select('id').limit(1)
  return !error
}

async function fetchRuleRows(activeOnly: boolean): Promise<CommercialRuleRow[]> {
  let query = supabase
    .from(RULE_TABLE)
    .select('id, rule_key, rule_value, rule_type, description, active, updated_at')
    .order('rule_key', { ascending: true })

  if (activeOnly) {
    query = query.eq('active', true)
  }

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as CommercialRuleRow[]
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const activeParam = url.searchParams.get('active')
  const activeOnly = activeParam !== 'all'

  const exists = await tableExists()
  const rules: CommercialRulesSnapshot = await fetchSupabaseCommercialRules()
  const rows = exists ? await fetchRuleRows(activeOnly) : []

  return Response.json(
    {
      rules,
      rows,
      editable: exists,
      table: exists ? RULE_TABLE : null,
      textRules: buildTextRules(),
      fallback: getFallbackCommercialRules(),
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
  )
}

export async function POST(request: Request) {
  const exists = await tableExists()
  if (!exists) {
    return Response.json(
      { error: 'Tabela commercial_rules não encontrada. Execute a migration SQL.' },
      { status: 409 },
    )
  }

  let body: Partial<CommercialRuleRow>
  try {
    body = (await request.json()) as Partial<CommercialRuleRow>
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const ruleKey = body.rule_key?.trim()
  if (!ruleKey) {
    return Response.json({ error: 'rule_key é obrigatório.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from(RULE_TABLE)
    .insert({
      rule_key: ruleKey,
      rule_value: body.rule_value ?? '',
      rule_type: body.rule_type ?? 'text',
      description: body.description ?? null,
      active: body.active !== false,
      updated_at: new Date().toISOString(),
    })
    .select('id, rule_key, rule_value, rule_type, description, active, updated_at')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function PATCH(request: Request) {
  const exists = await tableExists()
  if (!exists) {
    return Response.json(
      { error: 'Tabela commercial_rules não encontrada.' },
      { status: 409 },
    )
  }

  let body: Partial<CommercialRuleRow> & { id?: string }
  try {
    body = (await request.json()) as Partial<CommercialRuleRow> & { id?: string }
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  if (!body.id?.trim()) {
    return Response.json({ error: 'id é obrigatório.' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.rule_value !== undefined) updatePayload.rule_value = body.rule_value
  if (body.rule_type !== undefined) updatePayload.rule_type = body.rule_type
  if (body.description !== undefined) updatePayload.description = body.description
  if (body.rule_key !== undefined) updatePayload.rule_key = body.rule_key
  if (body.active !== undefined) updatePayload.active = body.active

  const { data, error } = await supabase
    .from(RULE_TABLE)
    .update(updatePayload)
    .eq('id', body.id)
    .select('id, rule_key, rule_value, rule_type, description, active, updated_at')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const rules: CommercialRulesSnapshot = await fetchSupabaseCommercialRules()
  return Response.json({ data, rules })
}
