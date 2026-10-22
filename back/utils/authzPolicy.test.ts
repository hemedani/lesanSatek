import { assertEquals } from "@std/assert";
import {
  type ActiveRole,
  assignableRoles,
  canAssignRole,
  isManagerLike,
  isRoleAllowed,
  isScopeBypass,
  type RoleName,
  scopeMatches,
} from "./authzPolicy.ts";

const ALL_ROLES: RoleName[] = [
  "Manager",
  "Admin",
  "OrgHead",
  "UnitHead",
  "StoreHead",
  "Employee",
  "Ordinary",
];

const sorted = (roles: RoleName[]) => [...roles].sort();

Deno.test("OrgHead can assign UnitHead inside own organization", () => {
  const actor = {
    roleId: "a",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "org1",
  } as const;
  assertEquals(
    canAssignRole(
      actor,
      { name: "UnitHead", scopeType: "unit", scopeId: "u1" },
      { scopeType: "organization", scopeId: "org1" },
    ),
    true,
  );
});

Deno.test("OrgHead cannot assign Manager", () => {
  const actor = {
    roleId: "a",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "org1",
  } as const;
  assertEquals(canAssignRole(actor, { name: "Manager" }, null), false);
});

Deno.test("UnitHead cannot assign outside own unit", () => {
  const actor = {
    roleId: "a",
    name: "UnitHead",
    scopeType: "unit",
    scopeId: "u1",
  } as const;
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "unit", scopeId: "u2" },
      { scopeType: "organization", scopeId: "org1" },
    ),
    false,
  );
});

Deno.test("scopeMatches normalizes string and ObjectId-like values", () => {
  const role = {
    roleId: "a",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "507f1f77bcf86cd799439011",
  } as const;
  assertEquals(
    scopeMatches(role, {
      scopeType: "organization",
      scopeId: "507f1f77bcf86cd799439011",
    }),
    true,
  );
  assertEquals(
    scopeMatches(
      role,
      {
        scopeType: "organization",
        scopeId: {
          toString: () => "507f1f77bcf86cd799439011",
        } as unknown as string,
      },
    ),
    true,
  );
});

Deno.test("scopeMatches rejects null, missing and foreign scopes", () => {
  const role = {
    roleId: "a",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "org1",
  } as const;
  assertEquals(scopeMatches(role, null), false);
  assertEquals(
    scopeMatches(role, { scopeType: "organization", scopeId: "org2" }),
    false,
  );
  assertEquals(
    scopeMatches(role, { scopeType: "unit", scopeId: "org1" }),
    false,
  );
  const unscoped = { roleId: "b", name: "Employee" } as const;
  assertEquals(
    scopeMatches(unscoped, { scopeType: "organization", scopeId: "org1" }),
    false,
  );
});

Deno.test("isManagerLike is true for Manager and Admin only", () => {
  assertEquals(isManagerLike({ roleId: "a", name: "Manager" }), true);
  assertEquals(isManagerLike({ roleId: "a", name: "Admin" }), true);
  assertEquals(isManagerLike({ roleId: "a", name: "OrgHead" }), false);
  assertEquals(isManagerLike({ roleId: "a", name: "UnitHead" }), false);
  assertEquals(isManagerLike({ roleId: "a", name: "Employee" }), false);
});

Deno.test("isRoleAllowed checks the role name against the allow list", () => {
  const role = { roleId: "a", name: "OrgHead" } as const;
  assertEquals(isRoleAllowed(role, ["Manager", "OrgHead"]), true);
  assertEquals(isRoleAllowed(role, ["Manager", "Admin"]), false);
});

Deno.test("assignableRoles matches the authorization matrix", () => {
  assertEquals(
    sorted(assignableRoles({ roleId: "a", name: "Manager" })),
    sorted(ALL_ROLES),
  );
  assertEquals(
    sorted(assignableRoles({ roleId: "a", name: "Admin" })),
    sorted(ALL_ROLES.filter((role) => role !== "Manager")),
  );
  assertEquals(
    sorted(assignableRoles({ roleId: "a", name: "OrgHead" })),
    sorted(["OrgHead", "UnitHead", "Employee", "Ordinary"]),
  );
  assertEquals(
    sorted(assignableRoles({ roleId: "a", name: "UnitHead" })),
    sorted(["Employee", "Ordinary"]),
  );
  assertEquals(assignableRoles({ roleId: "a", name: "StoreHead" }), []);
  assertEquals(assignableRoles({ roleId: "a", name: "Employee" }), []);
  assertEquals(assignableRoles({ roleId: "a", name: "Ordinary" }), []);
});

Deno.test("Manager can assign every role and scope", () => {
  const manager: ActiveRole = { roleId: "a", name: "Manager" };
  for (const name of ALL_ROLES) {
    assertEquals(canAssignRole(manager, { name }, null), true);
    assertEquals(
      canAssignRole(manager, { name, scopeType: "store", scopeId: "s1" }, null),
      true,
    );
  }
});

