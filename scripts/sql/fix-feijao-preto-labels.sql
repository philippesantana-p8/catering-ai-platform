-- Corrige rótulos de FEIJÃO PRETO no catálogo mestre, guarnições de pacote e grupos de opção.
-- Company: CDL (65fd576f-8d97-49ba-bf38-61bc1e94e94a)

BEGIN;

-- 1) Corrigir no cadastro mestre de itens
UPDATE public.catalog_items
SET
  item_name = 'FEIJÃO PRETO',
  label_pt = 'FEIJÃO PRETO',
  label_en = COALESCE(NULLIF(label_en, ''), 'BLACK BEANS'),
  label_es = COALESCE(NULLIF(label_es, ''), 'FRIJOLES NEGROS'),
  updated_at = now()
WHERE company_id = '65fd576f-8d97-49ba-bf38-61bc1e94e94a'
  AND (
    item_key = 'ITEM_FEIJAO_PRETO'
    OR upper(trim(item_name)) IN ('FEIJÃO PRETO', 'FEIJAO PRETO')
    OR upper(trim(label_pt)) IN ('FEIJÃO PRETO', 'FEIJAO PRETO')
  );


-- 2) Corrigir nos itens de guarnição vinculados aos pacotes
UPDATE public.package_side_items
SET
  item_name = 'FEIJÃO PRETO',
  label_pt = 'FEIJÃO PRETO',
  label_en = COALESCE(NULLIF(label_en, ''), 'BLACK BEANS'),
  label_es = COALESCE(NULLIF(label_es, ''), 'FRIJOLES NEGROS'),
  updated_at = now()
WHERE company_id = '65fd576f-8d97-49ba-bf38-61bc1e94e94a'
  AND (
    item_key = 'ITEM_FEIJAO_PRETO'
    OR upper(trim(item_name)) IN ('FEIJÃO PRETO', 'FEIJAO PRETO')
    OR upper(trim(label_pt)) IN ('FEIJÃO PRETO', 'FEIJAO PRETO')
  );


-- 3) Corrigir se por acaso aparecer em algum grupo de opção
UPDATE public.package_option_group_items
SET
  label_pt = 'FEIJÃO PRETO',
  label_en = COALESCE(NULLIF(label_en, ''), 'BLACK BEANS'),
  label_es = COALESCE(NULLIF(label_es, ''), 'FRIJOLES NEGROS'),
  updated_at = now()
WHERE company_id = '65fd576f-8d97-49ba-bf38-61bc1e94e94a'
  AND (
    option_item_key = 'feijao_preto'
    OR upper(trim(label_pt)) IN ('FEIJÃO PRETO', 'FEIJAO PRETO')
  );

COMMIT;
