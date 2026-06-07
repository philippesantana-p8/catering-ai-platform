-- Desativa duplicados ativos com mesmo company_id + phone_normalized.
-- Mantém o registro com mais dados preenchidos; em empate, o mais antigo
-- (created_at se existir, senão updated_at, senão menor id).
-- Não remove fisicamente — apenas active = false.
--
-- Idempotente — seguro para reexecutar no Supabase SQL Editor.
--
-- Pré-requisito recomendado: scripts/sql/customers-phone-normalized.sql
-- (coluna + backfill). Este script repete coluna/backfill se necessário.
-- Rode o índice único de customers-phone-normalized.sql DEPOIS deste script.

-- ---------------------------------------------------------------------------
-- Step 1: Garantir colunas necessárias
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS phone_normalized text;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------------------------------------------------------------------------
-- Step 2: Backfill phone_normalized (mesma lógica de customers-phone-normalized)
-- ---------------------------------------------------------------------------
UPDATE public.customers
SET phone_normalized = regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
WHERE phone IS NOT NULL
  AND (
    phone_normalized IS NULL
    OR btrim(phone_normalized) = ''
  );

-- ---------------------------------------------------------------------------
-- Step 3: Desativar duplicados (ordenação adapta-se às colunas existentes)
-- ---------------------------------------------------------------------------
DO $dedupe$
DECLARE
  has_created_at boolean;
  has_updated_at boolean;
  order_clause text;
  score_expr text := $$
    (
      (CASE WHEN ab_name IS NOT NULL AND btrim(ab_name) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN full_name IS NOT NULL AND btrim(full_name) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN contact_name IS NOT NULL AND btrim(contact_name) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN email IS NOT NULL AND btrim(email) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN ab_number IS NOT NULL AND btrim(ab_number) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN city IS NOT NULL AND btrim(city) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN state IS NOT NULL AND btrim(state) <> '' THEN 1 ELSE 0 END)
    )
  $$;
  set_clause text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'created_at'
  ) INTO has_created_at;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'updated_at'
  ) INTO has_updated_at;

  IF has_created_at THEN
    order_clause := score_expr || ' DESC, created_at ASC NULLS LAST, id ASC';
  ELSIF has_updated_at THEN
    order_clause := score_expr || ' DESC, updated_at ASC NULLS LAST, id ASC';
  ELSE
    order_clause := score_expr || ' DESC, id ASC';
  END IF;

  IF has_updated_at THEN
    set_clause := 'active = false, updated_at = now()';
  ELSE
    set_clause := 'active = false';
  END IF;

  EXECUTE format($sql$
    WITH scored AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY company_id, phone_normalized
          ORDER BY %s
        ) AS rn
      FROM public.customers
      WHERE active IS TRUE
        AND phone_normalized IS NOT NULL
        AND btrim(phone_normalized) <> ''
    )
    UPDATE public.customers AS c
    SET %s
    FROM scored AS s
    WHERE c.id = s.id
      AND s.rn > 1
  $sql$, order_clause, set_clause);
END;
$dedupe$;
