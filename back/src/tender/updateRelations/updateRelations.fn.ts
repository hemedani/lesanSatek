import { type ActFn, ObjectId } from "lesan";
import { tender, tenderOffer } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, purchasingRequestId, createdById, assignedVendors, assignedVendorsId, offers },
    get,
  } = body.details;

  const tenderId = new ObjectId(_id);

  if (purchasingRequestId !== undefined) {
    if (purchasingRequestId) {
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
    } else {
      await tender.findOneAndUpdate({
        filter: { _id: tenderId },
        update: { $unset: { purchasingRequest: "" } },
        projection: get,
      });
    }
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

  const vendorIds: string[] | undefined = assignedVendors as string[] ||
    (assignedVendorsId ? [assignedVendorsId as string] : undefined);

  if (vendorIds !== undefined) {
    await tender.addRelation({
      filters: { _id: tenderId },
      relations: {
        assignedVendors: {
          _ids: vendorIds.map((id: string) => new ObjectId(id)),
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
    if ((offers as string[]).length > 0) {
      const offerIds = (offers as string[]).map((id: string) => new ObjectId(id));
      await tenderOffer.addRelation({
        filters: { _id: { $in: offerIds } },
        relations: {
          tender: {
            _ids: tenderId,
            relatedRelations: { offers: true },
          },
        },
        projection: get,
        replace: true,
      });
    } else {
      const linkedOffers = await tenderOffer.aggregation({
        pipeline: [{ $match: { "tender._id": tenderId } }],
        projection: { _id: 1 },
      }).toArray();
      for (const offer of linkedOffers) {
        await tenderOffer.findOneAndUpdate({
          filter: { _id: offer._id as ObjectId },
          update: { $unset: { tender: "" } },
          projection: { _id: 1 },
        });
      }
    }
  }

  return await tender.findOne({
    filters: { _id: tenderId },
    projection: get,
  });
};
