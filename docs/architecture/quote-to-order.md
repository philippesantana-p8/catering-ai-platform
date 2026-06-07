# CDL Quote → Order Architecture (future phase)

## Principle

Do **not** convert a quote into an order in the same table. Keep commercial and operational concerns separate.

| Entity | Role |
|--------|------|
| `quotes` | Commercial proposal / priced snapshot |
| `orders` | Confirmed customer order (after approval / reservation paid) |
| `service_orders` | Operational execution of the event |
| `inventory_reservations` | Stock / item reservations for the event |
| `staff_assignments` | Grill masters, assistants, and other crew |

## Target flow

```
quote approved + reservation paid
  → create order from quote (copy snapshot + customer + event refs)
  → create service_order linked to order
  → reserve inventory (inventory_reservations)
  → notify staff (staff_assignments + notifications)
  → complete service_order after event
```

## Document numbering

Numbers are allocated in PostgreSQL via `get_next_document_number(company_id, document_type)`:

| Type | Prefix | Example |
|------|--------|---------|
| `quote` | Q | `Q-2026-000001` |
| `order` | O | `O-2026-000001` |
| `service_order` | SO | `SO-2026-000001` |

App helpers: `getNextQuoteNumber`, `getNextOrderNumber`, `getNextServiceOrderNumber` in `Lib/getNextDocumentNumber.ts`.

SQL: `scripts/sql/document-sequences.sql`

## Implementation notes (TODO)

- [ ] `orders` table: `quote_id`, `customer_id`, `event_id`, status, payment refs
- [ ] `service_orders` table: `order_id`, schedule, venue, operational status
- [ ] `inventory_reservations` table: `service_order_id`, SKU/item, qty, window
- [ ] `staff_assignments` table: `service_order_id`, role, user_id, shift
- [ ] Idempotent “create order from quote” service (no duplicate orders per quote)
- [ ] Quote remains immutable snapshot; order holds commercial confirmation
- [ ] Public customer quote request page reuses `findOrCreateCustomerByPhone`

## Current phase

Quotes may be created with `customer_id` null (draft). Customer linking via phone auto-create is the first step toward self-service requests.
