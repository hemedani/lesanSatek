import { type ActFn, type Document, ObjectId } from "lesan";
import { process, processStep, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const duplicateProcessFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { _id, name } = set;

  const sourceProcess = await process.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: {
      _id: 1,
      name: 1,
      description: 1,
      organization: { _id: 1 },
      assignedUnits: 1,
    },
  }) as Record<string, unknown>;

  if (!sourceProcess) {
    throwError("Source process not found");
    return;
  }

  const orgId = (sourceProcess.organization as Record<string, unknown>)?._id as ObjectId;
  const newName = (name as string) || `${sourceProcess.name as string} (Copy)`;

  // Load all source steps
  const sourceSteps = await processStep.aggregation({
    pipeline: [
      { $match: { "process._id": new ObjectId(_id as string) } },
      { $sort: { order: 1 } },
    ],
    projection: {
      _id: 1,
      name: 1,
      description: 1,
      stepType: 1,
      order: 1,
      required: 1,
      groupsOperator: 1,
      assigneeGroups: 1,
    },
  }).toArray();

  // Create the new process
  const newProcessRelations: Record<string, unknown> = {
    organization: {
      _ids: orgId,
      relatedRelations: { processes: true },
    },
    createdBy: {
      _ids: user._id,
      relatedRelations: { createdProcesses: true },
    },
  };

  const assignedUnitDocs = sourceProcess.assignedUnits as Array<Record<string, unknown>> | undefined;
  if (assignedUnitDocs && assignedUnitDocs.length > 0) {
    newProcessRelations.assignedUnits = {
      _ids: assignedUnitDocs.map((u: Record<string, unknown>) => u._id),
      relatedRelations: { assignedProcesses: true },
    };
  }

  const newProcess = await process.insertOne({
    doc: {
      name: newName,
      description: sourceProcess.description as string | undefined,
      status: "Draft",
      version: 1,
      isActive: false,
    },
    relations: newProcessRelations,
    projection: { _id: 1 },
  });

  if (!newProcess) {
    throwError("Failed to create new process");
    return;
  }

  const newProcessId = newProcess._id as ObjectId;

  // Copy all steps
  for (const s of sourceSteps) {
    await processStep.insertOne({
      doc: {
        name: s.name as string,
        description: s.description as string | undefined,
        stepType: s.stepType as string,
        order: s.order as number,
        required: s.required as boolean,
        groupsOperator: s.groupsOperator as string,
        assigneeGroups: s.assigneeGroups as Array<{ operator: string; unitIds: string[] }>,
      },
      projection: { _id: 1 },
      relations: {
        process: {
          _ids: newProcessId,
          relatedRelations: { steps: true },
        },
      },
    });
  }

  return await process.findOne({
    filters: { _id: newProcessId },
    projection: get,
  });
};
