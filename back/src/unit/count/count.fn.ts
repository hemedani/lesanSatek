import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { getAuth } from "@lib";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
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

  if (!user?.isGhost && !isManagerLike(activeRole)) {
    if (!activeRole.scopeId) return { qty: 0 };

    if (activeRole.name === "OrgHead") {
      filters["organization._id"] = new ObjectId(String(activeRole.scopeId));
    } else if (activeRole.name === "UnitHead") {
      delete filters["organization._id"];
      filters["_id"] = new ObjectId(String(activeRole.scopeId));
    }
  }

  const foundedItemsLength = await unit.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
