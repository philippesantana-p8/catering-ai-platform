-- Multi-tenant SaaS foundation: franchise groups, companies, branches,
-- memberships, subscriptions, audit logs, feature flags, branch_id on core tables.
-- Idempotent — run in Supabase SQL Editor after existing catalog migrations.

-- ---------------------------------------------------------------------------
-- Franchise Group / Brand
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.franchise_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Companies (tenant / billing unit) — extend existing table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS franchise_group_id uuid REFERENCES public.franchise_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS default_language text DEFAULT 'pt',
  ADD COLUMN IF NOT EXISTS default_timezone text DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS google_calendar_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_calendar_id text,
  ADD COLUMN IF NOT EXISTS google_calendar_timezone text DEFAULT 'America/New_York';

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug
  ON public.companies (slug)
  WHERE slug IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Branches (operational unit inside a company)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  branch_code text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  timezone text,
  phone text,
  email text,
  google_calendar_enabled boolean DEFAULT false,
  google_calendar_id text,
  service_radius_miles numeric,
  mileage_fee_per_mile numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_branches_company
  ON public.branches (company_id, active);

-- ---------------------------------------------------------------------------
-- Subscriptions (billing per company)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  included_branches integer NOT NULL DEFAULT 1,
  extra_branch_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);

-- ---------------------------------------------------------------------------
-- Memberships (user ↔ company ↔ optional branch)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'operator',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_memberships_user
  ON public.company_memberships (user_id, active);

-- user_id references auth.users(id) when Supabase Auth is enabled.

-- ---------------------------------------------------------------------------
-- Feature flags (per company)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, feature_key)
);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created
  ON public.audit_logs (company_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- branch_id on operational / catalog tables (nullable = company-wide)
-- ---------------------------------------------------------------------------
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.additional_items
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.commercial_rules
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.package_items
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.package_side_items
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.package_option_groups
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- quotes calendar sync (may exist from prior migration)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS google_calendar_event_id text,
  ADD COLUMN IF NOT EXISTS calendar_sync_status text DEFAULT 'not_synced',
  ADD COLUMN IF NOT EXISTS calendar_synced_at timestamptz;

-- ---------------------------------------------------------------------------
-- CDL pilot seed (replace company UUID if needed)
-- ---------------------------------------------------------------------------
/*
INSERT INTO public.franchise_groups (id, name, slug)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'CDL BBQ Network',
  'cdl-bbq-network'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.companies (id, franchise_group_id, name, trade_name, slug, default_currency, default_language, default_timezone, subscription_status, active)
VALUES (
  '65fd576f-8d97-49ba-bf38-61bc1e94e94a',
  'a0000000-0000-4000-8000-000000000001',
  'CDL Services BBQ at Home',
  'CDL Orlando',
  'cdl-orlando',
  'USD',
  'pt',
  'America/New_York',
  'active',
  true
)
ON CONFLICT (id) DO UPDATE SET
  franchise_group_id = EXCLUDED.franchise_group_id,
  trade_name = EXCLUDED.trade_name,
  slug = EXCLUDED.slug,
  updated_at = now();

INSERT INTO public.branches (company_id, name, slug, branch_code, city, state, country, timezone, active)
VALUES (
  '65fd576f-8d97-49ba-bf38-61bc1e94e94a',
  'Orlando Main',
  'orlando-main',
  'ORL-01',
  'Orlando',
  'FL',
  'US',
  'America/New_York',
  true
)
ON CONFLICT (company_id, slug) DO NOTHING;

INSERT INTO public.subscriptions (company_id, plan_name, monthly_price, currency, included_branches, extra_branch_price, status)
VALUES (
  '65fd576f-8d97-49ba-bf38-61bc1e94e94a',
  'Founder',
  300,
  'USD',
  1,
  100,
  'active'
)
ON CONFLICT (company_id) DO UPDATE SET plan_name = EXCLUDED.plan_name;

INSERT INTO public.feature_flags (company_id, feature_key, enabled)
SELECT '65fd576f-8d97-49ba-bf38-61bc1e94e94a', f.feature_key, f.enabled
FROM (VALUES
  ('customer_portal', false),
  ('pdf_generation', true),
  ('google_calendar', false),
  ('inventory', false),
  ('ai_quote_assistant', true),
  ('multilingual_customer_view', true),
  ('advanced_rules', true),
  ('branch_management', false)
) AS f(feature_key, enabled)
ON CONFLICT (company_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;
*/
