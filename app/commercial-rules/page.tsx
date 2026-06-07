import CommercialRulesDashboard from '@/components/CommercialRulesDashboard'
import {
  buildCommercialRulesListSelect,
  parseCommercialRuleValue,
  type CommercialRuleRow,
} from '@/Lib/commercialRulesTableSchema'
import { getFallbackCommercialRules } from '@/Lib/supabaseCommercialRules'
import { fetchSupabaseCommercialRules } from '@/Lib/supabaseCommercialRules'
import { supabase } from '@/Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchRuleRows(): Promise<CommercialRuleRow[]> {
  const { data, error } = await supabase
    .from('commercial_rules')
    .select(buildCommercialRulesListSelect())
    .order('rule_key', { ascending: true })

  if (error) return []
  return (data ?? []).map((row) => {
    const typed = row as unknown as Record<string, unknown>
    return {
      ...typed,
      rule_value: parseCommercialRuleValue(typed.rule_value),
    } as CommercialRuleRow
  })
}

async function tableExists() {
  const { error } = await supabase.from('commercial_rules').select('id').limit(1)
  return !error
}

export default async function CommercialRulesPage() {
  const [rules, exists, rows] = await Promise.all([
    fetchSupabaseCommercialRules(),
    tableExists(),
    fetchRuleRows(),
  ])

  return (
    <CommercialRulesDashboard
      initialData={{
        rules,
        rows,
        editable: exists,
        table: exists ? 'commercial_rules' : null,
        fallback: getFallbackCommercialRules(),
      }}
    />
  )
}
