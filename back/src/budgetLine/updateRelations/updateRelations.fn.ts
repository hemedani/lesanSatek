import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, fiscalYearId },
    get,
  } = body.details;

  const modelId = new ObjectId(_id);

  if (fiscalYearId !== undefined) {
    if (fiscalYearId) {
      await budgetLine.addRelation({
        filters: { _id: modelId },
        relations: {
          fiscalYear: {
            _ids: new ObjectId(fiscalYearId as string),
            relatedRelations: { budgetLines: true },
          },
        },
        projection: get,
        replace: true,
      });
    } else {
      await budgetLine.findOneAndUpdate({
        filter: { _id: modelId },
        update: { $unset: { fiscalYear: "" } },
        projection: get,
      });
    }
  }

  return await budgetLine.findOne({
    filters: { _id: modelId },
    projection: get,
  });
};
