/**
 * Excludes — Field exclusion lists for relation projections.
 *
 * Each array defines which pure fields to exclude when fetching a related
 * document through a relation. Most models exclude createdAt/updatedAt for
 * brevity in nested relations. Some models (user, ware) exclude additional
 * sensitive or large fields (password, price, orderedNumber, etc.).
 *
 * These arrays are referenced by the `excludes` property in relation definitions
 * across all model files to keep relation payloads lean.
 */
export const file_excludes: string[] = [
  "createdAt",
  "updatedAt",
  "size",
];

export const user_excludes: string[] = [
  "createdAt",
  "updatedAt",
  "birth_date",
  "summary",
];

export const shared_relation_excludes: string[] = [
  "createdAt",
  "updatedAt",
  "description",
];

export const organization_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const unit_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const process_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const processStep_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const purchasingRequest_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const state_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const city_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const manufacturer_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const wareType_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const wareClass_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const wareGroup_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const wareModel_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const ware_excludes: string[] = [
  "createdAt",
  "updatedAt",
  "price",
  "orderedNumber",
];

export const stuff_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const store_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const stepApproval_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const purchaseOrderItem_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const tender_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const tenderOffer_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const inventory_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const stockMovement_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const goodsReceipt_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const paymentOrder_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const fiscalYear_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const budgetLine_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const budgetAllocation_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const budgetEncumbrance_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

export const consumptionRecord_excludes: string[] = [
  "createdAt",
  "updatedAt",
];

