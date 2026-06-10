-- CDL: grupos de escolhas inclusas (Prime, Choice, Select)
-- Substituir :cdl_company_id pelo UUID da empresa antes de executar.
-- Schema real: option_group_key, label_pt, required, active, option_item_key

-- ---------------------------------------------------------------------------
-- 1) Grupos — Prime e Choice (proteína + costela), Select (só costela)
-- ---------------------------------------------------------------------------

INSERT INTO public.package_option_groups (
  company_id,
  package_id,
  option_group_key,
  label_pt,
  label_en,
  label_es,
  required,
  min_choices,
  max_choices,
  blocks_additional_items,
  display_order,
  active
)
SELECT
  :'cdl_company_id'::uuid,
  p.id,
  g.option_group_key,
  g.label_pt,
  g.label_en,
  g.label_es,
  true,
  1,
  1,
  true,
  g.display_order,
  true
FROM (
  VALUES
    ('premium_protein', 'Proteína premium', 'Premium protein', 'Proteína premium', 1),
    ('premium_ribs', 'Costela', 'Ribs', 'Costela', 2)
) AS g(option_group_key, label_pt, label_en, label_es, display_order)
CROSS JOIN public.packages p
WHERE p.company_id = :'cdl_company_id'::uuid
  AND trim(p.package_key) ~ '^(BBQPRI|BBQCHO)'
  AND trim(p.package_key) NOT ILIKE '%PERS%'
ON CONFLICT (company_id, package_id, option_group_key)
DO UPDATE SET
  label_pt = EXCLUDED.label_pt,
  required = EXCLUDED.required,
  blocks_additional_items = EXCLUDED.blocks_additional_items,
  display_order = EXCLUDED.display_order,
  active = true,
  updated_at = now();

INSERT INTO public.package_option_groups (
  company_id,
  package_id,
  option_group_key,
  label_pt,
  label_en,
  label_es,
  required,
  min_choices,
  max_choices,
  blocks_additional_items,
  display_order,
  active
)
SELECT
  :'cdl_company_id'::uuid,
  p.id,
  'premium_ribs',
  'Costela',
  'Ribs',
  'Costela',
  true,
  1,
  1,
  true,
  1,
  true
FROM public.packages p
WHERE p.company_id = :'cdl_company_id'::uuid
  AND trim(p.package_key) ~ '^BBQSEL'
  AND trim(p.package_key) NOT ILIKE '%PERS%'
ON CONFLICT (company_id, package_id, option_group_key)
DO UPDATE SET
  label_pt = EXCLUDED.label_pt,
  required = EXCLUDED.required,
  blocks_additional_items = EXCLUDED.blocks_additional_items,
  display_order = EXCLUDED.display_order,
  active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 2) Itens — vincular additional_item_id quando existir
-- ---------------------------------------------------------------------------

INSERT INTO public.package_option_group_items (
  company_id,
  option_group_id,
  additional_item_id,
  option_item_key,
  label_pt,
  label_en,
  label_es,
  display_order,
  active,
  price_delta
)
SELECT
  :'cdl_company_id'::uuid,
  og.id,
  ai.id,
  opt.option_item_key,
  opt.label_pt,
  opt.label_en,
  opt.label_es,
  opt.display_order,
  true,
  0
FROM public.package_option_groups og
JOIN public.packages pkg ON pkg.id = og.package_id
CROSS JOIN (
  VALUES
    ('salmao', 'Salmão', 'Salmon', 'Salmón', 1),
    ('camarao', 'Camarão', 'Shrimp', 'Camarón', 2)
) AS opt(option_item_key, label_pt, label_en, label_es, display_order)
LEFT JOIN public.additional_items ai
  ON ai.company_id = :'cdl_company_id'::uuid
  AND (
    lower(trim(coalesce(ai.item_key, ''))) = opt.option_item_key
    OR lower(trim(coalesce(ai.name_pt, ''))) LIKE '%' || opt.option_item_key || '%'
    OR (opt.option_item_key = 'salmao' AND ai.name_pt ILIKE '%salm%')
    OR (opt.option_item_key = 'camarao' AND ai.name_pt ILIKE '%camar%')
  )
WHERE og.company_id = :'cdl_company_id'::uuid
  AND og.option_group_key = 'premium_protein'
  AND trim(pkg.package_key) ~ '^(BBQPRI|BBQCHO)'
ON CONFLICT DO NOTHING;

INSERT INTO public.package_option_group_items (
  company_id,
  option_group_id,
  additional_item_id,
  option_item_key,
  label_pt,
  label_en,
  label_es,
  display_order,
  active,
  price_delta
)
SELECT
  :'cdl_company_id'::uuid,
  og.id,
  ai.id,
  opt.option_item_key,
  opt.label_pt,
  opt.label_en,
  opt.label_es,
  opt.display_order,
  true,
  0
FROM public.package_option_groups og
JOIN public.packages pkg ON pkg.id = og.package_id
CROSS JOIN (
  VALUES
    ('costela_boi', 'Costela de boi', 'Beef ribs', 'Costela de boi', 1),
    ('costela_porco', 'Costela de porco', 'Pork ribs', 'Costela de porco', 2)
) AS opt(option_item_key, label_pt, label_en, label_es, display_order)
LEFT JOIN public.additional_items ai
  ON ai.company_id = :'cdl_company_id'::uuid
  AND (
    lower(trim(coalesce(ai.item_key, ''))) = opt.option_item_key
    OR (opt.option_item_key = 'costela_boi' AND ai.name_pt ILIKE '%costela%boi%')
    OR (opt.option_item_key = 'costela_porco' AND ai.name_pt ILIKE '%costela%porco%')
    OR (opt.option_item_key = 'costela_boi' AND ai.name_pt ILIKE '%beef%rib%')
    OR (opt.option_item_key = 'costela_porco' AND ai.name_pt ILIKE '%pork%rib%')
  )
WHERE og.company_id = :'cdl_company_id'::uuid
  AND og.option_group_key = 'premium_ribs'
  AND trim(pkg.package_key) ~ '^(BBQPRI|BBQCHO|BBQSEL)'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Validação
-- ---------------------------------------------------------------------------
-- SELECT pog.option_group_key, pog.label_pt, pogi.option_item_key, pogi.label_pt, pogi.additional_item_id
-- FROM public.package_option_groups pog
-- JOIN public.package_option_group_items pogi ON pogi.option_group_id = pog.id
-- WHERE pog.active = true
-- ORDER BY pog.display_order, pogi.display_order;
