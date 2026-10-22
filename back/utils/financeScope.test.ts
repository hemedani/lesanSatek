import { assertEquals } from "@std/assert";
import { ObjectId } from "lesan";
import type { ActiveRole } from "./authzPolicy.ts";
import {
  activeFinanceOrganizationId,
  assertCanReadBudgetAllocation,
  assertCanReadBudgetEncumbrance,
  assertCanReadBudgetLine,
  assertCanReadFiscalYear,
  assertCanReadGoodsReceipt,
  assertCanReadPaymentOrder,
  budgetAllocationReadMatch,
  budgetEncumbranceReadMatch,
  budgetLineReadMatch,
  fiscalYearReadMatch,
  goodsReceiptReadMatch,
  isFinanceUnitHead,
  paymentOrderReadMatch,
} from "./financeScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const UNIT_FINANCE = "507f1f77bcf86cd799439011";
const UNIT_GENERAL = "507f1f77bcf86cd799439012";
const USER_SELF = "507f1f77bcf86cd799439017";

const role = (overrides: Partial<ActiveRole>): ActiveRole => ({
  roleId: "role-1",
  name: "Employee",
  ...overrides,
});

const user = (overrides: Record<string, unknown> = {}) => ({
  _id: USER_SELF,
  isGhost: false,
  units: [],
  ...overrides,
});

const expectRejectsWith = async (
  action: Promise<unknown> | (() => unknown),
  message: string,
) => {
  try {
    if (typeof action === "function") {
      await action();
    } else {
      await action;
    }
  } catch (error) {
    assertEquals((error as Error).message, message);
    return;
  }
  throw new Error(`Expected rejection with "${message}"`);
};

const financeUnitLoader = (unitId: string) =>
  Promise.resolve(
    unitId === UNIT_FINANCE
      ? { type: "Finance", organization: { _id: ORG_OWN } }
      : { type: "General", organization: { _id: ORG_OWN } },
  );

Deno.test("Manager, Admin, and Ghost bypass finance read scopes", () => {
  const normalUser = user();
  const ghost = user({ isGhost: true });

  for (const name of ["Manager", "Admin"] as const) {
    const activeRole = role({ name });
    assertEquals(paymentOrderReadMatch(activeRole, normalUser, null), null);
    assertEquals(budgetLineReadMatch(activeRole, normalUser, null), null);
    assertEquals(fiscalYearReadMatch(activeRole, normalUser, null), null);
    assertEquals(
      budgetEncumbranceReadMatch(activeRole, normalUser, null),
      null,
    );
    assertEquals(budgetAllocationReadMatch(activeRole, normalUser, null), null);
    assertEquals(goodsReceiptReadMatch(activeRole, normalUser, null), null);
  }

  const ordinary = role({ name: "Ordinary" });
  assertEquals(paymentOrderReadMatch(ordinary, ghost, null), null);
  assertEquals(budgetLineReadMatch(ordinary, ghost, null), null);
});

Deno.test("OrgHead matches finance documents in its organization", async () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const normalUser = user();
  const organizationId = await activeFinanceOrganizationId(
    activeRole,
    normalUser,
  );

  assertEquals(organizationId, ORG_OWN);
  assertEquals(await isFinanceUnitHead(activeRole), false);

  const organizationMatch = { "organization._id": { $in: [new ObjectId(ORG_OWN)] } };

  assertEquals(paymentOrderReadMatch(activeRole, normalUser, organizationId), {
    "purchasingRequest.organization._id": { $in: [new ObjectId(ORG_OWN)] },
  });
  assertEquals(
    budgetLineReadMatch(activeRole, normalUser, organizationId),
    organizationMatch,
  );
  assertEquals(
    fiscalYearReadMatch(activeRole, normalUser, organizationId),
    organizationMatch,
  );
  assertEquals(
    goodsReceiptReadMatch(activeRole, normalUser, organizationId),
    {
      "purchasingRequest.organization._id": { $in: [new ObjectId(ORG_OWN)] },
    },
  );
});

Deno.test("OrgHead without an organization scope fails closed", async () => {
  const activeRole = role({ name: "OrgHead", scopeType: "unit", scopeId: ORG_OWN });
  const normalUser = user();

  assertEquals(
    await activeFinanceOrganizationId(activeRole, normalUser),
    null,
  );
  assertEquals(paymentOrderReadMatch(activeRole, normalUser, null), {
    _id: { $in: [] },
  });
});

Deno.test("Finance UnitHead reads its organization and its payment orders", async () => {
  const activeRole = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_FINANCE,
  });
  const normalUser = user();

  assertEquals(
    await isFinanceUnitHead(activeRole, { loadUnit: financeUnitLoader }),
    true,
  );

  const organizationId = await activeFinanceOrganizationId(
    activeRole,
    normalUser,
    { loadUnit: financeUnitLoader },
  );
  assertEquals(organizationId, ORG_OWN);

  assertEquals(
    paymentOrderReadMatch(activeRole, normalUser, organizationId),
    {
      $or: [
        { "purchasingRequest.organization._id": { $in: [new ObjectId(ORG_OWN)] } },
        { "financialUnit._id": { $in: [new ObjectId(UNIT_FINANCE)] } },
      ],
    },
  );
  assertEquals(
    budgetLineReadMatch(activeRole, normalUser, organizationId),
    { "organization._id": { $in: [new ObjectId(ORG_OWN)] } },
  );
  assertEquals(
    budgetEncumbranceReadMatch(activeRole, normalUser, organizationId),
    { "budgetLine.organization._id": { $in: [new ObjectId(ORG_OWN)] } },
  );
});

