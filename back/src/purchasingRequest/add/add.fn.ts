import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const {
    activeRoleId,
    processId,
    wareModelId,
    requestingUnitId,
    attachmentIds,
    ...rest
  } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const relations: Record<string, unknown> = {
    process: {
      _ids: new ObjectId(processId as string),
      relatedRelations: { requests: true },
    },
    requester: {
      _ids: user._id,
      relatedRelations: { requests: true },
    },
    wareModel: {
      _ids: new ObjectId(wareModelId as string),
      relatedRelations: { purchasingRequests: true },
    },
  };

  if (requestingUnitId) {
    relations.requestingUnit = {
      _ids: new ObjectId(requestingUnitId as string),
      relatedRelations: { purchaseRequests: true },
    };
  }

  if (attachmentIds && attachmentIds.length > 0) {
    relations.attachments = {
      _ids: (attachmentIds as string[]).map((id: string) => new ObjectId(id)),
      relatedRelations: {},
    };
  }

  const result = await purchasingRequest.insertOne({
    doc: {
      ...rest,
      history: [{
        action: "created",
        performed: {
          by: user._id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          at: new Date(),
          role: activeRole ? {
            id: activeRole.roleId,
            name: activeRole.name,
            scopeType: activeRole.scopeType,
            scopeId: activeRole.scopeId,
          } : { id: "", name: "" },
        },
        details: {},
      }],
    },
    relations,
    projection: get,
  });

  return result;
};
