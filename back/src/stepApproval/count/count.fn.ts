import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { stepApproval, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { unitId, status, stepId, fromDate, toDate, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );

  if (unitId && (!activeRole || !["Manager", "Admin", "OrgHead"].includes(activeRole.name))) {
    const uId = new ObjectId(unitId as string);
    const unitDoc = await unit.aggregation({
      pipeline: [{ $match: { _id: uId } }],
      projection: { head: { _id: 1 } },
    }).toArray();

    if (
      unitDoc.length === 0 || !unitDoc[0].head ||
      unitDoc[0].head._id.toString() !== user._id.toString()
    ) {
      throwError("You can only view approvals for your own unit");
    }
  }

  const filters: Document = {};

  unitId && (filters["unit._id"] = new ObjectId(unitId as string));
  status && (filters.status = status);
  stepId && (filters["processStep._id"] = new ObjectId(stepId as string));

  if (fromDate || toDate) {
    const createdAtFilter: Document = {};
    fromDate && (createdAtFilter["$gte"] = new Date(fromDate as string));
    toDate && (createdAtFilter["$lte"] = new Date(toDate as string));
    filters["createdAt"] = createdAtFilter;
  }

  const foundedItemsLength = await stepApproval.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
