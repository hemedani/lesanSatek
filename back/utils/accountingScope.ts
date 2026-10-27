import { type Document, ObjectId } from "lesan";
import { type ActiveRole, isScopeBypass } from "./authzPolicy.ts";
import { checkFinanceUnitAccess } from "./checkFinanceUnitAccess.ts";
import { throwError } from "./throwError.ts";
import type { ScopeUser } from "./readScope.ts";

type AccountingUser = ScopeUser & { _id?: unknown };

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

/**
 * Resolve the organization whose accounting data the active role may read.
 * Manager/Admin bypass (null), OrgHead uses its organization scope, and a
 * UnitHead only gets a value when it heads a Finance unit.
 */
export const activeAccountingOrganizationId = async (
  activeRole: ActiveRole,
  user: AccountingUser | undefined,
): Promise<string | null> => {
  const { activeFinanceOrganizationId } = await import("./financeScope.ts");

  return await activeFinanceOrganizationId(activeRole, user);
};

/**
 * Build an authoritative Mongo filter for accounting collections. A payload
 * supplied organizationId can never widen the caller's scope.
 */
export const accountingReadMatch = (
  activeRole: ActiveRole,
  user: AccountingUser | undefined,
  financeOrganizationId: string | null,
  field = "organization._id",
): Document | null => {
  if (isScopeBypass(activeRole, user)) return null;

  const organizationId = toObjectId(financeOrganizationId);
  if (!organizationId) return emptyMatch();

  return { [field]: { $in: [organizationId] } };
};

export const assertAccountingOrganizationAccess = async (
  organizationId: unknown,
): Promise<void> => {
  await checkFinanceUnitAccess({
    organizationId: normalizeId(organizationId) ?? undefined,
  });
};

export const assertCanReadAccountingDocument = (
  activeRole: ActiveRole,
  user: AccountingUser | undefined,
  documentOrganizationId: unknown,
  financeOrganizationId: string | null,
): void => {
  if (isScopeBypass(activeRole, user)) return;

  const organizationId = toObjectId(financeOrganizationId);
  const documentOrgId = toObjectId(documentOrganizationId);

  if (
    organizationId && documentOrgId && organizationId.equals(documentOrgId)
  ) {
    return;
  }

  throwError("You cant do this");
};

export const accountingDocumentOrganizationId = (
  doc: Document | null | undefined,
  field = "organization",
): string | null => {
  const relation = doc?.[field] as { _id?: unknown } | null | undefined;

  return normalizeId(relation?._id);
};
