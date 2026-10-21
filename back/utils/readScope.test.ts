import { assertEquals } from "@std/assert";
import { ObjectId } from "lesan";
import type { ActiveRole } from "./authzPolicy.ts";
import {
  applyOrganizationReadScope,
  applyUnitReadScope,
  assertCanReadOrganization,
  assertCanReadUnit,
  organizationReadScope,
  type ScopeUser,
  unitReadScope,
  userReadFilter,
} from "./readScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const ORG_A = "507f1f77bcf86cd799439003";
const ORG_B = "507f1f77bcf86cd799439004";
const UNIT_OWN = "507f1f77bcf86cd799439011";
const UNIT_CHILD = "507f1f77bcf86cd799439012";
const UNIT_GRANDCHILD = "507f1f77bcf86cd799439013";
const UNIT_A = "507f1f77bcf86cd799439014";
const UNIT_B = "507f1f77bcf86cd799439015";
const UNIT_FOREIGN = "507f1f77bcf86cd799439016";
const USER_SELF = "507f1f77bcf86cd799439017";

const role = (overrides: Partial<ActiveRole>): ActiveRole => ({
  roleId: "role-1",
  name: "Employee",
  ...overrides,
});

const userWithUnits = (
  units: ScopeUser["units"],
  overrides: Partial<ScopeUser> = {},
): ScopeUser => ({
  _id: USER_SELF,
  isGhost: false,
  units,
  ...overrides,
});

const expectRejectsWith = async (
  promise: Promise<unknown>,
  message: string,
) => {
  try {
    await promise;
  } catch (error) {
    assertEquals((error as Error).message, message);
    return;
  }
  throw new Error(`Expected rejection with "${message}"`);
};

const expectThrowsWith = (fn: () => unknown, message: string) => {
  try {
    fn();
  } catch (error) {
    assertEquals((error as Error).message, message);
    return;
  }
  throw new Error(`Expected throw with "${message}"`);
};

Deno.test("Manager and Admin read everything", async () => {
  const user = userWithUnits([]);

  for (const name of ["Manager", "Admin"] as const) {
    const activeRole = role({ name });
    assertEquals(await unitReadScope(activeRole, user), "all");
    assertEquals(organizationReadScope(activeRole, user), "all");
    assertEquals(userReadFilter(activeRole, user), null);
    await assertCanReadUnit(activeRole, user, "any-unit");
    assertCanReadOrganization(activeRole, user, "any-org");
  }
});

Deno.test("Ghost reads everything", async () => {
  const ghost = userWithUnits([], { isGhost: true });
  const activeRole = role({ name: "Ordinary" });

  assertEquals(await unitReadScope(activeRole, ghost), "all");
  assertEquals(organizationReadScope(activeRole, ghost), "all");
  assertEquals(userReadFilter(activeRole, ghost), null);
  await assertCanReadUnit(activeRole, ghost, "any-unit");
  assertCanReadOrganization(activeRole, ghost, "any-org");
});

Deno.test("OrgHead is scoped to its organization", async () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const user = userWithUnits([]);

  assertEquals(await unitReadScope(activeRole, user), {
    organizationIds: [ORG_OWN],
  });
  assertEquals(organizationReadScope(activeRole, user), {
    organizationIds: [ORG_OWN],
  });
  assertEquals(userReadFilter(activeRole, user), {
    "organizations._id": new ObjectId(ORG_OWN),
  });
});

Deno.test("OrgHead without a scope fails closed", async () => {
  const activeRole = role({ name: "OrgHead" });
  const user = userWithUnits([]);

  assertEquals(await unitReadScope(activeRole, user), {
    organizationIds: [],
  });
  assertEquals(organizationReadScope(activeRole, user), {
    organizationIds: [],
  });
});

Deno.test("UnitHead includes own unit and injected descendants", async () => {
  const activeRole = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_OWN,
  });
  const user = userWithUnits([{
    _id: UNIT_OWN,
    organization: { _id: ORG_OWN },
  }]);

  const scope = await unitReadScope(activeRole, user, {
    loadDescendantUnitIds: () =>
      Promise.resolve([UNIT_CHILD, UNIT_OWN, UNIT_GRANDCHILD]),
  });

  assertEquals(scope, {
    unitIds: [UNIT_OWN, UNIT_CHILD, UNIT_GRANDCHILD],
  });
  assertEquals(organizationReadScope(activeRole, user), {
    organizationIds: [ORG_OWN],
  });
});

Deno.test("UnitHead without a scope fails closed", async () => {
  const activeRole = role({ name: "UnitHead" });
  const user = userWithUnits([{ _id: UNIT_OWN }]);

  assertEquals(
    await unitReadScope(activeRole, user, {
      loadDescendantUnitIds: () => Promise.resolve([UNIT_CHILD]),
    }),
    { unitIds: [] },
  );
});

Deno.test("Employee is scoped to the units they belong to", async () => {
  const activeRole = role({
    name: "Employee",
    scopeType: "unit",
    scopeId: UNIT_A,
  });
  const user = userWithUnits([
    { _id: UNIT_A, organization: { _id: ORG_OWN } },
    { _id: UNIT_B, organization: { _id: ORG_OWN } },
    { _id: UNIT_A, organization: { _id: ORG_OWN } },
  ]);

  assertEquals(await unitReadScope(activeRole, user), {
    unitIds: [UNIT_A, UNIT_B],
  });
  assertEquals(organizationReadScope(activeRole, user), {
    organizationIds: [ORG_OWN],
  });
  assertEquals(userReadFilter(activeRole, user), {
    _id: new ObjectId(USER_SELF),
  });
});

