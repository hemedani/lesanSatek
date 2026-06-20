import type { ActFn, Document } from "lesan";
import { processStep } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { name, stepType },
    get,
  } = body.details;

  const filters: Document = {};

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
