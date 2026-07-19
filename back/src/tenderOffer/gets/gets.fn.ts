import { type ActFn, type Document, ObjectId } from "lesan";
import { tenderOffer, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      tenderId,
      storeId,
      status,
      activeRoleId,
    },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const pipeline: Document[] = [];

  const match: Document = {};

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (activeRole?.name === "StoreHead") {
    if (activeRole.scopeType === "store" && activeRole.scopeId) {
      match.store = new ObjectId(activeRole.scopeId);
    }
  }

  tenderId && (match.tender = new ObjectId(tenderId as string));
  storeId && (match.store = new ObjectId(storeId as string));
  status && (match.status = status);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await tenderOffer
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
