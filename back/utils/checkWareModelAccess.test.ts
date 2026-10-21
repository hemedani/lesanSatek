import { assertEquals, assertRejects } from "@std/assert";
import {
  assertWareModelAccess,
  type WareModelRef,
} from "./checkWareModelAccess.ts";
import type { ActiveRole } from "./authzPolicy.ts";

const wareModel: WareModelRef = {
  _id: "model-1",
  wareType: { _id: "type-1" },
  wareClass: { _id: "class-1" },
  wareGroup: { _id: "group-1" },
};

const unitHeadRole: ActiveRole = {
  roleId: "role-unit",
  name: "UnitHead",
  scopeType: "unit",
  scopeId: "unit-1",
};

Deno.test("manager and admin bypass ware model restrictions", async () => {
  const user = {
    allowWareModelIds: ["other-model"],
    units: [],
  };

  await assertWareModelAccess(
    user,
    {
      roleId: "role-manager",
      name: "Manager",
    },
    wareModel,
  );

  await assertWareModelAccess(
    user,
    {
      roleId: "role-admin",
      name: "Admin",
    },
    wareModel,
  );
});

Deno.test("ghost users bypass ware model restrictions", async () => {
  await assertWareModelAccess(
    {
      isGhost: true,
      allowWareModelIds: ["other-model"],
      units: [],
    },
    unitHeadRole,
    wareModel,
  );
});

Deno.test("empty allow lists grant access", async () => {
  await assertWareModelAccess(
    {
      allowWareTypeIds: [],
      allowWareClassIds: [],
      allowWareGroupIds: [],
      allowWareModelIds: [],
      units: [],
    },
    unitHeadRole,
    wareModel,
  );
});

Deno.test("a disallowed model is rejected with the standard message", async () => {
  await assertRejects(
    () =>
      assertWareModelAccess(
        {
          allowWareModelIds: ["other-model"],
          units: [],
        },
        unitHeadRole,
        wareModel,
        {
          loadUnit: () => Promise.resolve(null),
        },
      ),
    Error,
    "You cant do this",
  );
});

Deno.test("an allowed model passes", async () => {
  await assertWareModelAccess(
    {
      allowWareModelIds: ["model-1"],
      units: [],
    },
    unitHeadRole,
    wareModel,
  );
});

Deno.test("allow lists at any hierarchy level are honored", async () => {
  await assertWareModelAccess(
    { allowWareTypeIds: ["type-1"], units: [] },
    unitHeadRole,
    wareModel,
  );

  await assertRejects(
    () =>
      assertWareModelAccess(
        { allowWareTypeIds: ["type-2"], units: [] },
        unitHeadRole,
        wareModel,
        { loadUnit: () => Promise.resolve(null) },
      ),
    Error,
    "You cant do this",
  );
});

Deno.test("the active unit's restrictions apply to UnitHead", async () => {
  await assertRejects(
    () =>
      assertWareModelAccess(
        {
          units: [
            {
              _id: "unit-1",
              allowWareModelIds: ["other-model"],
            },
          ],
        },
        unitHeadRole,
        wareModel,
        {
          loadUnit: () =>
            Promise.resolve({
              _id: "unit-1",
              allowWareModelIds: ["other-model"],
            }),
        },
      ),
    Error,
    "You cant do this",
  );
});

Deno.test("active organization unit restrictions apply to OrgHead", async () => {
  await assertRejects(
    () =>
      assertWareModelAccess(
        { units: [] },
        {
          roleId: "role-org",
          name: "OrgHead",
          scopeType: "organization",
          scopeId: "org-1",
        },
        wareModel,
        {
          loadOrganizationUnits: () =>
            Promise.resolve([
              {
                _id: "unit-1",
                allowWareModelIds: ["other-model"],
              },
            ]),
        },
      ),
    Error,
    "You cant do this",
  );
});

Deno.test("unitCanAccessWareModel treats unset lists as unrestricted", async () => {
  const { unitCanAccessWareModel } = await import(
    "./checkWareModelAccess.ts"
  );

  assertEquals(unitCanAccessWareModel({}, wareModel), true);
  assertEquals(
    unitCanAccessWareModel(
      { allowWareModelIds: ["model-1"] },
      wareModel,
    ),
    true,
  );
});
