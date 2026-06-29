import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, requestingUnitId, attachmentIds, tenderId },
    get,
  } = body.details;

  const requestId = new ObjectId(_id);

  if (requestingUnitId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        requestingUnit: {
          _ids: new ObjectId(requestingUnitId as string),
          relatedRelations: {
            purchaseRequests: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (attachmentIds !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        attachments: {
          _ids: (attachmentIds as string[]).map((id: string) => new ObjectId(id)),
          relatedRelations: {},
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (tenderId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        tender: {
          _ids: new ObjectId(tenderId as string),
          relatedRelations: { purchasingRequest: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await purchasingRequest.findOne({
    filters: { _id: requestId },
    projection: get,
  });
};
