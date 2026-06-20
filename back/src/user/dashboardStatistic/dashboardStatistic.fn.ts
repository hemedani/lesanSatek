import type { ActFn } from "lesan";
import {
  file,
  organization,
  process,
  processStep,
  purchasingRequest,
  tag,
  unit,
  user,
} from "../../../mod.ts";

export const dashboardStatisticFn: ActFn = async (body) => {
  const { get } = body.details;
  const result: Record<string, unknown> = {};

  const tasks: Promise<void>[] = [];

  const simpleCounts: [string, any][] = [
    ["files", file],
    ["organizations", organization],
    ["processes", process],
    ["processSteps", processStep],
    ["purchasingRequests", purchasingRequest],
    ["tags", tag],
    ["units", unit],
    ["users", user],
  ];

  for (const [key, model] of simpleCounts) {
    if (get[key] === 1) {
      tasks.push(
        model.countDocument({}).then((v: number) => {
          result[key] = v;
        }),
      );
    }
  }

  if (
    get.userByLevel === 1
  ) {
    const userFacet: Record<string, unknown[]> = {};
    if (get.userByLevel === 1) {
      userFacet.byLevel = [
        { $match: { level: { $ne: "Ghost" } } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ];
    }
    tasks.push(
      user.aggregation({
        pipeline: [{ $facet: userFacet }],
      }).toArray().then((arr) => {
        const facet = arr[0] || {};
        if (facet.byLevel) result.userByLevel = facet.byLevel;
      }),
    );
  }

  await Promise.all(tasks);
  return result;
};
