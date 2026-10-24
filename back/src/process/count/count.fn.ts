import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { process } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { processReadMatch } from "../readScope.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: {
      name,
      status,
      organizationId,
      unitId,
      wareId,
      wareModelId,
      wareGroupId,
      wareClassId,
      wareTypeId,
    },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const scopeMatch = await processReadMatch(activeRole, user);

  const filters: Document = {};

  scopeMatch && (filters.$and = [scopeMatch]);

  name &&
    (filters["name"] = {
      $regex: new RegExp(name, "i"),
    });

  status && (filters["status"] = status as string);

  organizationId &&
    (filters["organization._id"] = new ObjectId(organizationId as string));

  unitId && (filters["unit._id"] = new ObjectId(unitId as string));
  wareId && (filters["ware._id"] = new ObjectId(wareId as string));
  wareModelId &&
    (filters["wareModel._id"] = new ObjectId(wareModelId as string));
  wareGroupId &&
    (filters["wareGroup._id"] = new ObjectId(wareGroupId as string));
  wareClassId &&
    (filters["wareClass._id"] = new ObjectId(wareClassId as string));
  wareTypeId && (filters["wareType._id"] = new ObjectId(wareTypeId as string));

  const foundedItemsLength = await process.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
