import { type ActFn, type Document, ObjectId } from "lesan";
import {
  stepApproval,
  purchasingRequest,
  processStep,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { evaluateStepStatus } from "../../../utils/stepEvaluator.ts";


export const submitDecisionFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const {
    activeRoleId,
    purchasingRequestId,
    processStepId,
    unitId,
    status,
    comment,
  } = set;

  const prId = new ObjectId(purchasingRequestId as string);
  const psId = new ObjectId(processStepId as string);
  const uId = new ObjectId(unitId as string);
  const now = new Date();

  const requests = await purchasingRequest.aggregation({
    pipeline: [{ $match: { _id: prId } }],
    projection: { _id: 1, status: 1, currentStep: 1, process: { _id: 1 } },
  }).toArray();

  if (requests.length === 0) throwError("Purchasing request not found");
  const req = requests[0];
  if (!["Pending", "InProgress"].includes(req.status)) {
    throwError("Request is not in a submittable state");
  }

  const steps = await processStep.aggregation({
    pipeline: [
      { $match: { "process._id": req.process._id } },
      { $sort: { order: 1 } },
    ],
    projection: {
      _id: 1,
      name: 1,
      stepType: 1,
      order: 1,
      groupsOperator: 1,
      assigneeGroups: 1,
    },
  }).toArray();

  const stepIndex = req.currentStep;
  if (stepIndex >= steps.length) {
    throwError("Current step index out of range");
  }
  const step = steps[stepIndex];
  if (step._id.toString() !== processStepId) {
    throwError("Step does not match current step");
  }

  const allUnitIds = step.assigneeGroups.flatMap(
    (g: { unitIds: string[] }) => g.unitIds,
  );
  if (!allUnitIds.includes(unitId)) {
    throwError("Unit is not assigned to this step");
  }

  const existingApprovals = await stepApproval.aggregation({
    pipeline: [
      {
        $match: {
          purchasingRequest: prId,
          processStep: psId,
          unit: uId,
        },
      },
    ],
    projection: { _id: 1 },
  }).toArray();

  let approvalResult;
  if (existingApprovals.length > 0) {
    const approval = existingApprovals[0];
    approvalResult = await stepApproval.findOneAndUpdate({
      filter: { _id: approval._id },
      update: { $set: { status, comment: comment || "", decidedAt: now } },
      projection: get,
    });
    await stepApproval.addRelation({
      filters: { _id: approval._id },
      relations: {
        decidedBy: {
          _ids: user._id,
          relatedRelations: { stepDecisions: true },
        },
      },
      projection: { _id: 1 },
      replace: true,
    });
  } else {
    approvalResult = await stepApproval.insertOne({
      doc: { status, comment: comment || "", decidedAt: now },
      projection: get,
      relations: {
        purchasingRequest: {
          _ids: prId,
          relatedRelations: { stepApprovals: true },
        },
        processStep: {
          _ids: psId,
          relatedRelations: { approvals: true },
        },
        unit: {
          _ids: uId,
          relatedRelations: { stepApprovals: true },
        },
        decidedBy: {
          _ids: user._id,
          relatedRelations: { stepDecisions: true },
        },
      },
    });
  }

  const allApprovals = await stepApproval.aggregation({
    pipeline: [
      {
        $match: {
          purchasingRequest: prId,
          processStep: psId,
        },
      },
    ],
    projection: { unit: { _id: 1 }, status: 1 },
  }).toArray();

  const approvalInfos = allApprovals.map((a: Document) => ({
    unitId: a.unit._id.toString(),
    status: a.status as "pending" | "approved" | "rejected",
  }));

  const overallStatus = evaluateStepStatus(
    approvalInfos,
    step.groupsOperator,
    step.assigneeGroups,
  );

  const stepType = step.stepType as string;

  if (overallStatus === "approved") {
    const nextStepIndex = stepIndex + 1;

    // Push step_approved history
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: prId },
      update: {
        $push: {
          history: {
            action: "step_approved",
            performedBy: user._id.toString(),
            performedByName: `${user.first_name} ${user.last_name}`,
            performedAt: now,
            details: {
              stepName: step.name,
              stepIndex,
              stepType,
              unitId,
              comment: comment || "",
            },
          },
        },
      },
      projection: { _id: 1 },
    });

    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex];
      const nextUnitIds = [...new Set<string>(
        nextStep.assigneeGroups.flatMap(
          (g: { unitIds: string[] }) => g.unitIds,
        ),
      )];
      for (const nuId of nextUnitIds) {
        await stepApproval.insertOne({
          doc: { status: "pending" },
          projection: { _id: 1 },
          relations: {
            purchasingRequest: {
              _ids: prId,
              relatedRelations: { stepApprovals: true },
            },
            processStep: {
              _ids: nextStep._id,
              relatedRelations: { approvals: true },
            },
            unit: {
              _ids: new ObjectId(nuId),
              relatedRelations: { stepApprovals: true },
            },
          },
        });
      }
      await purchasingRequest.findOneAndUpdate({
        filter: { _id: prId },
        update: { $set: { currentStep: nextStepIndex, updatedAt: now } },
        projection: { _id: 1 },
      });
    } else {
      await purchasingRequest.findOneAndUpdate({
        filter: { _id: prId },
        update: {
          $set: {
            status: "Completed",
            completedAt: now,
            updatedAt: now,
          },
          $push: {
            history: {
              action: "step_approved",
              performedBy: user._id.toString(),
              performedByName: `${user.first_name} ${user.last_name}`,
              performedAt: now,
              details: {
                stepName: step.name,
                stepIndex,
                stepType,
                unitId,
                comment: comment || "",
                completed: true,
              },
            },
          },
        },
        projection: { _id: 1 },
      });
    }
  } else if (overallStatus === "rejected") {
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: prId },
      update: {
        $set: { status: "Rejected", updatedAt: now },
        $push: {
          history: {
            action: "step_rejected",
            performedBy: user._id.toString(),
            performedByName: `${user.first_name} ${user.last_name}`,
            performedAt: now,
            details: {
              stepName: step.name,
              stepIndex,
              stepType,
              unitId,
              comment: comment || "",
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  return approvalResult;
};
