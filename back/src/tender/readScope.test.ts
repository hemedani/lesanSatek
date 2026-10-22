import { assert, assertEquals, assertThrows } from "@std/assert";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import {
  assertCanReadTender,
  type TenderRef,
  tenderMatchesReadScope,
  tenderReadMatch,
} from "./readScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const UNIT_OWN = "507f1f77bcf86cd799439011";
const UNIT_FOREIGN = "507f1f77bcf86cd799439012";
const STORE_OWN = "507f1f77bcf86cd799439021";
const USER_SELF = "507f1f77bcf86cd799439041";
const USER_OTHER = "507f1f77bcf86cd799439042";

const role = (overrides: Partial<ActiveRole>): ActiveRole => ({
  roleId: "role-1",
  name: "Employee",
  ...overrides,
});

const user = (overrides: Partial<ScopeUser> = {}): ScopeUser => ({
  _id: USER_SELF,
  isGhost: false,
  units: [],
  ...overrides,
});

const tender = (overrides: Partial<TenderRef> = {}): TenderRef => ({
  purchasingRequest: {
    organization: { _id: ORG_OWN },
    requestingUnit: { _id: UNIT_OWN },
    requester: { _id: USER_OTHER },
  },
  assignedVendors: [{ _id: STORE_OWN }],
  ...overrides,
});

const idsIn = (match: unknown, field: string): string[] => {
  const value = (match as Record<string, { $in?: unknown[] }>)[field];

  return (value?.$in ?? []).map((id) => String(id));
};

Deno.test("tenderReadMatch bypasses manager-like and ghost users", () => {
  assertEquals(tenderReadMatch(role({ name: "Manager" }), user()), null);
  assertEquals(tenderReadMatch(role({ name: "Admin" }), user()), null);
  assertEquals(
    tenderReadMatch(role({ name: "Ordinary" }), user({ isGhost: true })),
    null,
  );
});

Deno.test("tenderReadMatch scopes OrgHead by organization", () => {
  const match = tenderReadMatch(
    role({
      name: "OrgHead",
      scopeType: "organization",
      scopeId: ORG_OWN,
    }),
    user(),
  );

  assertEquals(
    idsIn(match, "purchasingRequest.organization._id"),
    [ORG_OWN],
  );

  assertEquals(
    tenderReadMatch(role({ name: "OrgHead" }), user()),
    { _id: { $in: [] } },
  );
});

Deno.test("tenderReadMatch scopes UnitHead by requesting unit", () => {
  const match = tenderReadMatch(
    role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
    user(),
  );

  assertEquals(
    idsIn(match, "purchasingRequest.requestingUnit._id"),
    [UNIT_OWN],
  );

  assertEquals(
    tenderReadMatch(
      role({ name: "UnitHead", scopeType: "organization", scopeId: ORG_OWN }),
      user(),
    ),
    { _id: { $in: [] } },
  );
});

Deno.test("tenderReadMatch scopes StoreHead by assigned vendor", () => {
  const match = tenderReadMatch(
    role({ name: "StoreHead", scopeType: "store", scopeId: STORE_OWN }),
    user(),
  );

  assertEquals(idsIn(match, "assignedVendors._id"), [STORE_OWN]);
  assertEquals(
    tenderReadMatch(role({ name: "StoreHead" }), user()),
    { _id: { $in: [] } },
  );
});

Deno.test("tenderReadMatch scopes self roles to units or requester", () => {
  const match = tenderReadMatch(
    role({ name: "Employee" }),
    user({ units: [{ _id: UNIT_OWN }] }),
  ) as Record<string, unknown>;

  assert(Array.isArray(match.$or));
  assertEquals(
    idsIn(
      (match.$or as Record<string, unknown>[])[0],
      "purchasingRequest.requestingUnit._id",
    ),
    [UNIT_OWN],
  );
  assertEquals(
    idsIn(
      (match.$or as Record<string, unknown>[])[1],
      "purchasingRequest.requester._id",
    ),
    [USER_SELF],
  );

  assertEquals(
    idsIn(
      tenderReadMatch(role({ name: "Ordinary" }), user()),
      "purchasingRequest.requester._id",
    ),
    [USER_SELF],
  );
  assertEquals(
    tenderReadMatch(role({ name: "Ordinary" }), user({ _id: undefined })),
    { _id: { $in: [] } },
  );
});

Deno.test("tenderMatchesReadScope evaluates tenant snapshots", () => {
  assert(
    tenderMatchesReadScope(
      role({
        name: "OrgHead",
        scopeType: "organization",
        scopeId: ORG_OWN,
      }),
      user(),
      tender(),
    ),
  );
  assert(
    !tenderMatchesReadScope(
      role({
        name: "OrgHead",
        scopeType: "organization",
        scopeId: ORG_FOREIGN,
      }),
      user(),
      tender(),
    ),
  );
  assert(
    tenderMatchesReadScope(
      role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
      user(),
      tender(),
    ),
  );
  assert(
    !tenderMatchesReadScope(
      role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_FOREIGN }),
      user(),
      tender(),
    ),
  );
  assert(
    tenderMatchesReadScope(
      role({ name: "StoreHead", scopeType: "store", scopeId: STORE_OWN }),
      user(),
      tender(),
    ),
  );
  assert(
    tenderMatchesReadScope(
      role({ name: "Employee" }),
      user({ units: [{ _id: UNIT_OWN }] }),
      tender(),
    ),
  );
  assert(
    tenderMatchesReadScope(
      role({ name: "Employee" }),
      user(),
      tender({
        purchasingRequest: {
          requestingUnit: { _id: UNIT_FOREIGN },
          requester: { _id: USER_SELF },
        },
      }),
    ),
  );
  assert(
    !tenderMatchesReadScope(
      role({ name: "Employee" }),
      user(),
      tender({
        purchasingRequest: {
          requestingUnit: { _id: UNIT_FOREIGN },
          requester: { _id: USER_OTHER },
        },
      }),
    ),
  );
});

Deno.test("assertCanReadTender denies missing and foreign tenders", () => {
  assertThrows(
    () =>
      assertCanReadTender(
        role({
          name: "OrgHead",
          scopeType: "organization",
          scopeId: ORG_FOREIGN,
        }),
        user(),
        tender(),
      ),
    Error,
    "You cant do this",
  );

  assertThrows(
    () =>
      assertCanReadTender(
        role({ name: "Employee" }),
        user(),
        null,
      ),
    Error,
    "You cant do this",
  );

  assertCanReadTender(role({ name: "Manager" }), user(), null);
});
