import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import {
  checkFinanceUnitAccess,
  financeTargetOfBudgetLine,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const updateRelationsFn: ActFn = async (body) => {
  await checkFinanceUnitAccess(
    (await financeTargetOfBudgetLine(body.details.set._id)) ?? undefined,
  );
  const {
    set: { _id, ...relations },
    get,
  } = body.details;

  const modelId = new ObjectId(_id as string);

  for (const [key, value] of Object.entries(relations)) {
    if (value) {
      const relationKey = key.endsWith("Id") ? key.slice(0, -2) : key;
      await budgetLine.addRelation({
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

  return await budgetLine.findOne({
    filters: { _id: modelId },
    projection: get,
  });
};