Deno.test("Ordinary is scoped to the units they belong to", async () => {
  const activeRole = role({ name: "Ordinary" });
  const user = userWithUnits([
    { _id: UNIT_A, organization: { _id: ORG_A } },
    { _id: UNIT_B, organization: { _id: ORG_B } },
  ]);

  assertEquals(await unitReadScope(activeRole, user), {
    unitIds: [UNIT_A, UNIT_B],
  });
  assertEquals(organizationReadScope(activeRole, user), {
    organizationIds: [ORG_A, ORG_B],
  });
});

Deno.test("missing units and organizations fail closed", async () => {
  const employee = role({ name: "Employee" });
  const user = userWithUnits(undefined);

  assertEquals(await unitReadScope(employee, user), { unitIds: [] });
  assertEquals(organizationReadScope(employee, user), {
    organizationIds: [],
  });

  const unscopedUnitHead = role({ name: "UnitHead", scopeId: UNIT_A });
  assertEquals(organizationReadScope(unscopedUnitHead, userWithUnits([])), {
    organizationIds: [],
  });
});

Deno.test("assertCanReadUnit allows scoped units and denies foreign units", async () => {
  const unitHead = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_OWN,
  });
  const user = userWithUnits([]);
  const options = {
    loadDescendantUnitIds: () => Promise.resolve([UNIT_CHILD]),
  };

  await assertCanReadUnit(unitHead, user, UNIT_OWN, options);
  await assertCanReadUnit(unitHead, user, UNIT_CHILD, options);
  await expectRejectsWith(
    assertCanReadUnit(unitHead, user, UNIT_FOREIGN, options),
    "You cant do this",
  );

  const employee = role({ name: "Employee" });
  const employeeUser = userWithUnits([{ _id: UNIT_A }]);

  await assertCanReadUnit(employee, employeeUser, UNIT_A);
  await expectRejectsWith(
    assertCanReadUnit(employee, employeeUser, UNIT_FOREIGN),
    "You cant do this",
  );
});

Deno.test("assertCanReadUnit checks organization scope for OrgHead", async () => {
  const orgHead = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const user = userWithUnits([]);
  const options = {
    loadUnitOrganizationId: (unitId: string) =>
      Promise.resolve(unitId === UNIT_OWN ? ORG_OWN : ORG_FOREIGN),
  };

  await assertCanReadUnit(orgHead, user, UNIT_OWN, options);
  await expectRejectsWith(
    assertCanReadUnit(orgHead, user, UNIT_FOREIGN, options),
    "You cant do this",
  );
});

Deno.test("assertCanReadOrganization denies foreign organizations", () => {
  const orgHead = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const user = userWithUnits([]);

  assertCanReadOrganization(orgHead, user, ORG_OWN);
  expectThrowsWith(
    () => assertCanReadOrganization(orgHead, user, ORG_FOREIGN),
    "You cant do this",
  );

  const employee = role({ name: "Employee" });
  const employeeUser = userWithUnits([
    { _id: UNIT_A, organization: { _id: ORG_A } },
  ]);

  assertCanReadOrganization(employee, employeeUser, ORG_A);
  expectThrowsWith(
    () => assertCanReadOrganization(employee, employeeUser, ORG_B),
    "You cant do this",
  );
});

Deno.test("userReadFilter scopes scoped roles and self-only roles", async () => {
  const { ObjectId } = await import("lesan");
  const unitHead = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_OWN,
  });
  const orgHead = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const ordinary = role({ name: "Ordinary" });
  const user = userWithUnits([]);

  assertEquals(userReadFilter(unitHead, user), {
    "units._id": new ObjectId(UNIT_OWN),
  });
  assertEquals(userReadFilter(orgHead, user), {
    "organizations._id": new ObjectId(ORG_OWN),
  });
  assertEquals(userReadFilter(ordinary, user), {
    _id: new ObjectId(USER_SELF),
  });
});

Deno.test("apply helpers push fail-closed matches", () => {
  const unitId = "507f1f77bcf86cd799439011";
  const orgId = "507f1f77bcf86cd799439012";

  const unitPipeline: Record<string, unknown>[] = [];
  applyUnitReadScope(unitPipeline, { unitIds: [unitId] });
  assertEquals(unitPipeline, [{
    $match: { _id: { $in: [new ObjectId(unitId)] } },
  }]);

  const orgUnitPipeline: Record<string, unknown>[] = [];
  applyUnitReadScope(orgUnitPipeline, { organizationIds: [orgId] });
  assertEquals(orgUnitPipeline, [{
    $match: { "organization._id": { $in: [new ObjectId(orgId)] } },
  }]);

  const orgPipeline: Record<string, unknown>[] = [];
  applyOrganizationReadScope(orgPipeline, { organizationIds: [] });
  assertEquals(orgPipeline, [{
    $match: { _id: { $in: [] } },
  }]);

  const allUnitPipeline: Record<string, unknown>[] = [];
  applyUnitReadScope(allUnitPipeline, "all");
  assertEquals(allUnitPipeline, []);
});
