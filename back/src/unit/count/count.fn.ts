import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { unit } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { name, isActive, organizationId, type },
    get,
  } = body.details;

  const filters: Document = {};

  name &&
    (filters["name"] = {
      $regex: new RegExp(name, "i"),
    });

  isActive !== undefined &&
    (filters["isActive"] = isActive);

  organizationId &&
    (filters["organization"] = new ObjectId(organizationId as string));

  type &&
    (filters["type"] = type);

  const foundedItemsLength = await unit.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
