-- Branding white-label por empresa (logo no helper e futuras telas).
-- Idempotente — rodar no Supabase SQL Editor.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS brand_logo_url text;

COMMENT ON COLUMN public.companies.logo_url IS 'URL pública do logo da empresa (helper, proposta, etc.)';
COMMENT ON COLUMN public.companies.brand_logo_url IS 'Alias opcional para logo de marca';
