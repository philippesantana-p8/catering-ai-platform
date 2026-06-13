/**
 * @deprecated Use `@/Lib/catalogItemsTableSchema` — tabela física: `public.catalog_items`.
 */
export {
  CATALOG_ITEMS_TABLE,
  CATALOG_ITEMS_TABLE_COLUMNS,
  CATALOG_ITEMS_INSERT_COLUMNS,
  CATALOG_ITEMS_LIST_COLUMNS,
  buildCatalogItemsListSelect,
  pickCatalogItemsInsertPayload,
  pickCatalogItemsUpdatePayload,
  type CatalogItemsTableColumn,
  type CatalogItemsInsertColumn,
  type CatalogItemsInsertPayload,
} from '@/Lib/catalogItemsTableSchema'

export {
  CATALOG_ITEMS_TABLE_COLUMNS as ADDITIONAL_ITEMS_TABLE_COLUMNS,
  CATALOG_ITEMS_INSERT_COLUMNS as ADDITIONAL_ITEMS_INSERT_COLUMNS,
  CATALOG_ITEMS_LIST_COLUMNS as ADDITIONAL_ITEMS_LIST_COLUMNS,
  buildCatalogItemsListSelect as buildAdditionalItemsListSelect,
  pickCatalogItemsInsertPayload as pickAdditionalItemsInsertPayload,
  pickCatalogItemsUpdatePayload as pickAdditionalItemsUpdatePayload,
  type CatalogItemsTableColumn as AdditionalItemsTableColumn,
  type CatalogItemsInsertColumn as AdditionalItemsInsertColumn,
  type CatalogItemsInsertPayload as AdditionalItemsInsertPayload,
} from '@/Lib/catalogItemsTableSchema'
