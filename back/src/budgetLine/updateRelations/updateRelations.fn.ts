import { type ActFn, ObjectId } from "lesan";
import { budgetLine } from "../../../mod.ts";
import {
  assertFinanceTargetConsistency,
  checkFinanceUnitAccess,
  financeTargetOfBudgetLine,
} from "../../../utils/checkFinanceUnitAccess.ts";

export const updateRelationsFn: ActFn = async (body) => {
  await checkFinanceUnitAccess(
    await financeTargetOfBudgetLine(body.details.set._id),
  );
  const {
    set: { _id, ...relations },
    get,
  } = body.details;

  if (relations.organizationId || relations.unitId) {
    const payloadTarget = {
      organizationId: relations.organizationId
        ? String(relations.organizationId)
        : undefined,
      unitId: relations.unitId ? String(relations.unitId) : undefined,
    };

    await assertFinanceTargetConsistency(payloadTarget);
    await checkFinanceUnitAccess(payloadTarget);
  }

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
