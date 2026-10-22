import { ObjectId } from "lesan";
import { type ActiveRole, isScopeBypass } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { UserTargetContext } from "./assignRoles.ts";

type ActorUser = { isGhost?: boolean } | undefined;

export type UserManagementDeps = {
  loadTargetContext?: (
    userId: string,
    actor: ActiveRole,
  ) => Promise<UserTargetContext>;
  loadTargetRoles?: (userId: string) => Promise<string[]>;
};

const ORGHEAD_FORBIDDEN_UPDATE_FIELDS = [
  "password",
  "features",
  "allowWareTypeIds",
  "allowWareClassIds",
  "allowWareGroupIds",
  "allowWareModelIds",
] as const;

const PRIVILEGED_ROLES = new Set(["Manager", "Admin"]);

const targetObjectId = (userId: unknown): ObjectId => {
  if (userId === null || userId === undefined || userId === "") {
    throwError("You cant do this");
  }

  try {
    return new ObjectId(String(userId));
  } catch {
    throw new Error("You cant do this");
  }
};

type CoreAppModule = {
  user: {
    findOne: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

const loadTargetRoleNames = async (userId: string): Promise<string[]> => {
  const { user } = await import("../../../mod.ts") as unknown as CoreAppModule;
  const target = await user.findOne({
    filters: { _id: targetObjectId(userId) },
    projection: { roles: 1 },
  }) as { roles?: { name?: unknown }[] } | null;

  if (!target) throw new Error("You cant do this");

  return (target.roles ?? []).map((role) => String(role.name));
};

const assertOrgHeadCanManageTarget = async (
  activeRole: ActiveRole,
  actorUser: ActorUser,
  targetUserId: unknown,
  deps: UserManagementDeps,
): Promise<void> => {
  if (isScopeBypass(activeRole, actorUser)) return;

  if (activeRole.name !== "OrgHead") {
    throwError("You cant do this");
    return;
  }

  if (activeRole.scopeType !== "organization" || !activeRole.scopeId) {
    throwError("You cant do this");
    return;
  }

  if (
    targetUserId === null || targetUserId === undefined || targetUserId === ""
  ) {
    throwError("You cant do this");
    return;
  }

  const userId = String(targetUserId);
  const loadContext = deps.loadTargetContext ??
    (async (id: string, actor: ActiveRole) => {
      const { loadUserTargetContextForActor } = await import(
        "./assignRoles.ts"
      );
      return await loadUserTargetContextForActor(id, actor, false);
    });

  const target = await loadContext(userId, activeRole);

  if (!target.organizationIds.has(String(activeRole.scopeId))) {
    throwError("You cant do this");
  }

  const roleNames = await (deps.loadTargetRoles ?? loadTargetRoleNames)(
    userId,
  );

  if (roleNames.some((name) => PRIVILEGED_ROLES.has(name))) {
    throwError("You cant do this");
  }
};

export const assertCanUpdateUser = async (
  activeRole: ActiveRole,
  actorUser: ActorUser,
  targetUserId: unknown,
  set: Record<string, unknown> | undefined,
  deps: UserManagementDeps = {},
): Promise<void> => {
  await assertOrgHeadCanManageTarget(
    activeRole,
    actorUser,
    targetUserId,
    deps,
  );

  if (isScopeBypass(activeRole, actorUser)) return;

  for (const field of ORGHEAD_FORBIDDEN_UPDATE_FIELDS) {
    if (set?.[field] !== undefined) {
      throwError("You cant do this");
    }
  }
};

export const assertCanRemoveUser = async (
  activeRole: ActiveRole,
  actorUser: ActorUser,
  targetUserId: unknown,
  deps: UserManagementDeps = {},
): Promise<void> => {
  await assertOrgHeadCanManageTarget(
    activeRole,
    actorUser,
    targetUserId,
    deps,
  );
};

const setOf = (body: unknown): Record<string, unknown> => {
  const details = (body as { details?: { set?: Record<string, unknown> } })
    ?.details;

  return details?.set ?? {};
};

export const assertOrgHeadCanUpdateUser = async (): Promise<void> => {
  const { user: actorUser, activeRole, body } = await getAuth();
  const set = setOf(body);

  await assertCanUpdateUser(
    activeRole,
    actorUser,
    set._id,
    set,
  );
};

export const assertOrgHeadCanRemoveUser = async (): Promise<void> => {
  const { user: actorUser, activeRole, body } = await getAuth();
  const set = setOf(body);

  await assertCanRemoveUser(
    activeRole,
    actorUser,
    set._id,
  );
};
