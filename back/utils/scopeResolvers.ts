import { ObjectId } from "lesan";
import {
  budgetLine,
  fiscalYear,
  inventory,
  organization,
  process,
  processStep,
  store,
  stuff,
  unit,
} from "../mod.ts";
import type { ScopeRef } from "./authzPolicy.ts";
import { getAuth } from "./grantAccess.ts";
import type { GrantBody, ScopeResolver } from "./grantAccess.ts";

type Document = Record<string, unknown> | null | undefined;

const setOf = (body: GrantBody): Record<string, unknown> =>
  body?.details?.set ?? {};

const toObjectId = (value: unknown): ObjectId | null => {
  if (value === null || value === undefined || value === "") return null;

  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
};

const relationId = (doc: Document, field: string): string | null => {
  const relation = doc?.[field] as { _id?: unknown } | null | undefined;
  const id = relation?._id;

  return id === null || id === undefined ? null : String(id);
};

const documentId = (doc: Document): string | null => {
  const id = doc?._id;

  return id === null || id === undefined ? null : String(id);
};

const organizationScope = (id: unknown): ScopeRef | null =>
  id === null || id === undefined || id === ""
    ? null
    : { scopeType: "organization", scopeId: String(id) };

const unitScope = (id: unknown): ScopeRef | null =>
  id === null || id === undefined || id === ""
    ? null
    : { scopeType: "unit", scopeId: String(id) };

const storeScope = (id: unknown): ScopeRef | null =>
  id === null || id === undefined || id === ""
    ? null
    : { scopeType: "store", scopeId: String(id) };

export const roleScope = (): ScopeResolver => async () => {
  const { activeRole } = await getAuth();

  if (!activeRole.scopeType || !activeRole.scopeId) return null;

  return {
    scopeType: activeRole.scopeType,
    scopeId: String(activeRole.scopeId),
  };
};

export const orgFromSet = (field: string): ScopeResolver => async (body) => {
  const organizationId = toObjectId(setOf(body)[field]);
  if (!organizationId) return null;

  const org = await organization.findOne({
    filters: { _id: organizationId },
    projection: { _id: 1 },
  }) as Document;

  return org ? organizationScope(documentId(org)) : null;
};

export const orgOfSelf = (): ScopeResolver => orgFromSet("_id");

export const orgOfNewUnit = (): ScopeResolver => async (body) => {
  const set = setOf(body);
  const parentUnitId = toObjectId(set.parentUnitId);

  if (parentUnitId) {
    const parentUnit = await unit.findOne({
      filters: { _id: parentUnitId },
      projection: { organization: { _id: 1 } },
    }) as Document;

    return organizationScope(relationId(parentUnit, "organization"));
  }

  return orgFromSet("organizationId")(body, null);
};

export const unitFromSet = (field: string): ScopeResolver => async (body) => {
  const unitId = toObjectId(setOf(body)[field]);
  if (!unitId) return null;

  const unitDoc = await unit.findOne({
    filters: { _id: unitId },
    projection: { _id: 1 },
  }) as Document;

  return unitDoc ? unitScope(documentId(unitDoc)) : null;
};

export const orgOfUnit = (): ScopeResolver => async (body) => {
  const unitId = toObjectId(setOf(body)._id);
  if (!unitId) return null;

  const unitDoc = await unit.findOne({
    filters: { _id: unitId },
    projection: { organization: { _id: 1 } },
  }) as Document;

  return organizationScope(relationId(unitDoc, "organization"));
};

export const orgOfProcess = (): ScopeResolver => async (body) => {
  const processId = toObjectId(setOf(body)._id);
  if (!processId) return null;

  const processDoc = await process.findOne({
    filters: { _id: processId },
    projection: { organization: { _id: 1 } },
  }) as Document;

  return organizationScope(relationId(processDoc, "organization"));
};

export const orgOfProcessInSet =
  (field: string): ScopeResolver => async (body) => {
    const processId = toObjectId(setOf(body)[field]);
    if (!processId) return null;

    const processDoc = await process.findOne({
      filters: { _id: processId },
      projection: { organization: { _id: 1 } },
    }) as Document;

    return organizationScope(relationId(processDoc, "organization"));
  };

export const orgOfProcessStep = (): ScopeResolver => async (body) => {
  const stepId = toObjectId(setOf(body)._id);
  if (!stepId) return null;

  const step = await processStep.findOne({
    filters: { _id: stepId },
    projection: { process: { _id: 1 } },
  }) as Document;

  const processId = relationId(step, "process");
  if (!processId) return null;

  const processDoc = await process.findOne({
    filters: { _id: new ObjectId(processId) },
    projection: { organization: { _id: 1 } },
  }) as Document;

  return organizationScope(relationId(processDoc, "organization"));
};

export const orgOfInventory = (): ScopeResolver => async (body) => {
  const inventoryId = toObjectId(setOf(body)._id);
  if (!inventoryId) return null;

  const inventoryDoc = await inventory.findOne({
    filters: { _id: inventoryId },
    projection: { unit: { _id: 1 } },
  }) as Document;

  const unitId = relationId(inventoryDoc, "unit");
  if (!unitId) return null;

  const unitDoc = await unit.findOne({
    filters: { _id: new ObjectId(unitId) },
    projection: { organization: { _id: 1 } },
  }) as Document;

  return organizationScope(relationId(unitDoc, "organization"));
};

export const unitOfInventory = (): ScopeResolver => async (body) => {
  const inventoryId = toObjectId(setOf(body)._id);
  if (!inventoryId) return null;

  const inventoryDoc = await inventory.findOne({
    filters: { _id: inventoryId },
    projection: { unit: { _id: 1 } },
  }) as Document;

  return unitScope(relationId(inventoryDoc, "unit"));
};

export const storeOfStuff = (): ScopeResolver => async (body) => {
  const stuffId = toObjectId(setOf(body)._id);
  if (!stuffId) return null;

  const stuffDoc = await stuff.findOne({
    filters: { _id: stuffId },
    projection: { store: { _id: 1 } },
  }) as Document;

  const storeId = relationId(stuffDoc, "store");

  return storeId ? { scopeType: "store", scopeId: storeId } : null;
};

export const storeOfSelf = (): ScopeResolver => async (body) => {
  const storeId = toObjectId(setOf(body)._id);
  if (!storeId) return null;

  const storeDoc = await store.findOne({
    filters: { _id: storeId },
    projection: { _id: 1 },
  }) as Document;

  return storeDoc ? storeScope(documentId(storeDoc)) : null;
};

export const orgOfBudgetLine = (): ScopeResolver => async (body) => {
  const budgetLineId = toObjectId(setOf(body)._id);
  if (!budgetLineId) return null;

  const budgetLineDoc = await budgetLine.findOne({
    filters: { _id: budgetLineId },
    projection: { organization: { _id: 1 } },
  }) as Document;

  return organizationScope(relationId(budgetLineDoc, "organization"));
};

export const orgOfFiscalYear = (): ScopeResolver => async (body) => {
  const fiscalYearId = toObjectId(setOf(body)._id);
  if (!fiscalYearId) return null;

  const fiscalYearDoc = await fiscalYear.findOne({
    filters: { _id: fiscalYearId },
    projection: { organization: { _id: 1 } },
  }) as Document;

  return organizationScope(relationId(fiscalYearDoc, "organization"));
};
