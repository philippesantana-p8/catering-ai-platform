-- Package items (base composition) and side items (guarnições) — multi-company SaaS
-- Substituir :'cdl_company_id' pelo UUID da empresa antes de executar seeds.
-- Schema real para opções: option_group_key, label_pt, required, active, option_item_key

-- ---------------------------------------------------------------------------
-- package_items — itens base do pacote ("Itens do pacote")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  additional_item_id uuid REFERENCES public.additional_items(id) ON DELETE SET NULL,
  item_key varchar NOT NULL,
  label_pt varchar NOT NULL,
  label_en varchar,
  label_es varchar,
  description_pt text,
  description_en text,
  description_es text,
  quantity numeric DEFAULT 1,
  unit_label_pt varchar,
  unit_label_en varchar,
  unit_label_es varchar,
  included boolean DEFAULT true,
  is_choice_placeholder boolean DEFAULT false,
  blocks_additional_item boolean DEFAULT false,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, package_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_package_items_package
  ON public.package_items (company_id, package_id, display_order)
  WHERE active = true;

-- ---------------------------------------------------------------------------
-- package_side_items — guarnições do pacote
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.package_side_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  additional_item_id uuid REFERENCES public.additional_items(id) ON DELETE SET NULL,
  item_key varchar NOT NULL,
  label_pt varchar NOT NULL,
  label_en varchar,
  label_es varchar,
  description_pt text,
  description_en text,
  description_es text,
  quantity numeric DEFAULT 1,
  unit_label_pt varchar,
  unit_label_en varchar,
  unit_label_es varchar,
  included boolean DEFAULT true,
  blocks_additional_item boolean DEFAULT false,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, package_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_package_side_items_package
  ON public.package_side_items (company_id, package_id, display_order)
  WHERE active = true;

-- ---------------------------------------------------------------------------
-- Diagnostic queries (run before seeds)
-- ---------------------------------------------------------------------------
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'packages',
--     'additional_items',
--     'package_items',
--     'package_side_items',
--     'package_option_groups',
--     'package_option_group_items'
--   )
-- ORDER BY table_name, ordinal_position;

-- SELECT id, company_id, package_key, label_pt, price, active
-- FROM public.packages
-- WHERE company_id = :'cdl_company_id'::uuid
-- ORDER BY package_key;

-- SELECT id, item_key, item_name, label_pt, category_pt, price
-- FROM public.additional_items
-- WHERE company_id = :'cdl_company_id'::uuid
--   AND (
--     item_name ILIKE '%picanha%'
--     OR item_name ILIKE '%lingui%'
--     OR item_name ILIKE '%frango%'
--     OR item_name ILIKE '%pão%'
--     OR item_name ILIKE '%queijo%'
--     OR item_name ILIKE '%milho%'
--     OR item_name ILIKE '%chimichurri%'
--     OR item_name ILIKE '%farofa%'
--     OR item_name ILIKE '%mel%'
--     OR item_name ILIKE '%goiabada%'
--     OR item_name ILIKE '%pimenta%'
--     OR item_name ILIKE '%geleia%'
--     OR item_name ILIKE '%salm%'
--     OR item_name ILIKE '%camar%'
--     OR item_name ILIKE '%costela%'
--     OR item_name ILIKE '%cordeiro%'
--     OR item_name ILIKE '%arroz%'
--     OR item_name ILIKE '%feijão%'
--     OR item_name ILIKE '%vinagrete%'
--     OR item_name ILIKE '%mandioca%'
--   )
-- ORDER BY item_name;

-- SELECT pi.item_key, pi.label_pt, p.package_key, pi.additional_item_id
-- FROM public.package_items pi
-- JOIN public.packages p ON p.id = pi.package_id
-- WHERE pi.company_id = :'cdl_company_id'::uuid AND pi.active = true
-- ORDER BY p.package_key, pi.display_order;

-- SELECT psi.item_key, psi.label_pt, p.package_key, psi.additional_item_id
-- FROM public.package_side_items psi
-- JOIN public.packages p ON p.id = psi.package_id
-- WHERE psi.company_id = :'cdl_company_id'::uuid AND psi.active = true
-- ORDER BY p.package_key, psi.display_order;

-- ---------------------------------------------------------------------------
-- CDL seed — itens base (Traditional, Select, Choice, Prime)
-- Não incluir escolhas (Salmão/Camarão, Costela) — ficam em package_option_groups
-- ---------------------------------------------------------------------------

