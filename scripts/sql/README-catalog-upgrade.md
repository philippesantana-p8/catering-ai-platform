# Upgrade premium do catálogo (Pacotes + Itens adicionais)

O app funciona **sem** estas migrations. Os SELECTs usam apenas colunas deployadas.
Depois de executar os SQL abaixo no Supabase, atualize `PACKAGES_LIST_COLUMNS` /
`ADDITIONAL_ITEMS_LIST_COLUMNS` e `*_INSERT_COLUMNS` em `Lib/*TableSchema.ts` para incluir os novos campos.

## Ordem sugerida

1. `packages-catalog-upgrade.sql`
2. `additional-items-catalog-upgrade.sql`

## Pacotes — campos futuros

- `items_description_pt`, `items_description_en`, `items_description_es`
- `garnish_description_pt`, `garnish_description_en`, `garnish_description_es`
- `card_description_pt`, `card_description_en`, `card_description_es`
- `package_type`, `base_package_code`, `has_garnish`
- `garnish_price_per_person`, `cost_per_person`, `margin_percent`, `inventory_enabled`

Enquanto não existirem, o app usa `description_pt` para itens do pacote e infere guarnições pelo código (`+`).

## Itens adicionais — campos futuros

- `category_group`, `description_pt`, `description_en`, `description_es`
- `cost`, `margin_percent`, `inventory_enabled`, `inventory_item_id`
- `supplier_name`, `internal_notes`

Enquanto não existirem, a cascata usa `category_pt` e margem/custo são calculados só na UI do formulário.
