-- Catálogo premium de itens adicionais: custo, margem e inventário.
-- Execute no Supabase SQL Editor.

ALTER TABLE public.additional_items
  ADD COLUMN IF NOT EXISTS category_group text,
  ADD COLUMN IF NOT EXISTS description_pt text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_es text,
  ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inventory_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_item_id uuid,
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- category_group inicial = category_pt quando vazio
UPDATE public.additional_items
SET category_group = category_pt
WHERE coalesce(trim(category_group), '') = ''
  AND coalesce(trim(category_pt), '') <> '';