-- INSERT INTO public.package_items (
--   company_id,
--   package_id,
--   additional_item_id,
--   item_key,
--   label_pt,
--   label_en,
--   label_es,
--   display_order,
--   included,
--   blocks_additional_item,
--   active
-- )
-- SELECT
--   :'cdl_company_id'::uuid,
--   p.id,
--   ai.id,
--   seed.item_key,
--   seed.label_pt,
--   seed.label_en,
--   seed.label_es,
--   seed.display_order,
--   true,
--   COALESCE(seed.blocks_additional_item, false),
--   true
-- FROM public.packages p
-- CROSS JOIN (
--   VALUES
--     ('picanha_angus', 'Picanha Angus', 'Picanha Angus', 'Picanha Angus', 1, true),
--     ('linguica_tradicional', 'Linguiça tradicional', 'Traditional sausage', 'Chorizo tradicional', 2, true),
--     ('frango_sobrecoxa', 'Frango sobrecoxa desossada', 'Boneless chicken thigh', 'Muslo de pollo deshuesado', 3, true),
--     ('pao_alho', 'Pão de alho', 'Garlic bread', 'Pan de ajo', 4, true),
--     ('queijo_coalho', 'Queijo coalho', 'Coalho cheese', 'Queso coalho', 5, true),
--     ('milho', 'Milho', 'Corn', 'Maíz', 6, true),
--     ('chimichurri', 'Chimichurri', 'Chimichurri', 'Chimichurri', 7, false),
--     ('farofa', 'Farofa', 'Farofa', 'Farofa', 8, false),
--     ('mel', 'Mel', 'Honey', 'Miel', 9, false),
--     ('goiabada', 'Goiabada', 'Guava paste', 'Dulce de guayaba', 10, false),
--     ('pimenta_bico', 'Pimenta de bico', 'Finger pepper', 'Pimiento de bico', 11, false),
--     ('geleia_pimenta', 'Geleia de pimenta', 'Pepper jelly', 'Mermelada de pimiento', 12, false)
-- ) AS seed(item_key, label_pt, label_en, label_es, display_order, blocks_additional_item)
-- LEFT JOIN public.additional_items ai
--   ON ai.company_id = :'cdl_company_id'::uuid
--   AND (
--     lower(trim(coalesce(ai.item_key, ''))) = seed.item_key
--     OR lower(trim(coalesce(ai.label_pt, ''))) = lower(seed.label_pt)
--     OR lower(trim(coalesce(ai.item_name, ''))) = lower(seed.label_pt)
--     OR (seed.item_key = 'picanha_angus' AND ai.item_name ILIKE '%picanha%')
--     OR (seed.item_key = 'linguica_tradicional' AND ai.item_name ILIKE '%lingui%')
--     OR (seed.item_key = 'frango_sobrecoxa' AND ai.item_name ILIKE '%frango%')
--     OR (seed.item_key = 'pao_alho' AND ai.item_name ILIKE '%pão%alho%')
--     OR (seed.item_key = 'queijo_coalho' AND ai.item_name ILIKE '%queijo%coalho%')
--     OR (seed.item_key = 'milho' AND ai.item_name ILIKE '%milho%')
--     OR (seed.item_key = 'chimichurri' AND ai.item_name ILIKE '%chimichurri%')
--     OR (seed.item_key = 'farofa' AND ai.item_name ILIKE '%farofa%')
--     OR (seed.item_key = 'mel' AND ai.item_name ILIKE '%mel%')
--     OR (seed.item_key = 'goiabada' AND ai.item_name ILIKE '%goiabada%')
--     OR (seed.item_key = 'pimenta_bico' AND ai.item_name ILIKE '%pimenta%bico%')
--     OR (seed.item_key = 'geleia_pimenta' AND ai.item_name ILIKE '%geleia%pimenta%')
--   )
-- WHERE p.company_id = :'cdl_company_id'::uuid
--   AND trim(p.package_key) ~ '^(BBQTRAD|BBQSEL|BBQCHO|BBQPRI)'
--   AND trim(p.package_key) NOT ILIKE '%PERS%'
-- ON CONFLICT (company_id, package_id, item_key)
-- DO UPDATE SET
--   label_pt = EXCLUDED.label_pt,
--   label_en = EXCLUDED.label_en,
--   label_es = EXCLUDED.label_es,
--   additional_item_id = EXCLUDED.additional_item_id,
--   display_order = EXCLUDED.display_order,
--   blocks_additional_item = EXCLUDED.blocks_additional_item,
--   active = true,
--   updated_at = now();

