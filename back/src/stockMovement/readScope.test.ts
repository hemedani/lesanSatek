import { assertEquals } from "@std/assert";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import {
  stockMovementReadMatch,
  type StockMovementScopeOptions,
} from "./readScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const UNIT_OWN = "507f1f77bcf86cd799439011";
const UNIT_FOREIGN = "507f1f77bcf86cd799439012";
const UNIT_SECOND = "507f1f77bcf86cd799439013";
const STORE_OWN = "507f1f77bcf86cd799439021";
const INVALID_ID = "not-an-object-id";

const role = (overrides: Partial<ActiveRole>): ActiveRole => ({
  roleId: "role-1",
  name: "Employee",
  ...overrides,
});

const user = (overrides: Partial<ScopeUser> = {}): ScopeUser => ({
  _id: "507f1f77bcf86cd799439041",
  isGhost: false,
  units: [],
  ...overrides,
});

const options = (
  overrides: Partial<StockMovementScopeOptions> = {},
): StockMovementScopeOptions => ({
  loadOrganizationUnitIds: () => Promise.resolve([]),
  loadUnit: () => Promise.resolve(null),
  ...overrides,
});

const idsIn = (match: unknown, field: string): string[] => {
  const value = (match as Record<string, { $in?: unknown[] }>)[field];

  return (value?.$in ?? []).map((id) => String(id));
};

const DENY_MATCH = { _id: { $in: [] } };

Deno.test("stockMovementReadMatch bypasses manager-like and ghost users", async () => {
  assertEquals(
    await stockMovementReadMatch(role({ name: "Manager" }), user()),
    null,
  );
  assertEquals(
    await stockMovementReadMatch(role({ name: "Admin" }), user()),
    null,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "Ordinary" }),
      user({ isGhost: true }),
    ),
    null,
  );
});

Deno.test("stockMovementReadMatch scopes OrgHead to organization units", async () => {
  const match = await stockMovementReadMatch(
    role({
      name: "OrgHead",
      scopeType: "organization",
      scopeId: ORG_OWN,
    }),
    user(),
    options({
      loadOrganizationUnitIds: (organizationId) =>
        Promise.resolve(
          organizationId === ORG_OWN ? [UNIT_OWN, UNIT_SECOND] : [UNIT_FOREIGN],
        ),
    }),
  );

  assertEquals(idsIn(match, "unit._id"), [UNIT_OWN, UNIT_SECOND]);
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "OrgHead" }),
      user(),
    ),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({
        name: "OrgHead",
        scopeType: "organization",
        scopeId: INVALID_ID,
      }),
      user(),
    ),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({
        name: "OrgHead",
        scopeType: "organization",
        scopeId: ORG_OWN,
      }),
      user(),
      options({ loadOrganizationUnitIds: () => Promise.resolve([]) }),
    ),
    DENY_MATCH,
  );
});

Deno.test("stockMovementReadMatch scopes UnitHead to own unit unless warehouse", async () => {
  const ownUnit = await stockMovementReadMatch(
    role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
    user(),
    options({
      loadUnit: () =>
        Promise.resolve({
          _id: UNIT_OWN,
          type: "General",
          organization: { _id: ORG_OWN },
        }),
    }),
  );

  assertEquals(idsIn(ownUnit, "unit._id"), [UNIT_OWN]);

  const warehouse = await stockMovementReadMatch(
    role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
    user(),
    options({
      loadUnit: () =>
        Promise.resolve({
          _id: UNIT_OWN,
          type: "Warehouse",
          organization: { _id: ORG_OWN },
        }),
      loadOrganizationUnitIds: () => Promise.resolve([UNIT_OWN, UNIT_SECOND]),
    }),
  );

  assertEquals(idsIn(warehouse, "unit._id"), [UNIT_OWN, UNIT_SECOND]);
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
      user(),
      options({ loadUnit: () => Promise.resolve(null) }),
    ),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "UnitHead", scopeType: "unit", scopeId: INVALID_ID }),
      user(),
    ),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "UnitHead", scopeType: "organization", scopeId: ORG_OWN }),
      user(),
    ),
    DENY_MATCH,
  );
});

Deno.test("stockMovementReadMatch scopes Employee and Ordinary by unit or memberships", async () => {
  const scoped = await stockMovementReadMatch(
    role({ name: "Employee", scopeType: "unit", scopeId: UNIT_OWN }),
    user(),
  );

  assertEquals(idsIn(scoped, "unit._id"), [UNIT_OWN]);

  const memberships = await stockMovementReadMatch(
    role({ name: "Ordinary" }),
    user({ units: [{ _id: UNIT_OWN }, { _id: UNIT_SECOND }] }),
  );

  assertEquals(idsIn(memberships, "unit._id"), [UNIT_OWN, UNIT_SECOND]);
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "Employee", scopeType: "unit", scopeId: INVALID_ID }),
      user(),
    ),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(role({ name: "Employee" }), user()),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "Ordinary" }),
      user({ units: [{ _id: INVALID_ID }] }),
    ),
    DENY_MATCH,
  );
});

Deno.test("stockMovementReadMatch scopes StoreHead to store and denies invalid scope", async () => {
  const match = await stockMovementReadMatch(
    role({ name: "StoreHead", scopeType: "store", scopeId: STORE_OWN }),
    user(),
  ) as Record<string, unknown>;

  assertEquals(String(match["store._id"]), STORE_OWN);
  assertEquals(
    await stockMovementReadMatch(role({ name: "StoreHead" }), user()),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "StoreHead", scopeType: "store", scopeId: INVALID_ID }),
      user(),
    ),
    DENY_MATCH,
  );
  assertEquals(
    await stockMovementReadMatch(
      role({ name: "StoreHead", scopeType: "unit", scopeId: UNIT_OWN }),
      user(),
    ),
    DENY_MATCH,
  );
});

Deno.test("stockMovementReadMatch ignores foreign organization loaders for own-unit roles", async () => {
  const match = await stockMovementReadMatch(
    role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
    user(),
    options({
      loadUnit: () =>
        Promise.resolve({
          _id: UNIT_OWN,
          type: "General",
          organization: { _id: ORG_FOREIGN },
        }),
    }),
  );

  assertEquals(idsIn(match, "unit._id"), [UNIT_OWN]);
});

Deno.test("scoped Ghost roles do not bypass stock movement scopes", async () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });
  const match = await stockMovementReadMatch(
    activeRole,
    user({ isGhost: true }),
    options({
      loadOrganizationUnitIds: () => Promise.resolve([UNIT_OWN]),
    }),
  );

  assertEquals(idsIn(match, "unit._id"), [UNIT_OWN]);
});
