-- Catálogo premium de pacotes: descrições, guarnições, custo e inventário.
-- Execute no Supabase SQL Editor.

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS items_description_pt text,
  ADD COLUMN IF NOT EXISTS items_description_en text,
  ADD COLUMN IF NOT EXISTS items_description_es text,
  ADD COLUMN IF NOT EXISTS garnish_description_pt text,
  ADD COLUMN IF NOT EXISTS garnish_description_en text,
  ADD COLUMN IF NOT EXISTS garnish_description_es text,
  ADD COLUMN IF NOT EXISTS card_description_pt text,
  ADD COLUMN IF NOT EXISTS card_description_en text,
  ADD COLUMN IF NOT EXISTS card_description_es text,
  ADD COLUMN IF NOT EXISTS package_type text DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS base_package_code text,
  ADD COLUMN IF NOT EXISTS has_garnish boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS garnish_price_per_person numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_person numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inventory_enabled boolean DEFAULT false;

-- Pacotes com guarnições (+)
UPDATE public.packages p
SET
  has_garnish = true,
  package_type = 'with_garnish',
  base_package_code = regexp_replace(trim(p.package_key), '\+$', '')
WHERE trim(coalesce(p.package_key, '')) LIKE '%+';

-- Pacotes personalizados
UPDATE public.packages
SET package_type = 'custom'
WHERE trim(coalesce(package_key, '')) ILIKE '%PERS%'
  AND coalesce(package_type, 'base') = 'base';

-- Guarnição = diferença para o pacote base, quando existir
UPDATE public.packages garnish_pkg
SET garnish_price_per_person = GREATEST(
  0,
  coalesce(garnish_pkg.price_per_person, 0) - coalesce(base_pkg.price_per_person, 0)
)
FROM public.packages base_pkg
WHERE garnish_pkg.has_garnish = true
  AND base_pkg.package_key = garnish_pkg.base_package_code
  AND coalesce(garnish_pkg.garnish_price_per_person, 0) = 0;
