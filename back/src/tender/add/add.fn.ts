import { type ActFn, ObjectId } from "lesan";
import { tender } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, purchasingRequestId, createdById, ...rest } = set;

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
