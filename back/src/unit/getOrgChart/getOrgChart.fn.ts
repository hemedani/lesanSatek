import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { unit, organization, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const getOrgChartFn: ActFn = async (body) => {
  const {
    set: { activeRoleId, orgId: paramOrgId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  let effectiveOrgId: ObjectId | null = null;

  if (activeRole.name === "Manager" || activeRole.name === "Admin") {
    if (paramOrgId) {
      effectiveOrgId = new ObjectId(paramOrgId as string);
    } else {
      throwError("orgId is required for Manager/Admin role");
      return;
    }
  } else if (activeRole.scopeType === "organization" && activeRole.scopeId) {
    effectiveOrgId = new ObjectId(activeRole.scopeId);
  } else {
    throwError("Role must have an organization scope or orgId must be provided");
    return;
  }

  const result: Record<string, unknown> = {};

  const tasks: Promise<void>[] = [];

  if (get.units === 1) {
    tasks.push(
      unit.aggregation({
        pipeline: [
          { $match: { "organization._id": effectiveOrgId } },
          { $sort: { _id: 1 } },
        ],
        projection: {
          _id: 1,
          name: 1,
          enName: 1,
          description: 1,
          isActive: 1,
          type: 1,
          head: { _id: 1, first_name: 1, last_name: 1 },
          parentUnit: { _id: 1, name: 1 },
        },
      }).toArray().then((arr) => {
        result.units = arr;
        result.totalCount = arr.length;
      }),
    );
  }

  if (get.organization === 1) {
    tasks.push(
      organization.aggregation({
        pipeline: [
          { $match: { _id: effectiveOrgId } },
          {
            $project: {
              _id: 1,
              name: 1,
              enName: 1,
              description: 1,
              isActive: 1,
              logo: { _id: 1, name: 1 },
            },
          },
        ],
      }).toArray().then((arr) => {
        result.organization = arr[0] || null;
      }),
    );
  }

  await Promise.all(tasks);
  return result;
};
