import type { ActFn } from "lesan";
import { getAuth } from "@lib";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { assignRolesToUser, type RoleInput } from "../shared/assignRoles.ts";

export const addOrRemoveRolesFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { _id, addRoles, removeRoles } = set;

  const { activeRole, user: actorUser } = await getAuth();

  return await assignRolesToUser({
    userId: _id as string,
    actor: activeRole,
    addRoles: addRoles as RoleInput[] | undefined,
    removeRoles: removeRoles as RoleInput[] | undefined,
    get: get as Record<string, unknown>,
    isGhost: isScopeBypass(activeRole, actorUser),
  });
};
