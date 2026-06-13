-- Catálogo mestre: flags de uso e preços em `public.catalog_items`.
-- Execute no Supabase SQL Editor.

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS can_be_package_item boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_be_side_item boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_be_additional boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_be_option_choice boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS inventory_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric;

-- sale_price inicial = price quando vazio
UPDATE public.catalog_items
SET sale_price = price
WHERE sale_price IS NULL
  AND price IS NOT NULL;
