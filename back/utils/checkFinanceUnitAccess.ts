import { ObjectId } from "lesan";
import {
  budgetAllocation,
  budgetEncumbrance,
  budgetLine,
  fiscalYear,
  paymentOrder,
  purchasingRequest,
  unit,
} from "../mod.ts";
import { isManagerLike } from "./authzPolicy.ts";
import { getAuth } from "./grantAccess.ts";
import { throwError } from "./throwError.ts";

type Document = Record<string, unknown> | null | undefined;

export type FinanceTarget = {
  organizationId?: string | null;
  unitId?: string | null;
};

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

const normalizeTargetValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === "") return undefined;

  return String(value);
};

const loadUnit = async (id: unknown): Promise<Document> => {
  const unitId = toObjectId(id);
  if (!unitId) return null;

  return await unit.findOne({
    filters: { _id: unitId },
    projection: { _id: 1, type: 1, organization: { _id: 1 } },
  }) as Document;
};

export const financeTargetOfBudgetLine = async (
  id: unknown,
): Promise<FinanceTarget | null> => {
  const budgetLineId = toObjectId(id);
  if (!budgetLineId) return null;

  const budgetLineDoc = await budgetLine.findOne({
    filters: { _id: budgetLineId },
    projection: { organization: { _id: 1 }, unit: { _id: 1 } },
  }) as Document;

  if (!budgetLineDoc) return null;

  return {
    organizationId: relationId(budgetLineDoc, "organization"),
    unitId: relationId(budgetLineDoc, "unit"),
  };
};

export const financeTargetOfBudgetAllocation = async (
  id: unknown,
): Promise<FinanceTarget | null> => {
  const allocationId = toObjectId(id);
  if (!allocationId) return null;

  const allocation = await budgetAllocation.findOne({
    filters: { _id: allocationId },
    projection: { budgetLine: { _id: 1 } },
  }) as Document;

  return financeTargetOfBudgetLine(relationId(allocation, "budgetLine"));
};

export const financeTargetOfBudgetEncumbrance = async (
  id: unknown,
): Promise<FinanceTarget | null> => {
  const encumbranceId = toObjectId(id);
  if (!encumbranceId) return null;

  const encumbrance = await budgetEncumbrance.findOne({
    filters: { _id: encumbranceId },
    projection: { budgetLine: { _id: 1 } },
  }) as Document;

  return financeTargetOfBudgetLine(relationId(encumbrance, "budgetLine"));
};

export const financeTargetOfFiscalYear = async (
  id: unknown,
): Promise<FinanceTarget | null> => {
  const fiscalYearId = toObjectId(id);
  if (!fiscalYearId) return null;

  const fiscalYearDoc = await fiscalYear.findOne({
    filters: { _id: fiscalYearId },
    projection: { organization: { _id: 1 } },
  }) as Document;

  if (!fiscalYearDoc) return null;

  return { organizationId: relationId(fiscalYearDoc, "organization") };
};

export const financeTargetOfPaymentOrder = async (
  id: unknown,
): Promise<FinanceTarget | null> => {
  const paymentOrderId = toObjectId(id);
  if (!paymentOrderId) return null;

  const order = await paymentOrder.findOne({
    filters: { _id: paymentOrderId },
    projection: { purchasingRequest: { _id: 1 } },
  }) as Document;

  return financeTargetOfPurchasingRequestBudget(
    relationId(order, "purchasingRequest"),
  );
};

export const financeTargetOfPurchasingRequestBudget = async (
  id: unknown,
): Promise<FinanceTarget | null> => {
  const requestId = toObjectId(id);
  if (!requestId) return null;

  const request = await purchasingRequest.findOne({
    filters: { _id: requestId },
    projection: { budgetLine: { _id: 1 } },
  }) as Document;

  return financeTargetOfBudgetLine(relationId(request, "budgetLine"));
};

const assertFinanceUnitType = async (
  activeRole: {
    scopeType?: string;
    scopeId?: string;
  },
): Promise<string> => {
  if (activeRole.scopeType !== "unit" || !activeRole.scopeId) {
    throwError("Finance unit head must have a unit scope");
  }

  const unitDoc = await loadUnit(activeRole.scopeId);

  if (!unitDoc || unitDoc.type !== "Finance") {
    throwError(
      "Only the head of a Finance unit can manage budgets and payments",
    );
  }

  return String(activeRole.scopeId);
};

const checkOrgHeadTarget = async (
  activeRole: { scopeType?: string; scopeId?: string },
  target: FinanceTarget,
) => {
  if (activeRole.scopeType !== "organization" || !activeRole.scopeId) {
    throwError("You cant do this");
  }

  let targetOrganizationId = normalizeTargetValue(target.organizationId);

  if (!targetOrganizationId && target.unitId) {
    const targetUnit = await loadUnit(target.unitId);
    targetOrganizationId = relationId(targetUnit, "organization") ?? undefined;
  }

  if (
    !targetOrganizationId || targetOrganizationId !== String(activeRole.scopeId)
  ) {
    throwError("You cant do this");
  }
};

const checkUnitHeadTarget = async (
  activeRole: { scopeType?: string; scopeId?: string },
  target: FinanceTarget,
) => {
  const activeUnitId = await assertFinanceUnitType(activeRole);
  const activeUnit = await loadUnit(activeUnitId);
  const activeOrganizationId = relationId(activeUnit, "organization");

  const targetUnitId = normalizeTargetValue(target.unitId);
  const targetOrganizationId = normalizeTargetValue(target.organizationId);

  if (targetUnitId && targetUnitId === activeUnitId) return;

  if (
    targetOrganizationId &&
    activeOrganizationId &&
    targetOrganizationId === activeOrganizationId
  ) {
    return;
  }

  throwError("You cant do this");
};

export const checkFinanceUnitAccess = async (
  target?: FinanceTarget,
) => {
  const { user, activeRole } = await getAuth();

  if (user?.isGhost || isManagerLike(activeRole)) return;

  if (target === undefined) {
    if (activeRole.name !== "UnitHead") return;
    await assertFinanceUnitType(activeRole);
    return;
  }

  if (activeRole.name === "OrgHead") {
    await checkOrgHeadTarget(activeRole, target);
    return;
  }

  if (activeRole.name === "UnitHead") {
    await checkUnitHeadTarget(activeRole, target);
    return;
  }

  throwError("You cant do this");
};
