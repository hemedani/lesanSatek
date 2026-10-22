import { assertEquals } from "@std/assert";
import type { ActiveRole } from "./authzPolicy.ts";
import type { ScopeUser } from "./readScope.ts";
import {
  assertUnitInActorScope,
  type UnitScopeDocument,
  type UnitScopeOptions,
} from "./unitScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const UNIT_OWN = "507f1f77bcf86cd799439011";
const UNIT_SIBLING = "507f1f77bcf86cd799439012";
const UNIT_FOREIGN = "507f1f77bcf86cd799439013";
const USER_SELF = "507f1f77bcf86cd799439017";

const units: Record<string, UnitScopeDocument> = {
  [UNIT_OWN]: { _id: UNIT_OWN, organization: { _id: ORG_OWN } },
  [UNIT_SIBLING]: { _id: UNIT_SIBLING, organization: { _id: ORG_OWN } },
  [UNIT_FOREIGN]: { _id: UNIT_FOREIGN, organization: { _id: ORG_FOREIGN } },
};

const options: UnitScopeOptions = {
  loadUnit: (unitId) => Promise.resolve(units[unitId] ?? null),
};

const role = (overrides: Partial<ActiveRole>): ActiveRole => ({
  roleId: "role-1",
  name: "Employee",
  ...overrides,
});

const userWithUnits = (
  unitIds: string[],
  overrides: Partial<ScopeUser> = {},
): ScopeUser => ({
  _id: USER_SELF,
  isGhost: false,
  units: unitIds.map((unitId) => ({
    _id: unitId,
    organization: units[unitId]?.organization,
  })),
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

Deno.test("manager, admin, and ghost bypass unit scope checks", async () => {
  for (const name of ["Manager", "Admin"] as const) {
    await assertUnitInActorScope(
      userWithUnits([]),
      role({ name }),
      UNIT_FOREIGN,
      options,
    );
  }

  await assertUnitInActorScope(
    userWithUnits([], { isGhost: true }),
    role({ name: "Ordinary" }),
    UNIT_FOREIGN,
    options,
  );
});

Deno.test("OrgHead may act on units in its organization only", async () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const user = userWithUnits([]);

  await assertUnitInActorScope(user, activeRole, UNIT_OWN, options);
  await expectRejectsWith(
    assertUnitInActorScope(user, activeRole, UNIT_FOREIGN, options),
    "You cant do this",
  );
});

Deno.test("UnitHead may act only on its own unit", async () => {
  const activeRole = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_OWN,
  });
  const user = userWithUnits([UNIT_OWN]);

  await assertUnitInActorScope(user, activeRole, UNIT_OWN, options);
  await expectRejectsWith(
    assertUnitInActorScope(user, activeRole, UNIT_SIBLING, options),
    "You cant do this",
  );
});

Deno.test("Employee may act only on units they belong to", async () => {
  const activeRole = role({ name: "Employee" });
  const user = userWithUnits([UNIT_OWN]);

  await assertUnitInActorScope(user, activeRole, UNIT_OWN, options);
  await expectRejectsWith(
    assertUnitInActorScope(user, activeRole, UNIT_SIBLING, options),
    "You cant do this",
  );
});

Deno.test("unknown units fail closed", async () => {
  await expectRejectsWith(
    assertUnitInActorScope(
      userWithUnits([]),
      role({ name: "OrgHead", scopeType: "organization", scopeId: ORG_OWN }),
      "507f1f77bcf86cd799439099",
      options,
    ),
    "You cant do this",
  );
});
