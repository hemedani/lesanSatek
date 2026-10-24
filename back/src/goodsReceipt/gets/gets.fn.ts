import { type ActFn, type Document, ObjectId } from "lesan";
import { goodsReceipt } from "../../../mod.ts";
import {
  activeFinanceOrganizationId,
  goodsReceiptReadMatch,
} from "../../../utils/financeScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      purchasingRequestId,
      receivingUnitId,
      status,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeFinanceOrganizationId(
    activeRole,
    user,
  );
  const readMatch = goodsReceiptReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const pipeline: Document[] = [];

  readMatch && pipeline.push({ $match: readMatch });

  const match: Document = {};
  purchasingRequestId && (match["purchasingRequest._id"] = new ObjectId(purchasingRequestId as string));
  receivingUnitId && (match["receivingUnit._id"] = new ObjectId(receivingUnitId as string));
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

  return await goodsReceipt
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
