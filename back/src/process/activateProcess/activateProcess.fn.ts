import { type ActFn, type Document, ObjectId } from "lesan";
import { process, processStep, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const activateProcessFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { _id } = set;

  const now = new Date();

  const proc = await process.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { _id: 1, status: 1, organization: { _id: 1 } },
  }) as Record<string, unknown>;

  if (!proc) {
    throwError("Process not found");
    return;
  }

  if ((proc.status as string) === "Active") {
    throwError("Process is already active");
    return;
  }

  // Count steps
  const stepCount = await processStep.countDocument({
    filter: { process: new ObjectId(_id as string) },
  });

  if (stepCount === 0) {
    throwError("Cannot activate a process with no steps");
    return;
  }

  // Load all steps ordered
  const steps = await processStep.aggregation({
    pipeline: [
      { $match: { process: new ObjectId(_id as string) } },
      { $sort: { order: 1 } },
    ],
    projection: { _id: 1, name: 1, order: 1, assigneeGroups: 1, stepType: 1 },
  }).toArray();

  // Validate order sequence (no gaps, no duplicates)
  const orders = steps.map((s: Document) => s.order as number);
  for (let i = 1; i <= steps.length; i++) {
    if (!orders.includes(i)) {
      throwError(`Step order sequence has a gap at position ${i}. Steps must be ordered 1, 2, 3, ...`);
      return;
    }
  }

  // Collect all unique unitIds from all steps
  const allUnitIds = [...new Set<string>(
    steps.flatMap((s: Document) =>
      (s.assigneeGroups as Array<{ unitIds: string[] }>).flatMap((g) => g.unitIds)
    ),
  )];

  // Validate that all unitIds reference existing Unit documents
  if (allUnitIds.length > 0) {
    const validUnitCount = await unit.countDocument({
      filter: { _id: { $in: allUnitIds.map((uid) => new ObjectId(uid)) } },
    });

    if (validUnitCount !== allUnitIds.length) {
      throwError(
        `Some unit IDs in step assigneeGroups do not reference valid units. ` +
        `Found ${validUnitCount} valid out of ${allUnitIds.length}.`,
      );
      return;
    }
  }

  // Activate the process
  return await process.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        status: "Active",
        isActive: true,
        updatedAt: now,
      },
      $inc: { version: 1 },
    },
    projection: get,
  });
};
