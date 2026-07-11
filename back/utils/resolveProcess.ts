import { ObjectId } from "lesan";
import { process } from "../mod.ts";
import { throwError } from "./throwError.ts";

interface ResolveProcessParams {
  organizationId: string;
  requestingUnitId?: string;
  wareModelId: string;
  wareId?: string;
  wareTypeId?: string;
  wareClassId?: string;
  wareGroupId?: string;
}

export async function resolveProcessForPR(
  params: ResolveProcessParams,
): Promise<string> {
  const {
    organizationId,
    requestingUnitId,
    wareModelId,
    wareId,
    wareTypeId,
    wareClassId,
    wareGroupId,
  } = params;
  const orgId = new ObjectId(organizationId);

  if (requestingUnitId) {
    const unitProcess = await process.findOne({
      filters: {
        "organization._id": orgId,
        "unit._id": new ObjectId(requestingUnitId),
        status: "Active",
      },
      projection: { _id: 1 },
    });
    if (unitProcess) return unitProcess._id.toString();
  }

  const scopeChain = [
    { id: wareId, field: "ware" },
    { id: wareModelId, field: "wareModel" },
    { id: wareGroupId, field: "wareGroup" },
    { id: wareClassId, field: "wareClass" },
    { id: wareTypeId, field: "wareType" },
  ];

  for (const { id, field } of scopeChain) {
    if (id) {
      const doc = await process.findOne({
        filters: {
          "organization._id": orgId,
          [`${field}._id`]: new ObjectId(id),
          status: "Active",
        },
        projection: { _id: 1 },
      });
      if (doc) return doc._id.toString();
    }
  }

  const [orgProcess] = await process.aggregation({
    pipeline: [
      {
        $match: {
          "organization._id": orgId,
          status: "Active",
          $and: [
            { "unit._id": { $exists: false } },
            { "ware._id": { $exists: false } },
            { "wareModel._id": { $exists: false } },
            { "wareGroup._id": { $exists: false } },
            { "wareClass._id": { $exists: false } },
            { "wareType._id": { $exists: false } },
          ],
        },
      },
      { $limit: 1 },
    ],
    projection: { _id: 1 },
  }).toArray();

  if (orgProcess) return orgProcess._id.toString();

  throwError(
    "No active process found for this organization. Please create and activate a process first.",
  );
  return "";
}
