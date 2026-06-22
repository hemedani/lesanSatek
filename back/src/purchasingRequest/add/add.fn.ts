import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const {
    processId,
    requestingUnitId,
    attachmentIds,
    ...rest
  } = set;

  const relations: Record<string, unknown> = {
    process: {
      _ids: new ObjectId(processId as string),
      relatedRelations: { requests: true },
    },
    requester: {
      _ids: user._id,
      relatedRelations: { requests: true },
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
        performedBy: user._id.toString(),
        performedByName: `${user.first_name} ${user.last_name}`,
        performedAt: new Date(),
        details: {},
      }],
    },
    relations,
    projection: get,
  });

  return result;
};