Deno.test("Admin can assign everything except Manager", () => {
  const admin: ActiveRole = { roleId: "a", name: "Admin" };
  assertEquals(canAssignRole(admin, { name: "Manager" }, null), false);
  assertEquals(canAssignRole(admin, { name: "OrgHead" }, null), true);
  assertEquals(
    canAssignRole(admin, {
      name: "StoreHead",
      scopeType: "store",
      scopeId: "s1",
    }, null),
    true,
  );
  assertEquals(
    canAssignRole(admin, {
      name: "Admin",
      scopeType: "organization",
      scopeId: "org2",
    }, null),
    true,
  );
});

Deno.test("OrgHead scoped assignment rules", () => {
  const actor: ActiveRole = {
    roleId: "a",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "org1",
  };
  assertEquals(canAssignRole(actor, { name: "Employee" }, null), true);
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "unit", scopeId: "u1" },
      { scopeType: "organization", scopeId: "org1" },
    ),
    true,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "unit", scopeId: "u9" },
      { scopeType: "organization", scopeId: "org2" },
    ),
    false,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "OrgHead", scopeType: "organization", scopeId: "org1" },
      null,
    ),
    true,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "OrgHead", scopeType: "organization", scopeId: "org2" },
      null,
    ),
    false,
  );
  assertEquals(canAssignRole(actor, { name: "OrgHead" }, null), false);
  assertEquals(
    canAssignRole(
      actor,
      { name: "OrgHead", scopeType: "unit", scopeId: "u1" },
      { scopeType: "organization", scopeId: "org1" },
    ),
    true,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "OrgHead", scopeType: "unit", scopeId: "u1" },
      { scopeType: "organization", scopeId: "org2" },
    ),
    false,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "organization", scopeId: "org1" },
      null,
    ),
    true,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "organization", scopeId: "org2" },
      null,
    ),
    false,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "store", scopeId: "s1" },
      null,
    ),
    false,
  );
  assertEquals(canAssignRole(actor, { name: "StoreHead" }, null), false);
  assertEquals(canAssignRole(actor, { name: "Admin" }, null), false);
});

Deno.test("UnitHead scoped assignment rules", () => {
  const actor: ActiveRole = {
    roleId: "a",
    name: "UnitHead",
    scopeType: "unit",
    scopeId: "u1",
  };
  assertEquals(canAssignRole(actor, { name: "Employee" }, null), true);
  assertEquals(canAssignRole(actor, { name: "Ordinary" }, null), true);
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "unit", scopeId: "u1" },
      { scopeType: "organization", scopeId: "org1" },
    ),
    true,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "unit", scopeId: "u2" },
      { scopeType: "organization", scopeId: "org1" },
    ),
    false,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "organization", scopeId: "org1" },
      null,
    ),
    false,
  );
  assertEquals(
    canAssignRole(
      actor,
      { name: "Employee", scopeType: "store", scopeId: "s1" },
      null,
    ),
    false,
  );
  assertEquals(canAssignRole(actor, { name: "UnitHead" }, null), false);
  assertEquals(canAssignRole(actor, { name: "OrgHead" }, null), false);
});

Deno.test("StoreHead, Employee and Ordinary cannot assign roles", () => {
  for (const name of ["StoreHead", "Employee", "Ordinary"] as const) {
    const actor: ActiveRole = { roleId: "a", name };
    for (const target of ALL_ROLES) {
      assertEquals(canAssignRole(actor, { name: target }, null), false);
    }
  }
});

Deno.test("isScopeBypass keeps Manager and Admin unrestricted", () => {
  const user = { isGhost: false };

  assertEquals(isScopeBypass({ roleId: "m", name: "Manager" }, user), true);
  assertEquals(isScopeBypass({ roleId: "a", name: "Admin" }, user), true);
});

Deno.test("isScopeBypass only lets unscoped ghost roles through", () => {
  const ghost = { isGhost: true };

  assertEquals(isScopeBypass({ roleId: "o", name: "Ordinary" }, ghost), true);
  assertEquals(
    isScopeBypass(
      {
        roleId: "oh",
        name: "OrgHead",
        scopeType: "organization",
        scopeId: "org1",
      },
      ghost,
    ),
    false,
  );
  assertEquals(
    isScopeBypass(
      { roleId: "uh", name: "UnitHead", scopeType: "unit", scopeId: "u1" },
      ghost,
    ),
    false,
  );
  assertEquals(
    isScopeBypass(
      { roleId: "broken", name: "OrgHead", scopeType: "organization" },
      ghost,
    ),
    false,
  );
});

Deno.test("isScopeBypass never opens scopes for non-ghost users", () => {
  assertEquals(
    isScopeBypass(
      { roleId: "o", name: "Ordinary" },
      { isGhost: false },
    ),
    false,
  );
});
