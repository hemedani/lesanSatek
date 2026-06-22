import { type ActFn, ObjectId } from "lesan";
import { tenderOffer } from "../../../mod.ts";

export const submitFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, tenderId, storeId, ...rest } = set;

  const relations: Record<string, unknown> = {};

  relations.tender = {
    _ids: new ObjectId(tenderId as string),
    relatedRelations: {
      offers: true,
    },
  };

  if (storeId) {
    relations.store = {
      _ids: new ObjectId(storeId as string),
      relatedRelations: {
        tenderOffers: true,
      },
    };
  }

  return await tenderOffer.insertOne({
    doc: {
      ...rest,
      submittedAt: new Date(rest.submittedAt as string || new Date()),
    },
    relations,
    projection: get,
  });
};
