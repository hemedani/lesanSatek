import type { ActFn, Document } from "lesan";
import { processStep } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { processStepProcessIds } from "../readScope.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { name, stepType },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const allowedProcessIds = await processStepProcessIds(activeRole, user);

  const filters: Document = {};

  if (allowedProcessIds !== null) {
    filters["process._id"] = { $in: allowedProcessIds };
  }

  name &&
    (filters["name"] = {
      $regex: new RegExp(name, "i"),
    });

  stepType &&
    (filters["stepType"] = stepType);

  const foundedItemsLength = await processStep.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
