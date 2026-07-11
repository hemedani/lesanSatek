import { type ActFn, type Document, ObjectId } from "lesan";
import { stepApproval, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      purchasingRequestId,
      processStepId,
      unitId,
      activeRoleId,
    },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

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

  const pipeline: Document[] = [];

  const match: Document = {};
  purchasingRequestId && (match["purchasingRequest._id"] = new ObjectId(purchasingRequestId as string));
  processStepId && (match["processStep._id"] = new ObjectId(processStepId as string));
  unitId && (match["unit._id"] = new ObjectId(unitId as string));
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await stepApproval
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
