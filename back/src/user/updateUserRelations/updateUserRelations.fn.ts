import { type ActFn, ObjectId } from "lesan";
import { coreApp, unit, user } from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import {
  loadUserTargetContextForActor,
  type UserTargetContext,
} from "../shared/assignRoles.ts";
import type { MyContext } from "@lib";

type ContextUser = {
  _id?: unknown;
  isGhost?: boolean;
  roles?: ActiveRole[];
  units?: {
    _id?: unknown;
    organization?: { _id?: unknown } | null;
  }[];
};

const idsOfPayload = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value.map((id) => String(id));
};

const uniqueIds = (ids: string[]): string[] => [...new Set(ids)];

const organizationIdOfRole = (
  activeRole: ActiveRole,
  contextUser: ContextUser,
): string | null => {
  if (activeRole.scopeType === "organization" && activeRole.scopeId) {
    return String(activeRole.scopeId);
  }

  if (activeRole.scopeType === "unit" && activeRole.scopeId) {
    const scopedUnit = (contextUser.units ?? []).find((unit) =>
      String(unit._id) === String(activeRole.scopeId)
    );
    const organizationId = scopedUnit?.organization?._id;

    return organizationId === null || organizationId === undefined
      ? null
      : String(organizationId);
  }

  return null;
};

const unitOrganizationIdOf = async (unitId: string): Promise<string | null> => {
  const unitDoc = await unit.findOne({
    filters: { _id: new ObjectId(unitId) },
    projection: { organization: { _id: 1 } },
  }) as { organization?: { _id?: unknown } | null } | null;

  const organizationId = unitDoc?.organization?._id;

  return organizationId === null || organizationId === undefined
    ? null
    : String(organizationId);
};

const unitIsInsideActorScope = async (
  unitId: string,
  activeRole: ActiveRole,
  actorOrganizationId: string,
  targetContext: UserTargetContext,
): Promise<boolean> => {
  if (activeRole.name === "UnitHead") {
    return activeRole.scopeType === "unit" &&
      Boolean(activeRole.scopeId) &&
      String(activeRole.scopeId) === unitId;
  }

  const organizationId = targetContext.unitOrganizationIds.get(unitId) ??
    await unitOrganizationIdOf(unitId);

  return organizationId === actorOrganizationId;
};

export const updateUserRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, activeRoleId, avatar, organizations, state, city, units },
    get,
  } = body.details;

  const { user: contextUser }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;
  const actor = contextUser as unknown as ContextUser;

  const activeRole = (actor.roles ?? []).find((role) =>
    role.roleId === activeRoleId
  );

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const modelId = new ObjectId(_id as string);
  const isBypass = Boolean(actor.isGhost) || isManagerLike(activeRole);
  const actorOrganizationId = organizationIdOfRole(activeRole, actor);
  const requestedOrganizations = organizations
    ? idsOfPayload(organizations)
    : null;
  const requestedUnits = units ? idsOfPayload(units) : null;

  let targetContext: UserTargetContext | null = null;

  if (!isBypass && (requestedOrganizations || requestedUnits)) {
    if (!actorOrganizationId) {
      throwError("You cant do this");
      return;
    }

    targetContext = await loadUserTargetContextForActor(
      modelId,
      activeRole,
      Boolean(actor.isGhost),
    );

    if (requestedOrganizations) {
      for (const organizationId of requestedOrganizations) {
        if (
          organizationId !== actorOrganizationId &&
          !targetContext.organizationIds.has(organizationId)
        ) {
          throwError("You cant do this");
          return;
        }
      }
    }

    if (requestedUnits) {
      for (const unitId of requestedUnits) {
        const alreadyMember = targetContext.unitIds.has(unitId);
        const insideActorScope = await unitIsInsideActorScope(
          unitId,
          activeRole,
          actorOrganizationId,
          targetContext,
        );

        if (!alreadyMember && !insideActorScope) {
          throwError("You cant do this");
          return;
        }
      }
    }
  }

  if (avatar) {
    await user.addRelation({
      filters: { _id: modelId },
      relations: {
        avatar: {
          _ids: new ObjectId(avatar as string),
          relatedRelations: {},
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (organizations) {
    const requested = requestedOrganizations ?? [];
    const preserved: string[] = [];

    if (!isBypass) {
      if (!targetContext) {
        throwError("You cant do this");
        return;
      }

      for (const organizationId of targetContext.organizationIds) {
        if (organizationId !== actorOrganizationId) {
          preserved.push(organizationId);
        }
      }
    }

    await user.addRelation({
      filters: { _id: modelId },
      relations: {
        organizations: {
          _ids: uniqueIds([...requested, ...preserved]).map((id) =>
            new ObjectId(id)
          ),
          relatedRelations: {
            users: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (state) {
    await user.addRelation({
      filters: { _id: modelId },
      relations: {
        state: {
          _ids: new ObjectId(state as string),
          relatedRelations: {
            users: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (city) {
    await user.addRelation({
      filters: { _id: modelId },
      relations: {
        city: {
          _ids: new ObjectId(city as string),
          relatedRelations: {
            users: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (units) {
    const requested = requestedUnits ?? [];
    const preserved: string[] = [];

    if (!isBypass) {
      if (!targetContext) {
        throwError("You cant do this");
        return;
      }

      for (const unitId of targetContext.unitIds) {
        if (activeRole.name === "UnitHead") {
          if (String(unitId) !== String(activeRole.scopeId)) {
            preserved.push(unitId);
          }
          continue;
        }

        const unitOrganizationId = targetContext.unitOrganizationIds.get(
          unitId,
        ) ?? null;

        if (unitOrganizationId !== actorOrganizationId) {
          preserved.push(unitId);
        }
      }
    }

    await user.addRelation({
      filters: { _id: modelId },
      relations: {
        units: {
          _ids: uniqueIds([...requested, ...preserved]).map((id) =>
            new ObjectId(id)
          ),
          relatedRelations: {
            members: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await user.findOne({
    filters: { _id: modelId },
    projection: get,
  });
};
