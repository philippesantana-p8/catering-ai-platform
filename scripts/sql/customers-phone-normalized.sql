-- phone_normalized: anti-duplicidade por telefone por empresa.
-- Execute no Supabase SQL Editor.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS phone_normalized text;

UPDATE public.customers
SET phone_normalized = regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
WHERE phone IS NOT NULL
  AND (
    phone_normalized IS NULL
    OR btrim(phone_normalized) = ''
  );

CREATE UNIQUE INDEX IF NOT EXISTS customers_company_phone_normalized_uidx
  ON public.customers (company_id, phone_normalized)
  WHERE phone_normalized IS NOT NULL
    AND btrim(phone_normalized) <> ''
    AND active IS TRUE;

COMMENT ON COLUMN public.customers.phone_normalized IS
  'Telefone somente dígitos — usado para busca e índice único por empresa.';
