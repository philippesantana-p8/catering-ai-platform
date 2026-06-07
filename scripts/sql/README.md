# SQL migrations (Supabase SQL Editor)

Scripts idempotentes para rodar manualmente no Supabase. Reexecutar é seguro.

## Customers — telefone normalizado e deduplicação

Ordem recomendada (duplicatas ativas impedem o índice único):

1. **`customers-phone-normalized.sql` steps 1–2** — coluna `phone_normalized` + backfill.
2. **`dedupe-customers-by-phone.sql`** — desativa duplicados ativos (`active = false`).
3. **`customers-phone-normalized.sql` step 3** — índice único parcial.

`dedupe-customers-by-phone.sql` repete coluna/backfill se necessário. A ordenação de empate usa `created_at` quando presente; caso contrário `updated_at` ou `id`.

Se não houver duplicatas ativas, pode rodar `customers-phone-normalized.sql` inteiro de uma vez.

## Regras comerciais

- **`commercial-rules-key-value.sql`** — independente; cria `commercial_rules`, colunas faltantes, índice parcial e seeds padrão (`quote_validity_days = 7`). Seeds só entram se `rule_key` ainda não existir.

## Outros scripts

| Script | Propósito |
|--------|-----------|
| `document-sequences.sql` | Numeração de documentos |
| `patch-document-sequences-customer.sql` | Tipo `customer` (AB000001) |
| `vw-customer-display.sql` | View de nome de exibição |
| `quote-list-view-active-only.sql` | View de listagem de cotações |
