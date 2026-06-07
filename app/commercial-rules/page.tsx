import CommercialRulesDashboard from '@/components/CommercialRulesDashboard'
import {
  CANCELLATION_POLICY_SUMMARY,
  IMPORTANT_RULES,
  RESERVATION_PAYMENT_TEXT,
} from '@/Lib/cdlCommercialRules'
import {
  fetchSupabaseCommercialRules,
  getFallbackCommercialRules,
} from '@/Lib/supabaseCommercialRules'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function findRulesTable() {
  for (const table of ['commercial_rules', 'pricing_rules'] as const) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (!error) return table
  }
  return null
}

export default async function CommercialRulesPage() {
  const [rules, table] = await Promise.all([
    fetchSupabaseCommercialRules(),
    findRulesTable(),
  ])

  const initialData = {
    rules,
    editable: table != null,
    table,
    textRules: {
      reservationPayment: RESERVATION_PAYMENT_TEXT,
      cancellation: [...CANCELLATION_POLICY_SUMMARY],
      minimumOrder: [...IMPORTANT_RULES.minimumOrder],
      mileage: [...IMPORTANT_RULES.mileage],
      reservation: [...IMPORTANT_RULES.reservation],
      foodPolicy: [...IMPORTANT_RULES.foodPolicy],
      latePayment: [...IMPORTANT_RULES.latePayment],
      decemberJanuary: [...IMPORTANT_RULES.decemberJanuary],
      quoteValidityDays: 30,
    },
    fallback: getFallbackCommercialRules(),
  }

  return <CommercialRulesDashboard initialData={initialData} />
}
