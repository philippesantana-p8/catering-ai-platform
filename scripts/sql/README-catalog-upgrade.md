# Upgrade premium do catálogo (futuro)

O app usa **apenas** as colunas reais confirmadas no Supabase.
Os scripts abaixo são opcionais para uma migration futura — não são necessários para o app funcionar.

## Colunas reais hoje

### packages
`id`, `company_id`, `package_name`, `price_per_person`, `description`, `active`, `created_at`, `package_key`, `label_pt`, `label_en`, `label_es`, `description_pt`, `description_en`, `description_es`, `display_order`, `image_url`, `currency_code`, `image_status`, `image_notes`, `updated_at`

### additional_items
`id`, `company_id`, `item_name`, `price`, `charge_type`, `unit_label`, `active`, `created_at`, `item_key`, `label_pt`, `label_en`, `label_es`, `category_key`, `category_pt`, `category_en`, `category_es`, `quantity`, `unit`, `quantity_2`, `uom_2`, `pricing_type`, `image_url`, `image_status`, `image_notes`, `currency_code`, `display_order`, `updated_at`

## Migrations futuras (opcional)

1. `packages-catalog-upgrade.sql` — itens/guarnições separados, custo, margem, inventário
2. `additional-items-catalog-upgrade.sql` — custo, margem, descrições, inventário

Após executar, atualizar `Lib/packagesTableSchema.ts` e `Lib/additionalItemsTableSchema.ts`.
