-- Tabela key-value de regras comerciais editáveis.
-- Idempotente — seguro para reexecutar no Supabase SQL Editor.
-- App usa apenas: id, company_id, rule_key, rule_value (jsonb), active, created_at, updated_at
-- Não usa colunas `description` nem `rule_type` (tipo fica em rule_value.type).

CREATE TABLE IF NOT EXISTS public.commercial_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  rule_key text NOT NULL,
  rule_value jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS company_id uuid;

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS rule_value jsonb;

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Migração suave: rule_type + rule_value text → rule_value jsonb
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'commercial_rules'
      AND column_name = 'rule_type'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'commercial_rules'
      AND column_name = 'rule_value'
      AND data_type = 'text'
  ) THEN
    UPDATE public.commercial_rules
    SET rule_value = jsonb_build_object(
      'value', rule_value,
      'type', COALESCE(rule_type, 'text'),
      'label_pt', COALESCE(rule_key, '')
    )
    WHERE rule_value IS NOT NULL
      AND rule_value::text NOT LIKE '{%';

    ALTER TABLE public.commercial_rules
      ALTER COLUMN rule_value TYPE jsonb
      USING rule_value::jsonb;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS commercial_rules_rule_key_uidx
  ON public.commercial_rules (rule_key)
  WHERE active IS TRUE;

INSERT INTO public.commercial_rules (
  rule_key,
  rule_value,
  active
)
SELECT
  v.rule_key,
  v.rule_value::jsonb,
  v.active
FROM (
  VALUES
    (
      'deposit_percentage',
      '{"value":30,"type":"number","label_pt":"Reserva padrão (%)"}',
      true
    ),
    (
      'mileage_base_location',
      '{"value":"Orlando Eye","type":"text","label_pt":"Ponto base de milhagem"}',
      true
    ),
    (
      'mileage_free_limit',
      '{"value":20,"type":"number","unit":"mi","label_pt":"Milhas grátis"}',
      true
    ),
    (
      'mileage_rate',
      '{"value":2,"type":"number","unit":"USD/mi","label_pt":"Taxa por milha"}',
      true
    ),
    (
      'children_under_3_factor',
      '{"value":0,"type":"number","label_pt":"Crianças até 3 anos"}',
      true
    ),
    (
      'children_4_to_12_factor',
      '{"value":0.5,"type":"number","label_pt":"Crianças 4 a 12 anos"}',
      true
    ),
    (
      'quote_validity_days',
      '{"value":7,"type":"number","unit":"days","label_pt":"Validade da cotação"}',
      true
    ),
    (
      'cancellation_policy_pt',
      '{"value":"Texto da política de cancelamento","type":"long_text","label_pt":"Política de cancelamento"}',
      true
    ),
    (
      'holiday_policy_pt',
      '{"value":"Texto da política de feriados","type":"long_text","label_pt":"Política de feriados"}',
      true
    ),
    (
      'commercial_notes_pt',
      '{"value":"Observações comerciais","type":"long_text","label_pt":"Observações comerciais"}',
      true
    )
) AS v(rule_key, rule_value, active)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.commercial_rules AS cr
  WHERE cr.rule_key = v.rule_key
);
