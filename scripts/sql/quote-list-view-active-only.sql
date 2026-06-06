-- Garante que quote_list_view exponha apenas cotações ativas.
-- Execute no Supabase SQL Editor se a view ainda listar inativas.
--
-- Adicione `AND q.active IS TRUE` (ou `WHERE q.active IS TRUE`) na definição
-- da view, usando o alias da tabela quotes (ex.: q).

-- Exemplo mínimo: recrie a view incluindo o filtro no final do SELECT base.
-- Ajuste joins/colunas conforme a definição atual em produção.

CREATE OR REPLACE VIEW public.quote_list_view AS
SELECT
  q.id,
  q.company_id,
  q.quote_number,
  q.quote_status,
  q.billable_guest_count AS billable_guests,
  q.package_total,
  q.additional_total,
  q.mileage_fee,
  q.quote_total,
  q.reservation_amount,
  q.balance_due,
  q.created_at,
  c.ab_name AS customer_name,
  e.event_name,
  e.event_date,
  e.start_time,
  e.end_time,
  e.city,
  e.state,
  p.package_name,
  p.package_key
FROM public.quotes q
LEFT JOIN public.customers c ON c.id = q.customer_id
LEFT JOIN public.packages p ON p.id = q.package_id
LEFT JOIN public.events e ON e.id = q.event_id
WHERE q.active IS TRUE;
