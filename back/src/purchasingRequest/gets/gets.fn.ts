import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      search,
      status,
      processId,
      requesterId,
      filterByAction,
      sortBy,
      sortOrder,
      storeId,
      wareId,
      wareTypeId,
      wareClassId,
      wareGroupId,
      unitId,
      activeRoleId,
    },
    get,
  } = body.details;

  const pipeline: Document[] = [];

  search &&
    pipeline.push({
      $match: { $text: { $search: search } },
    });

  status &&
    pipeline.push({
      $match: { status },
    });

  processId &&
    pipeline.push({
      $match: { "process._id": new ObjectId(processId as string) },
    });

  requesterId &&
    pipeline.push({
      $match: { "requester._id": new ObjectId(requesterId as string) },
    });

  filterByAction &&
    pipeline.push({
      $match: { "history.action": filterByAction },
    });

  storeId &&
    pipeline.push({
      $match: { "store._id": new ObjectId(storeId as string) },
    });

  wareId &&
    pipeline.push({
      $match: { "ware._id": new ObjectId(wareId as string) },
    });

  wareTypeId &&
    pipeline.push({
      $match: { "wareType._id": new ObjectId(wareTypeId as string) },
    });

  wareClassId &&
    pipeline.push({
      $match: { "wareClass._id": new ObjectId(wareClassId as string) },
    });

  wareGroupId &&
    pipeline.push({
      $match: { "wareGroup._id": new ObjectId(wareGroupId as string) },
    });

  if (unitId) {
    const { user }: MyContext = coreApp.contextFns
      .getContextModel() as MyContext;

    const activeRole = (user.roles || []).find(
      (r: { roleId: string }) => r.roleId === activeRoleId,
    );

    if (!activeRole || !["Manager", "Admin", "OrgHead"].includes(activeRole.name)) {
      const uId = new ObjectId(unitId as string);
      const unitDoc = await unit.aggregation({
        pipeline: [{ $match: { _id: uId } }],
        projection: { head: { _id: 1 } },
      }).toArray();

      if (
        unitDoc.length === 0 || !unitDoc[0].head ||
        unitDoc[0].head._id.toString() !== user._id.toString()
      ) {
        throwError("You can only view requests for your own unit");
      }
    }

    const unitObjId = new ObjectId(unitId as string);
    pipeline.push(
      {
        $lookup: {
          from: "stepApproval",
          let: { prId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$purchasingRequest._id", "$$prId"] },
                    { $eq: ["$unit._id", unitObjId] },
                    { $eq: ["$status", "pending"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "_unitPendingApprovals",
        },
      },
      { $match: { _unitPendingApprovals: { $ne: [] } } },
      { $project: { _unitPendingApprovals: 0 } },
    );
  }

  if (search && (!sortBy || sortBy === "relevance")) {
    pipeline.push({
      $addFields: {
        textScore: { $meta: "textScore" },
      },
    });
  }

  const sortField = sortBy === "relevance" ? "textScore" : (sortBy || "_id");
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await purchasingRequest
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
