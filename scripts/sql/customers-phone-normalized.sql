-- phone_normalized: anti-duplicidade por telefone por empresa.
-- Idempotente — seguro para reexecutar no Supabase SQL Editor.
--
-- Run order: ver scripts/sql/README.md
-- Se o índice único (step 3) falhar por duplicatas, rode dedupe-customers-by-phone.sql
-- e depois reexecute apenas o step 3.

-- ---------------------------------------------------------------------------
-- Step 1: Coluna
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS phone_normalized text;

-- ---------------------------------------------------------------------------
-- Step 2: Backfill (somente dígitos)
-- ---------------------------------------------------------------------------
UPDATE public.customers
SET phone_normalized = regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
WHERE phone IS NOT NULL
  AND (
    phone_normalized IS NULL
    OR btrim(phone_normalized) = ''
  );

-- ---------------------------------------------------------------------------
-- Step 3: Índice único parcial (requer ausência de duplicatas ativas)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS customers_company_phone_normalized_uidx
  ON public.customers (company_id, phone_normalized)
  WHERE phone_normalized IS NOT NULL
    AND btrim(phone_normalized) <> ''
    AND active IS TRUE;

COMMENT ON COLUMN public.customers.phone_normalized IS
  'Telefone somente dígitos — usado para busca e índice único por empresa.';
