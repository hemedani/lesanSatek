# Plan: Shift Inventory from wareModel-based to ware-based

## Rationale
Each WareModel can have multiple Wares (different brands/variants). Inventory should track specific wares, not just ware models. The hierarchy (wareType, wareClass, wareGroup, wareModel) is derived from the Ware.

## Files to Modify

### 1. `models/inventory.ts` — Add hierarchy relations + change unique index
- Add `wareType`, `wareClass`, `wareGroup` relations (required, derived from ware)
- Change unique index from `{ unit: 1, "wareModel._id": 1 }` to `{ unit: 1, "ware._id": 1 }`

### 2. `models/stockMovement.ts` — Add hierarchy relations for stats
- Add `wareType`, `wareClass`, `wareGroup` relations (optional, derived from ware)

### 3. `models/consumptionRecord.ts` — Add hierarchy relations for stats
- Add `wareType`, `wareClass`, `wareGroup` relations (optional, derived from ware)

### 4. `src/inventory/add/` — New ware-based add endpoint
- **`add.val.ts`**: Replace `wareModelId` with `wareId` (required). Remove `wareModelId`
- **`add.fn.ts`**: Fetch Ware to derive hierarchy; check uniqueness by `(unit, ware._id)`

### 5. `utils/inventoryManager.ts` — Central utility overhaul
- **`addStock()`**: Accept `wareId`, fetch ware for hierarchy, build all 4 relations
- **`removeStock()`**: Accept `wareId`, query by `ware._id`
- **`transferStock()`**: Accept `wareId`
- **`getStockLevel()`**: Query by `ware._id`
- **`getWarehouseDashboard()`**: Support both `wareId` and `wareModelId` filters

### 6. `src/goodsReceipt/add/` — Pass wareId to addStock
- Items still have `wareModelId` in pure fields, but pass `wareId` as primary to `addStock()`

### 7. `src/consumptionRecord/add/` — Use wareId + hierarchy
- Fetch ware to build hierarchy relations; pass `wareId` to `removeStock()`

### 8. `src/inventory/transfer/` — Use wareId
- Change `wareModelId` → `wareId` in val + fn

### 9. `src/inventory/gets/` and `count/` — Add wareId filter
- Add optional `wareId` filter alongside `wareModelId`

### 10. `src/stockMovement/gets/` and `count/` — Add wareId filter
- Add optional `wareId` filter alongside `wareModelId`

### 11. E2E test files — Update inventory add/transfer steps

## Key Design Decisions
| Decision | Choice |
|----------|--------|
| Unique constraint | `(unit, ware._id)` |
| `wareModel` on inventory | Still required, auto-derived from ware |
| `wareType/Class/Group` on inventory | New required relations, auto-derived from ware |
| `getWarehouseDashboard` | Keep `wareModelId` filter for PR warehouse check backward compat |
| Inventory `update`/`updateRelations`/`adjust` | No change needed (work with `_id`) |

## Migration Concern
Existing records lack new hierarchy relations and have old index. A one-time migration script would be needed.
