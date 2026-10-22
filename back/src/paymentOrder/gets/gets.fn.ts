import { type ActFn, type Document, ObjectId } from "lesan";
import { paymentOrder } from "../../../mod.ts";
import {
  activeFinanceOrganizationId,
  paymentOrderReadMatch,
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
      status,
      financialUnitId,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeFinanceOrganizationId(
    activeRole,
    user,
  );
  const readMatch = paymentOrderReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const pipeline: Document[] = [];

  readMatch && pipeline.push({ $match: readMatch });

  purchasingRequestId &&
    pipeline.push({
      $match: {
        "purchasingRequest._id": new ObjectId(purchasingRequestId as string),
      },
    });
  status && pipeline.push({ $match: { status } });
  financialUnitId &&
    pipeline.push({
      $match: { "financialUnit._id": new ObjectId(financialUnitId as string) },
    });

  const sortField = sortBy || "_id";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await paymentOrder
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
