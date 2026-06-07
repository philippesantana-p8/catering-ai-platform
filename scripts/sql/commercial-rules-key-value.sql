-- Tabela key-value de regras comerciais editáveis.
-- Idempotente — seguro para reexecutar no Supabase SQL Editor.
--
-- Run order: independente (pode rodar a qualquer momento).
-- Ver scripts/sql/README.md para migrações de customers.

-- ---------------------------------------------------------------------------
-- Step 1: Tabela base
-- ---------------------------------------------------------------------------
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

-- Tabela pode já existir sem colunas novas — adiciona o que faltar.
ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS rule_value text;

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS rule_type text NOT NULL DEFAULT 'text';

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- Step 2: Índice único parcial (apenas regras ativas)
-- ON CONFLICT não funciona com este índice sem cláusula WHERE — seeds usam
-- INSERT ... WHERE NOT EXISTS abaixo.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS commercial_rules_rule_key_uidx
  ON public.commercial_rules (rule_key)
  WHERE active IS TRUE;

-- ---------------------------------------------------------------------------
-- Step 3: Seeds padrão — insere somente se rule_key ainda não existir
-- (ativa ou inativa). Não usa ON CONFLICT (índice é parcial).
-- ---------------------------------------------------------------------------
INSERT INTO public.commercial_rules (
  rule_key,
  rule_value,
  rule_type,
  description,
  active
)
SELECT
  v.rule_key,
  v.rule_value,
  v.rule_type,
  v.description,
  v.active
FROM (
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
    ('quote_validity_days', '7', 'number', 'Validade padrão da cotação (dias)', true),
    ('minimum_order_amount', '0', 'number', 'Valor mínimo de pedido se aplicável', true),
    ('grill_photo_required_default', 'false', 'boolean', 'Exigir foto da churrasqueira por padrão', true),
    ('cancellation_policy_pt', '', 'text', 'Texto de política de cancelamento (PT)', true),
    ('holiday_policy_pt', '', 'text', 'Texto de política de feriados (PT)', true),
    ('commercial_notes_pt', '', 'text', 'Observações comerciais (PT)', true)
) AS v(rule_key, rule_value, rule_type, description, active)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.commercial_rules AS cr
  WHERE cr.rule_key = v.rule_key
);
