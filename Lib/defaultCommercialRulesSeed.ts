import type { CommercialRuleRow } from './commercialRulesTableSchema'

export const DEFAULT_COMMERCIAL_RULE_SEEDS: Array<
  Omit<CommercialRuleRow, 'id' | 'updated_at'>
> = [
  {
    rule_key: 'deposit_percentage',
    rule_value: '30',
    rule_type: 'number',
    description: 'Percentual padrão de reserva/sinal',
    active: true,
  },
  {
    rule_key: 'reservation_percentage',
    rule_value: '30',
    rule_type: 'number',
    description: 'Alias de deposit_percentage',
    active: true,
  },
  {
    rule_key: 'mileage_base_location',
    rule_value: 'Orlando Eye',
    rule_type: 'text',
    description: 'Base de cálculo de milhagem',
    active: true,
  },
  {
    rule_key: 'mileage_free_limit',
    rule_value: '20',
    rule_type: 'number',
    description: 'Milhas gratuitas a partir da base',
    active: true,
  },
  {
    rule_key: 'mileage_rate',
    rule_value: '2',
    rule_type: 'number',
    description: 'Taxa por milha acima do limite (USD)',
    active: true,
  },
  {
    rule_key: 'children_under_3_factor',
    rule_value: '0',
    rule_type: 'number',
    description: 'Fator de cobrança crianças até 3 anos',
    active: true,
  },
  {
    rule_key: 'children_4_to_12_factor',
    rule_value: '0.5',
    rule_type: 'number',
    description: 'Fator de cobrança crianças 4–12 anos',
    active: true,
  },
  {
    rule_key: 'quote_validity_days',
    rule_value: '7',
    rule_type: 'number',
    description: 'Validade padrão da cotação (dias)',
    active: true,
  },
  {
    rule_key: 'cancellation_policy_pt',
    rule_value: '',
    rule_type: 'text',
    description: 'Política de cancelamento (PT)',
    active: true,
  },
  {
    rule_key: 'holiday_policy_pt',
    rule_value: '',
    rule_type: 'text',
    description: 'Política de feriados (PT)',
    active: true,
  },
  {
    rule_key: 'commercial_notes_pt',
    rule_value: '',
    rule_type: 'text',
    description: 'Observações comerciais (PT)',
    active: true,
  },
]
