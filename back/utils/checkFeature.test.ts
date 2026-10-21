import { assertEquals } from "@std/assert";
import { hasFeature } from "./checkFeature.ts";

const feature = "canRegisterPurchaseRequest" as const;

Deno.test("user-level feature applies regardless of active role", () => {
  const user = {
    features: [{ feature }],
    units: [],
  };
  const role = {
    roleId: "r",
    name: "Employee",
    scopeType: "unit",
    scopeId: "u1",
  } as const;

  assertEquals(hasFeature(user as never, feature, role), true);
});

Deno.test("unit feature applies only inside the active role scope", () => {
  const user = {
    features: [],
    units: [
      { _id: "u1", features: [{ feature }] },
      { _id: "u2", features: [{ feature }] },
    ],
  };
  const role = {
    roleId: "r",
    name: "UnitHead",
    scopeType: "unit",
    scopeId: "u1",
  } as const;
  assertEquals(hasFeature(user as never, feature, role), true);

  const otherRole = {
    roleId: "r2",
    name: "UnitHead",
    scopeType: "unit",
    scopeId: "u3",
  } as const;
  assertEquals(hasFeature(user as never, feature, otherRole), false);
});

Deno.test("unit feature does not leak from another unit in the same scope", () => {
  const user = {
    features: [],
    units: [
      { _id: "u1", features: [] },
      { _id: "u2", features: [{ feature }] },
    ],
  };
  const role = {
    roleId: "r",
    name: "UnitHead",
    scopeType: "unit",
    scopeId: "u1",
  } as const;

  assertEquals(hasFeature(user as never, feature, role), false);
});

Deno.test("organization scope considers units in the active organization", () => {
  const user = {
    features: [],
    units: [
      {
        _id: "u1",
        organization: { _id: "org1" },
        features: [{ feature }],
      },
      {
        _id: "u2",
        organization: { _id: "org2" },
        features: [{ feature }],
      },
    ],
  };
  const role = {
    roleId: "r",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "org1",
  } as const;

  assertEquals(hasFeature(user as never, feature, role), true);
});

Deno.test("organization scope ignores units from other organizations", () => {
  const user = {
    features: [],
    units: [
      {
        _id: "u1",
        organization: { _id: "org1" },
        features: [],
      },
      {
        _id: "u2",
        organization: { _id: "org2" },
        features: [{ feature }],
      },
    ],
  };
  const role = {
    roleId: "r",
    name: "OrgHead",
    scopeType: "organization",
    scopeId: "org1",
  } as const;

  assertEquals(hasFeature(user as never, feature, role), false);
});

Deno.test("Manager and Admin bypass feature checks", () => {
  const user = { features: [], units: [] };
  const manager = { roleId: "m", name: "Manager" } as const;
  const admin = { roleId: "a", name: "Admin" } as const;

  assertEquals(hasFeature(user as never, feature, manager), true);
  assertEquals(hasFeature(user as never, feature, admin), true);
});

Deno.test("legacy two-argument call still considers any unit feature", () => {
  const user = {
    features: [],
    units: [
      { _id: "u1", organization: { _id: "org1" }, features: [] },
      { _id: "u2", organization: { _id: "org2" }, features: [{ feature }] },
    ],
  };

  assertEquals(hasFeature(user as never, feature), true);
});

Deno.test("missing role scope considers user features only", () => {
  const user = {
    features: [],
    units: [{ _id: "u1", features: [{ feature }] }],
  };
  const role = { roleId: "r", name: "Employee" } as const;

  assertEquals(hasFeature(user as never, feature, role), false);
});
