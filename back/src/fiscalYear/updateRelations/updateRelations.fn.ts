import { type ActFn, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";

export const updateRelationsFn: ActFn = async (body) => {
  await checkFinanceUnitAccess();
  const {
    set: { _id, ...relations },
    get,
  } = body.details;

  const modelId = new ObjectId(_id as string);

  for (const [key, value] of Object.entries(relations)) {
    if (value) {
      const relationKey = key.endsWith("Id") ? key.slice(0, -2) : key;
      await fiscalYear.addRelation({
        filters: { _id: modelId },
        relations: {
          [relationKey]: {
            _ids: new ObjectId(value as string),
            relatedRelations: {},
          },
        },
        projection: get,
        replace: true,
      });
    }
  }

  return await fiscalYear.findOne({
    filters: { _id: modelId },
    projection: get,
  });
};