Deno.test("Non-finance UnitHead fails closed", async () => {
  const activeRole = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_GENERAL,
  });
  const normalUser = user();

  assertEquals(
    await isFinanceUnitHead(activeRole, { loadUnit: financeUnitLoader }),
    false,
  );
  assertEquals(
    await activeFinanceOrganizationId(activeRole, normalUser, {
      loadUnit: financeUnitLoader,
    }),
    null,
  );
  assertEquals(paymentOrderReadMatch(activeRole, normalUser, null), {
    _id: { $in: [] },
  });
  assertEquals(
    fiscalYearReadMatch(activeRole, normalUser, null),
    { _id: { $in: [] } },
  );
});

Deno.test("Employee, Ordinary, and StoreHead fail closed", async () => {
  const normalUser = user();

  for (const name of ["Employee", "Ordinary", "StoreHead"] as const) {
    const activeRole = role({ name });

    assertEquals(
      await activeFinanceOrganizationId(activeRole, normalUser),
      null,
    );
    assertEquals(paymentOrderReadMatch(activeRole, normalUser, null), {
      _id: { $in: [] },
    });
    assertEquals(budgetLineReadMatch(activeRole, normalUser, null), {
      _id: { $in: [] },
    });
    assertEquals(goodsReceiptReadMatch(activeRole, normalUser, null), {
      _id: { $in: [] },
    });
  }
});

Deno.test("Invalid finance organization ids fail closed", () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const normalUser = user();

  assertEquals(paymentOrderReadMatch(activeRole, normalUser, "not-an-id"), {
    _id: { $in: [] },
  });
  assertEquals(budgetLineReadMatch(activeRole, normalUser, ""), {
    _id: { $in: [] },
  });
});

Deno.test("Assert helpers allow own organization and deny foreign documents", async () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const normalUser = user();
  const organizationId = ORG_OWN;

  assertCanReadPaymentOrder(
    activeRole,
    normalUser,
    { purchasingRequest: { organization: { _id: ORG_OWN } } },
    organizationId,
  );
  assertCanReadBudgetLine(
    activeRole,
    normalUser,
    { organization: { _id: ORG_OWN } },
    organizationId,
  );
  assertCanReadFiscalYear(
    activeRole,
    normalUser,
    { organization: { _id: ORG_OWN } },
    organizationId,
  );
  assertCanReadGoodsReceipt(
    activeRole,
    normalUser,
    { purchasingRequest: { organization: { _id: ORG_OWN } } },
    organizationId,
  );
  assertCanReadBudgetEncumbrance(
    activeRole,
    normalUser,
    { budgetLine: { organization: { _id: ORG_OWN } } },
    organizationId,
  );
  assertCanReadBudgetAllocation(
    activeRole,
    normalUser,
    { budgetLine: { organization: { _id: ORG_OWN } } },
    organizationId,
  );

  await expectRejectsWith(
    () =>
      assertCanReadPaymentOrder(
        activeRole,
        normalUser,
        { purchasingRequest: { organization: { _id: ORG_FOREIGN } } },
        organizationId,
      ),
    "You cant do this",
  );
  await expectRejectsWith(
    () =>
      assertCanReadBudgetLine(
        activeRole,
        normalUser,
        { organization: { _id: ORG_FOREIGN } },
        organizationId,
      ),
    "You cant do this",
  );
  await expectRejectsWith(
    () => assertCanReadGoodsReceipt(activeRole, normalUser, null, organizationId),
    "You cant do this",
  );
  await expectRejectsWith(
    () =>
      assertCanReadBudgetEncumbrance(
        activeRole,
        normalUser,
        { budgetLine: { organization: { _id: ORG_FOREIGN } } },
        organizationId,
      ),
    "You cant do this",
  );
});

Deno.test("Payment order asserts allow a finance unit head's financial unit", async () => {
  const activeRole = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_FINANCE,
  });
  const normalUser = user();

  assertCanReadPaymentOrder(
    activeRole,
    normalUser,
    { financialUnit: { _id: UNIT_FINANCE } },
    ORG_OWN,
  );

  await expectRejectsWith(
    () =>
      assertCanReadPaymentOrder(
        activeRole,
        normalUser,
        {
          purchasingRequest: { organization: { _id: ORG_FOREIGN } },
          financialUnit: { _id: UNIT_GENERAL },
        },
        ORG_OWN,
      ),
    "You cant do this",
  );

  assertCanReadPaymentOrder(
    role({ name: "Manager" }),
    normalUser,
    null,
    null,
  );
});
