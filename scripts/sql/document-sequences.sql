-- CDL document numbering: atomic next-number per company, type and year.
-- Run in Supabase SQL editor (or migration pipeline) before deploying app changes.

-- ---------------------------------------------------------------------------
-- Control table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  document_type text NOT NULL,
  prefix text NOT NULL,
  year integer NOT NULL,
  current_number integer NOT NULL DEFAULT 0,
  padding integer NOT NULL DEFAULT 6,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_sequences_company_type_year_unique
    UNIQUE (company_id, document_type, year),
  CONSTRAINT document_sequences_document_type_check
    CHECK (document_type IN ('quote', 'order', 'service_order'))
);

CREATE INDEX IF NOT EXISTS document_sequences_company_type_year_idx
  ON public.document_sequences (company_id, document_type, year);

COMMENT ON TABLE public.document_sequences IS
  'Per-company document counters. quote=Q, order=O, service_order=SO.';

-- ---------------------------------------------------------------------------
-- Prefix resolver (internal)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_document_prefix(p_document_type text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE p_document_type
    WHEN 'quote' THEN RETURN 'Q';
    WHEN 'order' THEN RETURN 'O';
    WHEN 'service_order' THEN RETURN 'SO';
    ELSE
      RAISE EXCEPTION 'document_type inválido: % (use quote, order ou service_order)', p_document_type;
  END CASE;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_next_document_number
-- Format: {prefix}-{year}-{padded}  e.g. Q-2026-000001
-- Atomic via INSERT ... ON CONFLICT DO UPDATE (row-level lock on conflict).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_next_document_number(
  p_company_id uuid,
  p_document_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_prefix text := public.resolve_document_prefix(p_document_type);
  v_padding integer := 6;
  v_next integer;
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'p_company_id é obrigatório';
  END IF;

  INSERT INTO public.document_sequences (
    company_id,
    document_type,
    prefix,
    year,
    current_number,
    padding,
    active
  )
  VALUES (
    p_company_id,
    p_document_type,
    v_prefix,
    v_year,
    1,
    v_padding,
    true
  )
  ON CONFLICT (company_id, document_type, year)
  DO UPDATE SET
    current_number = public.document_sequences.current_number + 1,
    updated_at = now()
  RETURNING current_number, padding, prefix
  INTO v_next, v_padding, v_prefix;

  RETURN v_prefix || '-' || v_year::text || '-' || lpad(v_next::text, v_padding, '0');
END;
$$;

COMMENT ON FUNCTION public.get_next_document_number(uuid, text) IS
  'Allocates next document number atomically. Types: quote, order, service_order.';

GRANT EXECUTE ON FUNCTION public.get_next_document_number(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_document_number(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Unique quote numbers per company (partial — ignores null legacy rows)
-- Resolve existing duplicates manually before applying if this fails.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS quotes_company_id_quote_number_unique
  ON public.quotes (company_id, quote_number)
  WHERE quote_number IS NOT NULL AND btrim(quote_number) <> '';
