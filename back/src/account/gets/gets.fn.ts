import { type ActFn, type Document, ObjectId } from "lesan";
import { account } from "../../../mod.ts";
import {
  accountingReadMatch,
  activeAccountingOrganizationId,
} from "../../../utils/accountingScope.ts";
import { getAuth } from "../../../utils/grantAccess.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      code,
      name,
      accountType,
      systemKey,
      isActive,
      parentAccountId,
      organizationId,
    },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const financeOrganizationId = await activeAccountingOrganizationId(
    activeRole,
    user,
  );
  const readMatch = accountingReadMatch(
    activeRole,
    user,
    financeOrganizationId,
  );

  const pipeline: Document[] = [];

  readMatch && pipeline.push({ $match: readMatch });

  const match: Document = {};
  organizationId && (match["organization._id"] = new ObjectId(organizationId));
  code && (match.code = { $regex: code, $options: "i" });
  name && (match.name = { $regex: name, $options: "i" });
  accountType && (match.accountType = accountType);
  systemKey && (match.systemKey = systemKey);
  isActive !== undefined && (match.isActive = isActive);
  parentAccountId && (match["parentAccount._id"] = parentAccountId);

  if (Object.keys(match).length > 0) pipeline.push({ $match: match });

  const sortField = sortBy || "code";
  const sortDirection = sortOrder === "desc" ? -1 : 1;
  pipeline.push({ $sort: { [sortField]: sortDirection } });

  const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
  pipeline.push({ $skip: calculatedSkip });
  pipeline.push({ $limit: limit || 50 });

  return await account.aggregation({ pipeline, projection: get }).toArray();
};
