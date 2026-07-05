import { type ActFn, ObjectId } from "lesan";
import { tender, purchasingRequest } from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, purchasingRequestId, createdById, ...rest } = set;

  const pr = await purchasingRequest.findOne({
    filters: { _id: new ObjectId(purchasingRequestId as string) },
    projection: { _id: 1, status: 1 },
  }) as Record<string, unknown>;
  if (!pr) throwError("Purchasing request not found");
  if (!["Pending", "InProgress"].includes(pr.status as string)) {
    throwError("Can only create tender for an active purchasing request (Pending/InProgress)");
  }

  const relations: Record<string, unknown> = {};

  relations.purchasingRequest = {
    _ids: new ObjectId(purchasingRequestId as string),
    relatedRelations: {
      tender: true,
    },
  };

  if (createdById) {
    relations.createdBy = {
      _ids: new ObjectId(createdById as string),
      relatedRelations: {
        createdTenders: true,
      },
    };
  }

  return await tender.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
