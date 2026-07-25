import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const {
    activeRoleId,
    wareModelId,
    title,
    description,
    quantity,
  } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );

  const requestingUnitId = activeRole?.scopeType === "unit" && activeRole?.scopeId
    ? activeRole.scopeId
    : undefined;

  if (!requestingUnitId) {
    throwError("Your active role does not have an associated unit.");
    return;
  }

  const userAny = user as Record<string, unknown>;
  const userOrgs = userAny.organizations as Array<Record<string, unknown>> | undefined;
  if (!userOrgs || userOrgs.length === 0) {
    throwError("Could not determine organization. Please ensure you belong to an organization.");
    return;
  }
  const orgId = userOrgs[0]._id as ObjectId;

  const result = await purchasingRequest.insertOne({
    doc: {
      title,
      description,
      quantity,
      status: "Draft",
      history: [{
        action: "created",
        performed: {
          by: user._id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          at: new Date(),
          role: activeRole
            ? {
              id: activeRole.roleId,
              name: activeRole.name,
              scopeType: activeRole.scopeType,
              scopeId: activeRole.scopeId,
            }
            : { id: "", name: "" },
        },
        details: {},
      }],
    },
    relations: {
      requester: {
        _ids: user._id,
        relatedRelations: { requests: true },
      },
      wareModel: {
        _ids: new ObjectId(wareModelId as string),
        relatedRelations: { purchasingRequests: true },
      },
      requestingUnit: {
        _ids: new ObjectId(requestingUnitId),
        relatedRelations: { purchaseRequests: true },
      },
      organization: {
        _ids: orgId,
        relatedRelations: { purchaseRequests: true },
      },
    },
    projection: get,
  });

  return result;
};
