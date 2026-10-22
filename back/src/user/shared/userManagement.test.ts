import { assertEquals } from "@std/assert";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import type { UserTargetContext } from "./assignRoles.ts";
import {
  assertCanRemoveUser,
  assertCanUpdateUser,
  type UserManagementDeps,
} from "./userManagement.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";
const TARGET_ID = "507f1f77bcf86cd799439011";

const role = (overrides: Partial<ActiveRole>): ActiveRole => ({
  roleId: "role-1",
  name: "Employee",
  ...overrides,
});

const orgHead = role({
  name: "OrgHead",
  scopeType: "organization",
  scopeId: ORG_OWN,
});

const context = (organizationIds: string[] = [ORG_OWN]): UserTargetContext => ({
  organizationIds: new Set(organizationIds),
  unitIds: new Set(),
  unitOrganizationIds: new Map(),
  scope: organizationIds[0]
    ? { scopeType: "organization", scopeId: organizationIds[0] }
    : null,
});

const deps = (
  target: UserTargetContext | Error = context(),
  targetRoles: string[] = ["Employee"],
): UserManagementDeps => ({
  loadTargetContext: () => {
    if (target instanceof Error) return Promise.reject(target);
    return Promise.resolve(target);
  },
  loadTargetRoles: () => Promise.resolve(targetRoles),
});

const expectRejectsWith = async (
  promise: Promise<unknown>,
  message = "You cant do this",
) => {
  try {
    await promise;
  } catch (error) {
    assertEquals((error as Error).message, message);
    return;
  }
  throw new Error(`Expected rejection with "${message}"`);
};

Deno.test("Manager and Admin update and remove any user", async () => {
  for (const name of ["Manager", "Admin"] as const) {
    const activeRole = role({ name });

    await assertCanUpdateUser(
      activeRole,
      { isGhost: false },
      TARGET_ID,
      { password: "new-password" },
      deps(new Error("should not load target")),
    );
    await assertCanRemoveUser(
      activeRole,
      { isGhost: false },
      TARGET_ID,
      deps(new Error("should not load target"), ["Manager"]),
    );
  }
});

Deno.test("OrgHead updates a user in its organization", async () => {
  await assertCanUpdateUser(
    orgHead,
    { isGhost: false },
    TARGET_ID,
    { first_name: "New" },
    deps(),
  );
});

Deno.test("OrgHead cannot update a user from another organization", async () => {
  await expectRejectsWith(
    assertCanUpdateUser(
      orgHead,
      { isGhost: false },
      TARGET_ID,
      { first_name: "New" },
      deps(context([ORG_FOREIGN])),
    ),
  );
});

Deno.test("OrgHead removes a same-org non-privileged user", async () => {
  await assertCanRemoveUser(
    orgHead,
    { isGhost: false },
    TARGET_ID,
    deps(),
  );
});

Deno.test("OrgHead cannot manage a user holding Manager or Admin", async () => {
  for (const privilegedRole of ["Manager", "Admin"]) {
    await expectRejectsWith(
      assertCanUpdateUser(
        orgHead,
        { isGhost: false },
        TARGET_ID,
        { first_name: "New" },
        deps(context(), [privilegedRole]),
      ),
    );
    await expectRejectsWith(
      assertCanRemoveUser(
        orgHead,
        { isGhost: false },
        TARGET_ID,
        deps(context(), [privilegedRole]),
      ),
    );
  }
});

Deno.test("OrgHead cannot remove a user from another organization", async () => {
  await expectRejectsWith(
    assertCanRemoveUser(
      orgHead,
      { isGhost: false },
      TARGET_ID,
      deps(context([ORG_FOREIGN])),
    ),
  );
});

Deno.test("OrgHead cannot update password, features, or ware allow-lists", async () => {
  const forbiddenFields = [
    "password",
    "features",
    "allowWareTypeIds",
    "allowWareClassIds",
    "allowWareGroupIds",
    "allowWareModelIds",
  ];

  for (const field of forbiddenFields) {
    await expectRejectsWith(
      assertCanUpdateUser(
        orgHead,
        { isGhost: false },
        TARGET_ID,
        { [field]: [] },
        deps(),
      ),
    );
  }
});

Deno.test("ghost OrgHead is scoped like a non-ghost OrgHead", async () => {
  const ghost = { isGhost: true };

  await assertCanUpdateUser(
    orgHead,
    ghost,
    TARGET_ID,
    { first_name: "New" },
    deps(),
  );
  await expectRejectsWith(
    assertCanUpdateUser(
      orgHead,
      ghost,
      TARGET_ID,
      { first_name: "New" },
      deps(context([ORG_FOREIGN])),
    ),
  );
  await expectRejectsWith(
    assertCanRemoveUser(
      orgHead,
      ghost,
      TARGET_ID,
      deps(context(), ["Admin"]),
    ),
  );
  await expectRejectsWith(
    assertCanUpdateUser(
      orgHead,
      ghost,
      TARGET_ID,
      { password: "new-password" },
      deps(),
    ),
  );
});

Deno.test("ghost Admin still bypasses user management checks", async () => {
  const admin = role({ name: "Admin" });
  const ghost = { isGhost: true };

  await assertCanUpdateUser(
    admin,
    ghost,
    TARGET_ID,
    { password: "new-password" },
    deps(new Error("should not load target")),
  );
  await assertCanRemoveUser(
    admin,
    ghost,
    TARGET_ID,
    deps(new Error("should not load target"), ["Manager"]),
  );
});
