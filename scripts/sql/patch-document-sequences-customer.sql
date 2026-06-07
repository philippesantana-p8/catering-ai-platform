-- Patch: adiciona tipo `customer` (AB000001) à RPC existente.
-- Execute no Supabase se get_next_document_number rejeitar 'customer'.

ALTER TABLE public.document_sequences
  DROP CONSTRAINT IF EXISTS document_sequences_document_type_check;

ALTER TABLE public.document_sequences
  ADD CONSTRAINT document_sequences_document_type_check
  CHECK (document_type IN ('quote', 'order', 'service_order', 'customer'));

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
    WHEN 'customer' THEN RETURN 'AB';
    ELSE
      RAISE EXCEPTION
        'document_type inválido: % (use quote, order, service_order ou customer)',
        p_document_type;
  END CASE;
END;
$$;

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
  v_year integer;
  v_prefix text := public.resolve_document_prefix(p_document_type);
  v_padding integer := 6;
  v_next integer;
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'p_company_id é obrigatório';
  END IF;

  IF p_document_type = 'customer' THEN
    v_year := 0;
  ELSE
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
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

  IF p_document_type = 'customer' THEN
    RETURN v_prefix || lpad(v_next::text, v_padding, '0');
  END IF;

  RETURN v_prefix || '-' || v_year::text || '-' || lpad(v_next::text, v_padding, '0');
END;
$$;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS ab_number text;

GRANT EXECUTE ON FUNCTION public.get_next_document_number(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_next_document_number(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_document_number(uuid, text) TO service_role;
