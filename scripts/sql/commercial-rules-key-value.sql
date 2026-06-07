-- Tabela key-value de regras comerciais editáveis.
-- Execute no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.commercial_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  rule_value text,
  rule_type text NOT NULL DEFAULT 'text',
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_rules_rule_key_uidx
  ON public.commercial_rules (rule_key)
  WHERE active IS TRUE;

INSERT INTO public.commercial_rules (rule_key, rule_value, rule_type, description, active)
VALUES
  ('deposit_percentage', '30', 'number', 'Percentual padrão de reserva/sinal', true),
  ('reservation_percentage', '30', 'number', 'Alias de deposit_percentage', true),
  ('mileage_base_location', 'Orlando Eye', 'text', 'Base de cálculo de milhagem', true),
  ('mileage_free_limit', '20', 'number', 'Milhas gratuitas a partir da base', true),
  ('mileage_rate', '2', 'number', 'Taxa por milha acima do limite (USD)', true),
  ('children_under_3_factor', '0', 'number', 'Fator de cobrança crianças até 3 anos', true),
  ('children_4_to_12_factor', '0.5', 'number', 'Fator de cobrança crianças 4–12 anos', true),
  ('child_free_age_max', '3', 'number', 'Idade máxima criança grátis', true),
  ('child_half_age_max', '12', 'number', 'Idade máxima meia criança', true),
  ('quote_validity_days', '30', 'number', 'Validade padrão da cotação (dias)', true),
  ('minimum_order_amount', '0', 'number', 'Valor mínimo de pedido se aplicável', true),
  ('grill_photo_required_default', 'false', 'boolean', 'Exigir foto da churrasqueira por padrão', true),
  ('cancellation_policy_pt', '', 'text', 'Texto de política de cancelamento (PT)', true),
  ('holiday_policy_pt', '', 'text', 'Texto de política de feriados (PT)', true),
  ('commercial_notes_pt', '', 'text', 'Observações comerciais (PT)', true)
ON CONFLICT DO NOTHING;
