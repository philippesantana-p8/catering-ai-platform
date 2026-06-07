-- Desativa duplicados ativos com mesmo company_id + phone_normalized.
-- Mantém o registro com mais dados preenchidos; em empate, o mais antigo.
-- Não remove fisicamente — apenas active = false.
--
-- Pré-requisito: scripts/sql/customers-phone-normalized.sql

UPDATE public.customers
SET phone_normalized = regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
WHERE phone IS NOT NULL
  AND (
    phone_normalized IS NULL
    OR btrim(phone_normalized) = ''
  );

WITH scored AS (
  SELECT
    id,
    company_id,
    phone_normalized,
    (
      (CASE WHEN ab_name IS NOT NULL AND btrim(ab_name) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN full_name IS NOT NULL AND btrim(full_name) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN contact_name IS NOT NULL AND btrim(contact_name) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN email IS NOT NULL AND btrim(email) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN ab_number IS NOT NULL AND btrim(ab_number) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN city IS NOT NULL AND btrim(city) <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN state IS NOT NULL AND btrim(state) <> '' THEN 1 ELSE 0 END)
    ) AS data_score,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY company_id, phone_normalized
      ORDER BY
        (
          (CASE WHEN ab_name IS NOT NULL AND btrim(ab_name) <> '' THEN 1 ELSE 0 END) +
          (CASE WHEN full_name IS NOT NULL AND btrim(full_name) <> '' THEN 1 ELSE 0 END) +
          (CASE WHEN contact_name IS NOT NULL AND btrim(contact_name) <> '' THEN 1 ELSE 0 END) +
          (CASE WHEN email IS NOT NULL AND btrim(email) <> '' THEN 1 ELSE 0 END) +
          (CASE WHEN ab_number IS NOT NULL AND btrim(ab_number) <> '' THEN 1 ELSE 0 END) +
          (CASE WHEN city IS NOT NULL AND btrim(city) <> '' THEN 1 ELSE 0 END) +
          (CASE WHEN state IS NOT NULL AND btrim(state) <> '' THEN 1 ELSE 0 END)
        ) DESC,
        created_at ASC NULLS LAST,
        id ASC
    ) AS rn
  FROM public.customers
  WHERE active IS TRUE
    AND phone_normalized IS NOT NULL
    AND btrim(phone_normalized) <> ''
)
UPDATE public.customers AS c
SET
  active = false,
  updated_at = now()
FROM scored AS s
WHERE c.id = s.id
  AND s.rn > 1;
