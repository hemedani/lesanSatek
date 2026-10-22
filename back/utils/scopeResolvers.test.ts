import { assertEquals } from "@std/assert";
import { type Feature, grantAccess } from "./grantAccess.ts";
import type { ActiveRole } from "./authzPolicy.ts";
import type { ScopeRef } from "./authzPolicy.ts";

type FakeContext = {
  user: {
    _id?: string;
    isGhost?: boolean;
    features?: { feature: Feature }[];
    units?: {
      _id?: string;
      features?: { feature: Feature }[];
      organization?: { _id?: string } | null;
    }[];
    roles?: ActiveRole[];
  };
  body: { details: { set: Record<string, unknown> } };
};

const orgHead: ActiveRole = {
  roleId: "role-org-head",
  name: "OrgHead",
  scopeType: "organization",
  scopeId: "org-1",
};

const manager: ActiveRole = {
  roleId: "role-manager",
  name: "Manager",
};

const contextFor = (
  role: ActiveRole | null,
  overrides: Partial<FakeContext["user"]> = {},
  set: Record<string, unknown> = {},
): FakeContext => ({
  user: {
    _id: "user-1",
    isGhost: false,
    features: [],
    units: [],
    roles: role ? [role] : [],
    ...overrides,
  },
  body: { details: { set } },
});

const authContext = (ctx: FakeContext) => () => ctx;

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

Deno.test("grantAccess rejects when activeRoleId is missing", async () => {
  const ctx = contextFor(orgHead);
  await expectRejectsWith(
    grantAccess([{ roles: ["OrgHead"] }], authContext(ctx))(),
    "activeRoleId is required",
  );
});

Deno.test("grantAccess rejects when the active role is unknown", async () => {
  const ctx = contextFor(orgHead, {}, { activeRoleId: "missing-role" });
  await expectRejectsWith(
    grantAccess([{ roles: ["OrgHead"] }], authContext(ctx))(),
    "Active role not found",
  );
});

Deno.test("grantAccess denies when the active role is not listed in any check", async () => {
  const ctx = contextFor(orgHead, {}, { activeRoleId: orgHead.roleId });
  await expectRejectsWith(
    grantAccess([{ roles: ["Manager", "Admin"] }], authContext(ctx))(),
    "You cant do this",
  );
});

Deno.test("a check without a scope grants access to a listed role", async () => {
  const ctx = contextFor(orgHead, {}, { activeRoleId: orgHead.roleId });
  await grantAccess([{ roles: ["OrgHead"] }], authContext(ctx))();
});

Deno.test("a scoped check grants access when the resolved scope matches", async () => {
  const ctx = contextFor(orgHead, {}, { activeRoleId: orgHead.roleId });
  const resolver = (): ScopeRef => ({
    scopeType: "organization",
    scopeId: "org-1",
  });

  await grantAccess(
    [{ roles: ["OrgHead"], scope: resolver }],
    authContext(ctx),
  )();
});

Deno.test("a scoped check denies access when the resolved scope mismatches", async () => {
  const ctx = contextFor(orgHead, {}, { activeRoleId: orgHead.roleId });
  const resolver = (): ScopeRef => ({
    scopeType: "organization",
    scopeId: "org-2",
  });

  await expectRejectsWith(
    grantAccess([{ roles: ["OrgHead"], scope: resolver }], authContext(ctx))(),
    "You cant do this",
  );
});

Deno.test("a scoped check with an unresolved scope denies access", async () => {
  const ctx = contextFor(orgHead, {}, { activeRoleId: orgHead.roleId });
  const resolver = () => null;

  await expectRejectsWith(
    grantAccess([{ roles: ["OrgHead"], scope: resolver }], authContext(ctx))(),
    "You cant do this",
  );
});

Deno.test("resolvers may be asynchronous", async () => {
  const ctx = contextFor(orgHead, {}, { activeRoleId: orgHead.roleId });
  const resolver = (): Promise<ScopeRef> =>
    Promise.resolve({
      scopeType: "organization",
      scopeId: "org-1",
    });

  await grantAccess(
    [{ roles: ["OrgHead"], scope: resolver }],
    authContext(ctx),
  )();
});

Deno.test("Manager bypasses scope checks when listed", async () => {
  const ctx = contextFor(manager, {}, { activeRoleId: manager.roleId });
  let called = false;
  const resolver = () => {
    called = true;
    return null;
  };

  await grantAccess(
    [{ roles: ["Manager"], scope: resolver }],
    authContext(ctx),
  )();
  assertEquals(called, false);
});

Deno.test("Manager still has to be listed in a check", async () => {
  const ctx = contextFor(manager, {}, { activeRoleId: manager.roleId });
  await expectRejectsWith(
    grantAccess([{ roles: ["OrgHead"] }], authContext(ctx))(),
    "You cant do this",
  );
});

Deno.test("a missing feature denies access", async () => {
  const ctx = contextFor(orgHead, { features: [] }, {
    activeRoleId: orgHead.roleId,
  });

  await expectRejectsWith(
    grantAccess(
      [{ roles: ["OrgHead"], features: ["canManageBudget"] }],
      authContext(ctx),
    )(),
    "You cant do this",
  );
});

Deno.test("a present user-level feature grants access", async () => {
  const ctx = contextFor(orgHead, {
    features: [{ feature: "canManageBudget" }],
  }, {
    activeRoleId: orgHead.roleId,
  });

  await grantAccess(
    [{ roles: ["OrgHead"], features: ["canManageBudget"] }],
    authContext(ctx),
  )();
});

Deno.test("a present unit feature grants access within the role scope", async () => {
  const unitHead: ActiveRole = {
    roleId: "role-unit-head",
    name: "UnitHead",
    scopeType: "unit",
    scopeId: "unit-1",
  };
  const ctx = contextFor(unitHead, {
    features: [],
    units: [{ _id: "unit-1", features: [{ feature: "canManageBudget" }] }],
  }, {
    activeRoleId: unitHead.roleId,
  });

  await grantAccess(
    [{ roles: ["UnitHead"], features: ["canManageBudget"] }],
    authContext(ctx),
  )();
});

Deno.test("unscoped Ghost bypasses role, feature and scope checks", async () => {
  const ordinary: ActiveRole = {
    roleId: "role-ghost",
    name: "Ordinary",
  };
  const ctx = contextFor(ordinary, { isGhost: true }, {
    activeRoleId: ordinary.roleId,
  });

  await grantAccess(
    [{
      roles: ["Manager"],
      features: ["canManageBudget"],
      scope: () => ({} as ScopeRef),
    }],
    authContext(ctx),
  )();
});

Deno.test("scoped Ghost must still pass the role gate", async () => {
  const orgHead: ActiveRole = {
    roleId: "role-ghost-orghead",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "org1",
  };
  const ctx = contextFor(orgHead, { isGhost: true }, {
    activeRoleId: orgHead.roleId,
  });

  await expectRejectsWith(
    grantAccess(
      [{
        roles: ["Manager"],
        features: ["canManageBudget"],
        scope: () => ({} as ScopeRef),
      }],
      authContext(ctx),
    )(),
    "You cant do this",
  );
});
