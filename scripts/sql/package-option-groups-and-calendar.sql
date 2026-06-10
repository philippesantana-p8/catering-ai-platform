-- Package option groups, quote selections, and Google Calendar schema prep.
-- Execute no Supabase SQL Editor após package-commercial-descriptions.sql.

-- ---------------------------------------------------------------------------
-- Packages: highlights (may already exist)
-- ---------------------------------------------------------------------------
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS package_highlights_pt text,
  ADD COLUMN IF NOT EXISTS package_highlights_en text,
  ADD COLUMN IF NOT EXISTS package_highlights_es text;

-- ---------------------------------------------------------------------------
-- Companies: Google Calendar
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS google_calendar_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_calendar_id text,
  ADD COLUMN IF NOT EXISTS google_calendar_timezone text DEFAULT 'America/New_York';

-- ---------------------------------------------------------------------------
-- Quotes: Google Calendar sync
-- ---------------------------------------------------------------------------
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS google_calendar_event_id text,
  ADD COLUMN IF NOT EXISTS calendar_sync_status text,
  ADD COLUMN IF NOT EXISTS calendar_synced_at timestamptz;

-- ---------------------------------------------------------------------------
-- Package option groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.package_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  group_key text NOT NULL,
  title_pt text,
  title_en text,
  title_es text,
  min_choices integer NOT NULL DEFAULT 1,
  max_choices integer NOT NULL DEFAULT 1,
  is_required boolean NOT NULL DEFAULT true,
  blocks_additional_items boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, package_id, group_key)
);

CREATE INDEX IF NOT EXISTS idx_package_option_groups_package
  ON public.package_option_groups (company_id, package_id, display_order)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Package option group items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.package_option_group_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  option_group_id uuid NOT NULL REFERENCES public.package_option_groups(id) ON DELETE CASCADE,
  additional_item_id uuid REFERENCES public.additional_items(id) ON DELETE SET NULL,
  item_key text,
  label_pt text,
  label_en text,
  label_es text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  price_delta numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_package_option_group_items_group
  ON public.package_option_group_items (option_group_id, display_order)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Quote package selections (one choice per group)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_package_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  option_group_id uuid NOT NULL REFERENCES public.package_option_groups(id) ON DELETE RESTRICT,
  option_item_id uuid NOT NULL REFERENCES public.package_option_group_items(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, option_group_id)
);

CREATE INDEX IF NOT EXISTS idx_quote_package_selections_quote
  ON public.quote_package_selections (quote_id);

-- ---------------------------------------------------------------------------
-- RLS (uncomment if your project enables row-level security)
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.package_option_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.package_option_group_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.quote_package_selections ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY package_option_groups_company ON public.package_option_groups
--   FOR ALL USING (company_id = current_setting('app.company_id', true)::uuid);
-- CREATE POLICY package_option_group_items_company ON public.package_option_group_items
--   FOR ALL USING (company_id = current_setting('app.company_id', true)::uuid);
-- CREATE POLICY quote_package_selections_company ON public.quote_package_selections
--   FOR ALL USING (company_id = current_setting('app.company_id', true)::uuid);

-- ---------------------------------------------------------------------------
-- Seed data (CDL) — use package_key + company_id, not hardcoded package IDs.
-- Replace :cdl_company_id with your tenant UUID before running seeds.
-- ---------------------------------------------------------------------------
/*
\set cdl_company_id '65fd576f-8d97-49ba-bf38-61bc1e94e94a'

-- Helper: upsert group and return id
WITH prime_pkg AS (
  SELECT id FROM public.packages
  WHERE company_id = :'cdl_company_id'::uuid
    AND trim(package_key) IN ('BBQPRI', 'BBQPRI+')
  LIMIT 1
),
choice_pkg AS (
  SELECT id FROM public.packages
  WHERE company_id = :'cdl_company_id'::uuid
    AND trim(package_key) IN ('BBQCHO', 'BBQCHO+')
  LIMIT 1
),
select_pkg AS (
  SELECT id FROM public.packages
  WHERE company_id = :'cdl_company_id'::uuid
    AND trim(package_key) IN ('BBQSEL', 'BBQSEL+')
  LIMIT 1
)
INSERT INTO public.package_option_groups (
  company_id, package_id, group_key, title_pt, min_choices, max_choices,
  is_required, blocks_additional_items, display_order
)
SELECT
  :'cdl_company_id'::uuid,
  p.id,
  g.group_key,
  g.title_pt,
  1, 1, true, true, g.display_order
FROM (
  VALUES
    ('premium_protein', 'Proteína premium', 1),
    ('premium_ribs', 'Costela premium', 2)
) AS g(group_key, title_pt, display_order)
CROSS JOIN (
  SELECT id FROM public.packages
  WHERE company_id = :'cdl_company_id'::uuid
    AND trim(package_key) ILIKE 'BBQPRI%'
    AND trim(package_key) NOT ILIKE '%PERS%'
) p
ON CONFLICT (company_id, package_id, group_key) DO NOTHING;

-- Prime: Salmão ou camarão
INSERT INTO public.package_option_group_items (
  company_id, option_group_id, additional_item_id, item_key, label_pt, display_order
)
SELECT
  :'cdl_company_id'::uuid,
  og.id,
  ai.id,
  opt.item_key,
  opt.label_pt,
  opt.display_order
FROM public.package_option_groups og
JOIN public.packages pkg ON pkg.id = og.package_id
CROSS JOIN (
  VALUES
    ('salmao', 'Salmão', 1),
    ('camarao', 'Camarão', 2)
) AS opt(item_key, label_pt, display_order)
LEFT JOIN public.additional_items ai
  ON ai.company_id = :'cdl_company_id'::uuid
  AND lower(trim(ai.item_key)) = opt.item_key
WHERE og.company_id = :'cdl_company_id'::uuid
  AND og.group_key = 'premium_protein'
  AND trim(pkg.package_key) ILIKE 'BBQPRI%'
  AND trim(pkg.package_key) NOT ILIKE '%PERS%'
ON CONFLICT DO NOTHING;

-- Choice: Salmão ou camarão (same group_key on BBQCHO packages)
-- Select: Costela de boi ou costela de porco
-- Repeat pattern for choice_pkg / select_pkg with appropriate labels and additional_items.item_key lookups.
*/
