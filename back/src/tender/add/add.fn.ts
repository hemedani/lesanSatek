import { type ActFn, ObjectId } from "lesan";
import { tender, purchasingRequest, coreApp } from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, purchasingRequestId, createdById, ...rest } = set;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );

  const pr = await purchasingRequest.findOne({
    filters: { _id: new ObjectId(purchasingRequestId as string) },
    projection: { _id: 1, status: 1 },
  }) as Record<string, unknown>;
  if (!pr) throwError("Purchasing request not found");
  if (!["Draft", "Pending", "InProgress"].includes(pr.status as string)) {
    throwError("Can only create tender for a Draft or active purchasing request");
  }

  const existingActiveTender = await tender.aggregation({
    pipeline: [
      {
        $match: {
          "purchasingRequest._id": new ObjectId(purchasingRequestId as string),
          status: { $in: ["open", "closed"] },
        },
      },
      { $limit: 1 },
    ],
    projection: { _id: 1, title: 1, status: 1 },
  }).toArray();

  if (existingActiveTender.length > 0) {
    throwError("This purchasing request already has an active tender. Close or cancel it before creating a new one.");
  }

  const relations: Record<string, unknown> = {};

  relations.purchasingRequest = {
    _ids: new ObjectId(purchasingRequestId as string),
    relatedRelations: {
      tenders: true,
    },
  };

  relations.createdBy = {
    _ids: new ObjectId(user._id as string),
    relatedRelations: {
      createdTenders: true,
    },
  };

  const result = await tender.insertOne({
    doc: { ...rest, status: "open" },
    relations,
    projection: { ...get, _id: 1 },
  });

  const createdTender = result as Record<string, unknown>;
  const now = new Date();

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: new ObjectId(purchasingRequestId as string) },
    update: {
      $push: {
        history: {
          action: "tender_created",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole
              ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              }
              : { id: "", name: "" },
          },
          details: {
            tenderId: createdTender._id?.toString(),
            title: rest.title,
            deadline: rest.deadline,
            status: "open",
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return result;
};
