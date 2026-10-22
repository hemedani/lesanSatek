import { type Document, ObjectId } from "lesan";
import { type ActiveRole, isManagerLike } from "./authzPolicy.ts";
import type { ScopeUser } from "./readScope.ts";
import { throwError } from "./throwError.ts";

type UserWithId = ScopeUser & { _id?: unknown };

export type FinanceScopeUnit = {
  type?: unknown;
  organization?: { _id?: unknown } | null;
};

export type FinanceScopeOptions = {
  loadUnit?: (unitId: string) => Promise<FinanceScopeUnit | null>;
};

export type PaymentOrderReadDoc = {
  purchasingRequest?: { organization?: { _id?: unknown } | null } | null;
  financialUnit?: { _id?: unknown } | null;
};

export type BudgetLineReadDoc = {
  organization?: { _id?: unknown } | null;
  unit?: { _id?: unknown } | null;
};

export type FiscalYearReadDoc = {
  organization?: { _id?: unknown } | null;
};

export type GoodsReceiptReadDoc = {
  purchasingRequest?: { organization?: { _id?: unknown } | null } | null;
};

export type BudgetLineChildReadDoc = {
  budgetLine?: { organization?: { _id?: unknown } | null } | null;
};

type CoreAppModule = {
  unit: {
    findOne: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

const CORE_APP_MODULE = "../mod.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

const toObjectId = (value: unknown): ObjectId | null => {
  const normalized = normalizeId(value);
  if (!normalized) return null;

  try {
    return new ObjectId(normalized);
  } catch {
    return null;
  }
};

const emptyMatch = (): Document => ({ _id: { $in: [] } });

const loadUnitFromDb = async (
  unitId: string,
): Promise<FinanceScopeUnit | null> => {
  const objectId = toObjectId(unitId);
  if (!objectId) return null;

  const { unit } = await import(CORE_APP_MODULE) as CoreAppModule;

  return await unit.findOne({
    filters: { _id: objectId },
    projection: { _id: 1, type: 1, organization: { _id: 1 } },
  }) as FinanceScopeUnit | null;
};

const loadUnit = async (
  unitId: string,
  options: FinanceScopeOptions,
): Promise<FinanceScopeUnit | null> => {
  const loader = options.loadUnit ?? loadUnitFromDb;

  try {
    return await loader(unitId);
  } catch {
    return null;
  }
};

const isBypass = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
): boolean => Boolean(user?.isGhost) || isManagerLike(activeRole);

export const isFinanceUnitHead = async (
  activeRole: ActiveRole,
  options: FinanceScopeOptions = {},
): Promise<boolean> => {
  if (
    activeRole.name !== "UnitHead" ||
    activeRole.scopeType !== "unit" ||
    !activeRole.scopeId
  ) {
    return false;
  }

  if (options.loadUnit) {
    const unitId = normalizeId(activeRole.scopeId);
    if (!unitId) return false;

    const unitDoc = await loadUnit(unitId, options);

    return unitDoc?.type === "Finance";
  }

  const { isFinanceUnitHead: checkFinanceUnitHead } = await import(
    "./checkFinanceUnitAccess.ts"
  );

  return await checkFinanceUnitHead(activeRole);
};

export const unitOrganizationId = async (
  unitId: unknown,
  options: FinanceScopeOptions = {},
): Promise<string | null> => {
  const normalizedUnitId = normalizeId(unitId);
  if (!normalizedUnitId) return null;

  const unitDoc = await loadUnit(normalizedUnitId, options);
  const organizationId = normalizeId(unitDoc?.organization?._id);

  return toObjectId(organizationId) ? organizationId : null;
};

export const activeFinanceOrganizationId = async (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  options: FinanceScopeOptions = {},
): Promise<string | null> => {
  if (isBypass(activeRole, user)) return null;

  if (activeRole.name === "OrgHead") {
    if (activeRole.scopeType !== "organization") return null;

    const scopeId = normalizeId(activeRole.scopeId);

    return toObjectId(scopeId) ? scopeId : null;
  }

  if (activeRole.name === "UnitHead") {
    if (!(await isFinanceUnitHead(activeRole, options))) return null;

    return await unitOrganizationId(activeRole.scopeId, options);
  }

  return null;
};

export const paymentOrderReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  financeOrganizationId: string | null,
): Document | null => {
  if (isBypass(activeRole, user)) return null;

  const organizationId = toObjectId(financeOrganizationId);
  if (!organizationId) return emptyMatch();

  const clauses: Document[] = [{
    "purchasingRequest.organization._id": { $in: [organizationId] },
  }];

  if (activeRole.name === "UnitHead") {
    const unitId = toObjectId(activeRole.scopeId);
    if (!unitId) return emptyMatch();

    clauses.push({ "financialUnit._id": { $in: [unitId] } });
  }

  return clauses.length === 1 ? clauses[0] : { $or: clauses };
};

const organizationReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  financeOrganizationId: string | null,
  field: string,
): Document | null => {
  if (isBypass(activeRole, user)) return null;

  const organizationId = toObjectId(financeOrganizationId);
  if (!organizationId) return emptyMatch();

  return { [field]: { $in: [organizationId] } };
};

export const budgetLineReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  financeOrganizationId: string | null,
): Document | null =>
  organizationReadMatch(
    activeRole,
    user,
    financeOrganizationId,
    "organization._id",
  );

export const fiscalYearReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  financeOrganizationId: string | null,
): Document | null =>
  organizationReadMatch(
    activeRole,
    user,
    financeOrganizationId,
    "organization._id",
  );

export const budgetEncumbranceReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  financeOrganizationId: string | null,
): Document | null =>
  organizationReadMatch(
    activeRole,
    user,
    financeOrganizationId,
    "budgetLine.organization._id",
  );

export const budgetAllocationReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  financeOrganizationId: string | null,
): Document | null =>
  organizationReadMatch(
    activeRole,
    user,
    financeOrganizationId,
    "budgetLine.organization._id",
  );

export const goodsReceiptReadMatch = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  financeOrganizationId: string | null,
): Document | null =>
  organizationReadMatch(
    activeRole,
    user,
    financeOrganizationId,
    "purchasingRequest.organization._id",
  );

export const assertCanReadPaymentOrder = async (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  doc: PaymentOrderReadDoc | null | undefined,
  financeOrganizationId: string | null,
  options: FinanceScopeOptions = {},
): Promise<void> => {
  if (isBypass(activeRole, user)) return;

  const organizationId = toObjectId(financeOrganizationId);
  const documentOrganizationId = toObjectId(
    doc?.purchasingRequest?.organization?._id,
  );

  if (
    organizationId && documentOrganizationId &&
    organizationId.equals(documentOrganizationId)
  ) {
    return;
  }

  if (
    activeRole.name === "UnitHead" &&
    await isFinanceUnitHead(activeRole, options)
  ) {
    const financeUnitOrganizationId = toObjectId(
      await unitOrganizationId(activeRole.scopeId, options),
    );

    if (
      financeUnitOrganizationId && documentOrganizationId &&
      financeUnitOrganizationId.equals(documentOrganizationId)
    ) {
      return;
    }
  }

  throwError("You cant do this");
};

const assertOrganizationDocument = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  documentOrganizationId: unknown,
  financeOrganizationId: string | null,
): void => {
  if (isBypass(activeRole, user)) return;

  const organizationId = toObjectId(financeOrganizationId);
  const organizationOfDocument = toObjectId(documentOrganizationId);

  if (
    organizationId && organizationOfDocument &&
    organizationId.equals(organizationOfDocument)
  ) {
    return;
  }

  throwError("You cant do this");
};

export const assertCanReadBudgetLine = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  doc: BudgetLineReadDoc | null | undefined,
  financeOrganizationId: string | null,
): void =>
  assertOrganizationDocument(
    activeRole,
    user,
    doc?.organization?._id,
    financeOrganizationId,
  );

export const assertCanReadFiscalYear = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  doc: FiscalYearReadDoc | null | undefined,
  financeOrganizationId: string | null,
): void =>
  assertOrganizationDocument(
    activeRole,
    user,
    doc?.organization?._id,
    financeOrganizationId,
  );

export const assertCanReadGoodsReceipt = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  doc: GoodsReceiptReadDoc | null | undefined,
  financeOrganizationId: string | null,
): void =>
  assertOrganizationDocument(
    activeRole,
    user,
    doc?.purchasingRequest?.organization?._id,
    financeOrganizationId,
  );

export const assertCanReadBudgetEncumbrance = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  doc: BudgetLineChildReadDoc | null | undefined,
  financeOrganizationId: string | null,
): void =>
  assertOrganizationDocument(
    activeRole,
    user,
    doc?.budgetLine?.organization?._id,
    financeOrganizationId,
  );

export const assertCanReadBudgetAllocation = (
  activeRole: ActiveRole,
  user: UserWithId | undefined,
  doc: BudgetLineChildReadDoc | null | undefined,
  financeOrganizationId: string | null,
): void =>
  assertOrganizationDocument(
    activeRole,
    user,
    doc?.budgetLine?.organization?._id,
    financeOrganizationId,
  );
