import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { getAuth } from "@lib";
import { applyUnitReadScope, unitReadScope } from "../../../utils/readScope.ts";
import { unit } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { name, isActive, organizationId, type },
  } = body.details;

  const { user, activeRole } = await getAuth();

  const filters: Document = {};

  name &&
    (filters["name"] = {
      $regex: new RegExp(name, "i"),
    });

  isActive !== undefined &&
    (filters["isActive"] = isActive);

  organizationId &&
    (filters["organization._id"] = new ObjectId(organizationId as string));

  type &&
    (filters["type"] = type);

  const scope = await unitReadScope(activeRole, user);
  const scopePipeline: Document[] = [];
  applyUnitReadScope(scopePipeline, scope);

  if (scopePipeline.length > 0) {
    filters["$and"] = scopePipeline.map((stage) => stage.$match);
  }

  const foundedItemsLength = await unit.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
