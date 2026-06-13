-- Colunas de uso e visibilidade em `public.catalog_items`.
-- Execute no Supabase SQL Editor.

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS customer_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'PRODUCT',
  ADD COLUMN IF NOT EXISTS operational_item boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_be_package_item boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_be_side_item boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_be_additional boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_be_option_choice boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS inventory_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric;

UPDATE public.catalog_items
SET sale_price = price
WHERE sale_price IS NULL AND price IS NOT NULL;

UPDATE public.catalog_items
SET item_type = 'PRODUCT'
WHERE coalesce(trim(item_type), '') = '';

-- Histórico de preços (opcional)
CREATE TABLE IF NOT EXISTS public.catalog_item_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  price numeric,
  sale_price numeric,
  active boolean DEFAULT true,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_item_prices_item_active_idx
  ON public.catalog_item_prices (catalog_item_id, active, valid_from DESC);
