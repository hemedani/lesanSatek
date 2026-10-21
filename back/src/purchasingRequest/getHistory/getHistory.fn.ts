import { type ActFn, type Document, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertCanReadPurchasingRequest } from "../readScope.ts";

export const getHistoryFn: ActFn = async (body) => {
  const { set: { _id, action, performer, fromDate, toDate } } = body.details;

  const { user, activeRole } = await getAuth();
  const requestId = new ObjectId(_id as string);

  const founded = await purchasingRequest.findOne({
    filters: { _id: requestId },
    projection: {
      organization: { _id: 1 },
      requestingUnit: { _id: 1 },
      requester: { _id: 1 },
      store: { _id: 1 },
    },
  }) as Document | null;

  if (!founded) {
    if (
      !(user.isGhost || activeRole.name === "Manager" ||
        activeRole.name === "Admin")
    ) {
      throwError("You cant do this");
    }
  } else {
    assertCanReadPurchasingRequest(activeRole, user, founded);
  }

  const pipeline: Document[] = [
    { $match: { _id: requestId } },
    { $unwind: "$history" },
  ];

  if (action) {
    pipeline.push({ $match: { "history.action": action } });
  }
  if (performer) {
    pipeline.push({ $match: { "history.performed.by": performer } });
  }
  if (fromDate) {
    pipeline.push({
      $match: {
        "history.performed.at": { $gte: new Date(fromDate as string) },
      },
    });
  }
  if (toDate) {
    pipeline.push({
      $match: { "history.performed.at": { $lte: new Date(toDate as string) } },
    });
  }

  pipeline.push({ $sort: { "history.performed.at": -1 } });

  pipeline.push({
    $project: {
      _id: 0,
      action: "$history.action",
      performed: "$history.performed",
      unit: "$history.unit",
      details: "$history.details",
    },
  });

  const result = await purchasingRequest
    .aggregation({
      pipeline,
      projection: { action: 1, performed: 1, unit: 1, details: 1 },
    })
    .toArray();

  return result;
};
