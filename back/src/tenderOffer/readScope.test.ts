import { assert, assertEquals, assertThrows } from "@std/assert";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import {
  assertCanReadTenderOffer,
  type TenderOfferRef,
  tenderOfferMatchesReadScope,
  tenderOfferReadMatch,
} from "./readScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const UNIT_OWN = "507f1f77bcf86cd799439011";
const UNIT_FOREIGN = "507f1f77bcf86cd799439012";
const STORE_OWN = "507f1f77bcf86cd799439021";
const STORE_FOREIGN = "507f1f77bcf86cd799439022";
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

const offer = (overrides: Partial<TenderOfferRef> = {}): TenderOfferRef => ({
  store: { _id: STORE_OWN },
  tender: {
    purchasingRequest: {
      organization: { _id: ORG_OWN },
      requestingUnit: { _id: UNIT_OWN },
      requester: { _id: USER_OTHER },
    },
  },
  ...overrides,
});

const idsIn = (match: unknown, field: string): string[] => {
  const value = (match as Record<string, { $in?: unknown[] }>)[field];

  return (value?.$in ?? []).map((id) => String(id));
};

Deno.test("tenderOfferReadMatch bypasses manager-like and ghost users", () => {
  assertEquals(tenderOfferReadMatch(role({ name: "Manager" }), user()), null);
  assertEquals(tenderOfferReadMatch(role({ name: "Admin" }), user()), null);
  assertEquals(
    tenderOfferReadMatch(role({ name: "Ordinary" }), user({ isGhost: true })),
    null,
  );
});

Deno.test("tenderOfferReadMatch scopes roles by nested tenant", () => {
  assertEquals(
    idsIn(
      tenderOfferReadMatch(
        role({
          name: "OrgHead",
          scopeType: "organization",
          scopeId: ORG_OWN,
        }),
        user(),
      ),
      "tender.purchasingRequest.organization._id",
    ),
    [ORG_OWN],
  );

  assertEquals(
    idsIn(
      tenderOfferReadMatch(
        role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
        user(),
      ),
      "tender.purchasingRequest.requestingUnit._id",
    ),
    [UNIT_OWN],
  );

  assertEquals(
    idsIn(
      tenderOfferReadMatch(
        role({ name: "StoreHead", scopeType: "store", scopeId: STORE_OWN }),
        user(),
      ),
      "store._id",
    ),
    [STORE_OWN],
  );
});

Deno.test("tenderOfferReadMatch fails closed without derivable scope", () => {
  assertEquals(
    tenderOfferReadMatch(role({ name: "OrgHead" }), user()),
    { _id: { $in: [] } },
  );
  assertEquals(
    tenderOfferReadMatch(role({ name: "UnitHead" }), user()),
    { _id: { $in: [] } },
  );
  assertEquals(
    tenderOfferReadMatch(role({ name: "StoreHead" }), user()),
    { _id: { $in: [] } },
  );
  assertEquals(
    tenderOfferReadMatch(role({ name: "Ordinary" }), user({ _id: undefined })),
    { _id: { $in: [] } },
  );
});

Deno.test("tenderOfferReadMatch scopes self roles to units or requester", () => {
  const match = tenderOfferReadMatch(
    role({ name: "Employee" }),
    user({ units: [{ _id: UNIT_OWN }] }),
  ) as Record<string, unknown>;

  assert(Array.isArray(match.$or));
  assertEquals(
    idsIn(
      (match.$or as Record<string, unknown>[])[0],
      "tender.purchasingRequest.requestingUnit._id",
    ),
    [UNIT_OWN],
  );
  assertEquals(
    idsIn(
      (match.$or as Record<string, unknown>[])[1],
      "tender.purchasingRequest.requester._id",
    ),
    [USER_SELF],
  );
});

Deno.test("tenderOfferMatchesReadScope evaluates nested tenant snapshots", () => {
  assert(
    tenderOfferMatchesReadScope(
      role({
        name: "OrgHead",
        scopeType: "organization",
        scopeId: ORG_OWN,
      }),
      user(),
      offer(),
    ),
  );
  assert(
    !tenderOfferMatchesReadScope(
      role({
        name: "OrgHead",
        scopeType: "organization",
        scopeId: ORG_FOREIGN,
      }),
      user(),
      offer(),
    ),
  );
  assert(
    tenderOfferMatchesReadScope(
      role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_OWN }),
      user(),
      offer(),
    ),
  );
  assert(
    !tenderOfferMatchesReadScope(
      role({ name: "UnitHead", scopeType: "unit", scopeId: UNIT_FOREIGN }),
      user(),
      offer(),
    ),
  );
  assert(
    tenderOfferMatchesReadScope(
      role({ name: "StoreHead", scopeType: "store", scopeId: STORE_OWN }),
      user(),
      offer(),
    ),
  );
  assert(
    !tenderOfferMatchesReadScope(
      role({ name: "StoreHead", scopeType: "store", scopeId: STORE_FOREIGN }),
      user(),
      offer(),
    ),
  );
  assert(
    tenderOfferMatchesReadScope(
      role({ name: "Employee" }),
      user(),
      offer({
        tender: {
          purchasingRequest: {
            requestingUnit: { _id: UNIT_FOREIGN },
            requester: { _id: USER_SELF },
          },
        },
      }),
    ),
  );
  assert(
    !tenderOfferMatchesReadScope(
      role({ name: "Employee" }),
      user(),
      offer({
        tender: {
          purchasingRequest: {
            requestingUnit: { _id: UNIT_FOREIGN },
            requester: { _id: USER_OTHER },
          },
        },
      }),
    ),
  );
});

Deno.test("assertCanReadTenderOffer denies missing and foreign offers", () => {
  assertThrows(
    () =>
      assertCanReadTenderOffer(
        role({
          name: "OrgHead",
          scopeType: "organization",
          scopeId: ORG_FOREIGN,
        }),
        user(),
        offer(),
      ),
    Error,
    "You cant do this",
  );

  assertThrows(
    () =>
      assertCanReadTenderOffer(
        role({ name: "Employee" }),
        user(),
        null,
      ),
    Error,
    "You cant do this",
  );

  assertCanReadTenderOffer(role({ name: "Manager" }), user(), null);
});
