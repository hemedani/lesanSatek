import { type ActFn, type Document, ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";

export const getHistoryFn: ActFn = async (body) => {
  const { set: { _id, action, performer, fromDate, toDate } } = body.details;

  const pipeline: Document[] = [
    { $match: { _id: new ObjectId(_id as string) } },
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
      $match: { "history.performed.at": { $gte: new Date(fromDate as string) } },
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
      projection: {},
    })
    .toArray();

  return result;
};