-- Prime only — Carré de cordeiro (item fixo)
-- INSERT INTO public.package_items (
--   company_id,
--   package_id,
--   additional_item_id,
--   item_key,
--   label_pt,
--   label_en,
--   label_es,
--   display_order,
--   included,
--   blocks_additional_item,
--   active
-- )
-- SELECT
--   :'cdl_company_id'::uuid,
--   p.id,
--   ai.id,
--   'carre_cordeiro',
--   'Carré de cordeiro',
--   'Rack of lamb',
--   'Carré de cordero',
--   13,
--   true,
--   true,
--   true
-- FROM public.packages p
-- LEFT JOIN public.additional_items ai
--   ON ai.company_id = :'cdl_company_id'::uuid
--   AND (
--     lower(trim(coalesce(ai.item_key, ''))) = 'carre_cordeiro'
--     OR ai.item_name ILIKE '%cordeiro%'
--     OR ai.item_name ILIKE '%lamb%'
--   )
-- WHERE p.company_id = :'cdl_company_id'::uuid
--   AND trim(p.package_key) ~ '^BBQPRI'
--   AND trim(p.package_key) NOT ILIKE '%PERS%'
-- ON CONFLICT (company_id, package_id, item_key)
-- DO UPDATE SET
--   label_pt = EXCLUDED.label_pt,
--   additional_item_id = EXCLUDED.additional_item_id,
--   blocks_additional_item = EXCLUDED.blocks_additional_item,
--   active = true,
--   updated_at = now();

-- Personalizado — texto informativo (sem bloqueio de adicionais)
-- INSERT INTO public.package_items (
--   company_id,
--   package_id,
--   item_key,
--   label_pt,
--   label_en,
--   label_es,
--   display_order,
--   included,
--   blocks_additional_item,
--   active
-- )
-- SELECT
--   :'cdl_company_id'::uuid,
--   p.id,
--   'custom_items',
--   'Itens definidos conforme necessidade do evento',
--   'Items defined according to event needs',
--   'Ítems definidos según necesidad del evento',
--   1,
--   true,
--   false,
--   true
-- FROM public.packages p
-- WHERE p.company_id = :'cdl_company_id'::uuid
--   AND trim(p.package_key) ILIKE '%PERS%'
-- ON CONFLICT (company_id, package_id, item_key)
-- DO UPDATE SET
--   label_pt = EXCLUDED.label_pt,
--   active = true,
--   updated_at = now();

-- ---------------------------------------------------------------------------
-- CDL seed — guarnições (pacotes com sufixo +)
-- ---------------------------------------------------------------------------

-- INSERT INTO public.package_side_items (
--   company_id,
--   package_id,
--   additional_item_id,
--   item_key,
--   label_pt,
--   label_en,
--   label_es,
--   display_order,
--   included,
--   blocks_additional_item,
--   active
-- )
-- SELECT
--   :'cdl_company_id'::uuid,
--   p.id,
--   ai.id,
--   seed.item_key,
--   seed.label_pt,
--   seed.label_en,
--   seed.label_es,
--   seed.display_order,
--   true,
--   COALESCE(seed.blocks_additional_item, false),
--   true
-- FROM public.packages p
-- CROSS JOIN (
--   VALUES
--     ('arroz_branco', 'Arroz branco', 'White rice', 'Arroz blanco', 1, false),
--     ('feijao_tropeiro', 'Feijão tropeiro', 'Tropeiro beans', 'Feijão tropeiro', 2, false),
--     ('vinagrete', 'Vinagrete', 'Vinaigrette', 'Vinagreta', 3, false),
--     ('farofa', 'Farofa', 'Farofa', 'Farofa', 4, false),
--     ('mandioca', 'Mandioca', 'Cassava', 'Mandioca', 5, false)
-- ) AS seed(item_key, label_pt, label_en, label_es, display_order, blocks_additional_item)
-- LEFT JOIN public.additional_items ai
--   ON ai.company_id = :'cdl_company_id'::uuid
--   AND (
--     lower(trim(coalesce(ai.item_key, ''))) = seed.item_key
--     OR lower(trim(coalesce(ai.label_pt, ''))) = lower(seed.label_pt)
--     OR lower(trim(coalesce(ai.item_name, ''))) = lower(seed.label_pt)
--     OR (seed.item_key = 'arroz_branco' AND ai.item_name ILIKE '%arroz%')
--     OR (seed.item_key = 'feijao_tropeiro' AND ai.item_name ILIKE '%feijão%tropeiro%')
--     OR (seed.item_key = 'vinagrete' AND ai.item_name ILIKE '%vinagrete%')
--     OR (seed.item_key = 'farofa' AND ai.item_name ILIKE '%farofa%')
--     OR (seed.item_key = 'mandioca' AND ai.item_name ILIKE '%mandioca%')
--   )
-- WHERE p.company_id = :'cdl_company_id'::uuid
--   AND trim(p.package_key) LIKE '%+'
--   AND trim(p.package_key) NOT ILIKE '%PERS%'
-- ON CONFLICT (company_id, package_id, item_key)
-- DO UPDATE SET
--   label_pt = EXCLUDED.label_pt,
--   label_en = EXCLUDED.label_en,
--   label_es = EXCLUDED.label_es,
--   additional_item_id = EXCLUDED.additional_item_id,
--   display_order = EXCLUDED.display_order,
--   active = true,
--   updated_at = now();
