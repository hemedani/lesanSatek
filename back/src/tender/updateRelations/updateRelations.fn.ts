import { type ActFn, ObjectId } from "lesan";
import { tender } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, purchasingRequestId, createdById, assignedVendors, offers },
    get,
  } = body.details;

  const tenderId = new ObjectId(_id);

  if (purchasingRequestId !== undefined) {
    await tender.addRelation({
      filters: { _id: tenderId },
      relations: {
        purchasingRequest: {
          _ids: new ObjectId(purchasingRequestId as string),
          relatedRelations: {
            tender: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (createdById !== undefined) {
    await tender.addRelation({
      filters: { _id: tenderId },
      relations: {
        createdBy: {
          _ids: new ObjectId(createdById as string),
          relatedRelations: {
            createdTenders: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (assignedVendors !== undefined) {
    await tender.addRelation({
      filters: { _id: tenderId },
      relations: {
        assignedVendors: {
          _ids: (assignedVendors as string[]).map((id: string) => new ObjectId(id)),
          relatedRelations: {
            tenders: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (offers !== undefined) {
    await tender.addRelation({
      filters: { _id: tenderId },
      relations: {
        offers: {
          _ids: (offers as string[]).map((id: string) => new ObjectId(id)),
          relatedRelations: {
            tender: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await tender.findOne({
    filters: { _id: tenderId },
    projection: get,
  });
};
