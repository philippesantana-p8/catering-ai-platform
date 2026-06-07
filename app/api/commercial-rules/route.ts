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
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RULE_TABLE_CANDIDATES = ['commercial_rules', 'pricing_rules'] as const

type RuleUpdateBody = Partial<{
  mileage_base_location: string
  mileage_free_limit: number
  mileage_rate: number
  reservation_percentage: number
  sides_price_per_person: number
  min_order_weekday: number
  min_order_weekend: number
  min_order_dec_jan: number
  holiday_surcharge_percent: number
  holiday_min_order: number
  child_free_age_max: number
  child_half_age_max: number
}>

async function findRulesTable(): Promise<string | null> {
  for (const table of RULE_TABLE_CANDIDATES) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (!error) return table
  }
  return null
}

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

export async function GET() {
  const rules = await fetchSupabaseCommercialRules()
  const table = await findRulesTable()

  return Response.json(
    {
      rules,
      editable: table != null,
      table,
      textRules: buildTextRules(),
      fallback: getFallbackCommercialRules(),
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
  )
}

export async function PATCH(request: Request) {
  const table = await findRulesTable()
  if (!table) {
    return Response.json(
      {
        error:
          'Nenhuma tabela commercial_rules ou pricing_rules encontrada. Usando fallback em cdlCommercialRules.ts.',
        editable: false,
      },
      { status: 409 },
    )
  }

  let body: RuleUpdateBody
  try {
    body = (await request.json()) as RuleUpdateBody
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const { data: existingRows, error: readError } = await supabase
    .from(table)
    .select('*')
    .limit(50)

  if (readError) {
    return Response.json({ error: readError.message }, { status: 500 })
  }

  const rows = existingRows ?? []
  const first = rows[0] as Record<string, unknown> | undefined

  if (first && ('rule_key' in first || 'key' in first)) {
    for (const [field, value] of Object.entries(body)) {
      if (value === undefined) continue
      const ruleKey = field
      const existing = rows.find(
        (row) =>
          String(
            (row as Record<string, unknown>).rule_key ??
              (row as Record<string, unknown>).key ??
              '',
          ) === ruleKey,
      ) as Record<string, unknown> | undefined

      const writeResult = existing?.id
        ? await supabase
            .from(table)
            .update({
              numeric_value: typeof value === 'number' ? value : null,
              text_value: typeof value === 'string' ? value : null,
              value,
            })
            .eq('id', existing.id)
        : await supabase.from(table).insert({
            rule_key: ruleKey,
            numeric_value: typeof value === 'number' ? value : null,
            text_value: typeof value === 'string' ? value : null,
            value,
          })

      if (writeResult.error) {
        return Response.json(
          { error: writeResult.error.message },
          { status: 500 },
        )
      }
    }
  } else if (first) {
    const { error } = await supabase
      .from(table)
      .update(body)
      .eq('id', first.id)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase.from(table).insert(body)
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  }

  const rules: CommercialRulesSnapshot = await fetchSupabaseCommercialRules()

  return Response.json({ rules, editable: true, table })
}
