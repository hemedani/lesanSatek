import { assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import {
  assertCanWritePurchasingRequest,
  CORE_APP_MODULE,
  loadPurchasingRequestForActor,
  type PurchasingRequestRef,
} from "./readScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const UNIT_OWN = "507f1f77bcf86cd799439011";
const UNIT_FOREIGN = "507f1f77bcf86cd799439012";
const STORE_OWN = "507f1f77bcf86cd799439021";
const STORE_FOREIGN = "507f1f77bcf86cd799439022";
const REQUEST_ID = "507f1f77bcf86cd799439031";
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

const requestDoc = (
  overrides: Partial<PurchasingRequestRef> = {},
): PurchasingRequestRef => ({
  _id: REQUEST_ID,
  organization: { _id: ORG_OWN },
  requestingUnit: { _id: UNIT_OWN },
  requester: { _id: USER_OTHER },
  store: { _id: STORE_FOREIGN },
  ...overrides,
});

const expectRejectsWith = async (
  fn: () => unknown,
  message: string,
) => {
  try {
    await fn();
  } catch (error) {
    assertEquals((error as Error).message, message);
    return;
  }
  throw new Error(`Expected rejection with "${message}"`);
};

Deno.test("default loader module path resolves back/mod.ts", () => {
  assertEquals(CORE_APP_MODULE, "../../mod.ts");

  const resolved = import.meta.resolve(CORE_APP_MODULE);

  assertStringIncludes(resolved, "/back/mod.ts");
  assertFalse(resolved.endsWith("/back/src/mod.ts"));
});

Deno.test("loadPurchasingRequestForActor uses the injected loader", async () => {
  const loadedIds: string[] = [];
  const options = {
    loadPurchasingRequest: (id: string) => {
      loadedIds.push(id);
      return Promise.resolve(requestDoc({ _id: id }));
    },
  };

  const result = await loadPurchasingRequestForActor(
    role({ name: "OrgHead", scopeType: "organization", scopeId: ORG_OWN }),
    user(),
    REQUEST_ID,
    options,
  );

  assertEquals(result._id, REQUEST_ID);
  assertEquals(loadedIds, [REQUEST_ID]);
});

Deno.test("loadPurchasingRequestForActor denies out-of-scope documents", async () => {
  const options = {
    loadPurchasingRequest: () => Promise.resolve(requestDoc()),
  };

  await expectRejectsWith(
    () =>
      loadPurchasingRequestForActor(
        role({
          name: "OrgHead",
          scopeType: "organization",
          scopeId: ORG_FOREIGN,
        }),
        user(),
        REQUEST_ID,
        options,
      ),
    "You cant do this",
  );
});

Deno.test("loadPurchasingRequestForActor fails closed for missing documents", async () => {
  const options = {
    loadPurchasingRequest: () => Promise.resolve(null),
  };

  await expectRejectsWith(
    () =>
      loadPurchasingRequestForActor(
        role({ name: "Manager" }),
        user(),
        REQUEST_ID,
        options,
      ),
    "You cant do this",
  );
});

Deno.test("assertCanWritePurchasingRequest bypasses for manager-like and ghost callers", () => {
  assertCanWritePurchasingRequest(role({ name: "Manager" }), user(), null);
  assertCanWritePurchasingRequest(role({ name: "Admin" }), user(), null);
  assertCanWritePurchasingRequest(
    role({ name: "Ordinary" }),
    user({ isGhost: true }),
    null,
  );
});

Deno.test("assertCanWritePurchasingRequest allows OrgHead in own organization", () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });

  assertCanWritePurchasingRequest(activeRole, user(), requestDoc());

  assertEquals(
    (() => {
      try {
        assertCanWritePurchasingRequest(
          activeRole,
          user(),
          requestDoc({ organization: { _id: ORG_FOREIGN } }),
        );
        return "allowed";
      } catch {
        return "denied";
      }
    })(),
    "denied",
  );
});

Deno.test("assertCanWritePurchasingRequest scopes UnitHead by requesting unit", () => {
  const activeRole = role({
    name: "UnitHead",
    scopeType: "unit",
    scopeId: UNIT_OWN,
  });

  assertCanWritePurchasingRequest(activeRole, user(), requestDoc());

  assertEquals(
    (() => {
      try {
        assertCanWritePurchasingRequest(
          activeRole,
          user(),
          requestDoc({ requestingUnit: { _id: UNIT_FOREIGN } }),
        );
        return "allowed";
      } catch {
        return "denied";
      }
    })(),
    "denied",
  );
});

Deno.test("assertCanWritePurchasingRequest scopes StoreHead by store", () => {
  const activeRole = role({
    name: "StoreHead",
    scopeType: "store",
    scopeId: STORE_OWN,
  });

  assertCanWritePurchasingRequest(
    activeRole,
    user(),
    requestDoc({ store: { _id: STORE_OWN } }),
  );

  assertEquals(
    (() => {
      try {
        assertCanWritePurchasingRequest(activeRole, user(), requestDoc());
        return "allowed";
      } catch {
        return "denied";
      }
    })(),
    "denied",
  );
});

Deno.test("assertCanWritePurchasingRequest allows requesters and their units", () => {
  const employee = role({ name: "Employee" });

  assertCanWritePurchasingRequest(
    employee,
    user(),
    requestDoc({ requester: { _id: USER_SELF } }),
  );

  assertCanWritePurchasingRequest(
    employee,
    user({ units: [{ _id: UNIT_OWN }] }),
    requestDoc(),
  );

  assertEquals(
    (() => {
      try {
        assertCanWritePurchasingRequest(employee, user(), requestDoc());
        return "allowed";
      } catch {
        return "denied";
      }
    })(),
    "denied",
  );
});
