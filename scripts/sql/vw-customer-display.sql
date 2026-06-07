-- View única para exibição de cliente (Address Book / CRM CDL).
-- Espelha a mesma ordem de fallback de Lib/getCustomerDisplayName.ts.
-- Execute no Supabase SQL Editor antes de atualizar quote_list_view / quote_detail_view.

CREATE OR REPLACE VIEW public.vw_customer_display AS
SELECT
  c.id,
  c.company_id,
  c.ab_number,
  c.ab_name,
  c.ab_type,
  c.phone,
  c.email,
  c.full_name,
  c.contact_name,
  c.company_name,
  c.address,
  c.address_line,
  c.city,
  c.state,
  c.postal_code,
  c.country,
  c.customer_type,
  c.address_book_role,
  c.active,
  c.created_at,
  c.updated_at,
  NULLIF(
    BTRIM(
      COALESCE(
        c.ab_name,
        c.full_name,
        c.contact_name,
        c.company_name,
        c.email,
        c.phone::text
      )
    ),
    ''
  ) AS customer_display_name
FROM public.customers c;

COMMENT ON VIEW public.vw_customer_display IS
  'Nome de exibição único por cliente. Ordem: ab_name, full_name, contact_name, company_name, email, phone.';

GRANT SELECT ON public.vw_customer_display TO authenticated;
GRANT SELECT ON public.vw_customer_display TO service_role;
