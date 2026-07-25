import { type ActFn, type Document, ObjectId } from "lesan";
import {
  stepApproval,
  purchasingRequest,
  processStep,
  unit,
  budgetLine,
  budgetEncumbrance,
  stuff,
  tenderOffer,
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
    unitId: rawUnitId,
    status,
    comment,
    budgetLineId,
  } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  let unitId = rawUnitId;
  if (!unitId) {
    if (activeRole?.scopeType === "unit" && activeRole?.scopeId) {
      unitId = activeRole.scopeId;
    } else {
      throwError("Unit ID is required");
    }
  }

  const prId = new ObjectId(purchasingRequestId as string);
  const psId = new ObjectId(processStepId as string);
  const uId = new ObjectId(unitId as string);
  const now = new Date();

  const requests = await purchasingRequest.aggregation({
    pipeline: [{ $match: { _id: prId } }],
    projection: {
      _id: 1, status: 1, currentStep: 1,
      selectionType: 1, selectedTenderOfferId: 1, quantity: 1,
      wareModel: { _id: 1, name: 1, enName: 1 },
      stuff: { _id: 1 },
      process: { _id: 1 },
    },
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

  if (!activeRole || !["Manager", "Admin"].includes(activeRole.name)) {
    const unitDoc = await unit.aggregation({
      pipeline: [{ $match: { _id: uId } }],
      projection: { head: { _id: 1 } },
    }).toArray();

    if (
      unitDoc.length === 0 || !unitDoc[0].head ||
      unitDoc[0].head._id.toString() !== user._id.toString()
    ) {
      throwError("Only the unit head can submit a decision for this unit");
    }
  }

  // Budget line validation for finance unit approvals
  let resolvedBudgetLineId = budgetLineId as string | undefined;
  let resolvedBudgetLineDoc: Record<string, unknown> | undefined;

  if (status === "approved") {
    const unitTypeDocs = await unit.aggregation({
      pipeline: [{ $match: { _id: uId } }],
      projection: { type: 1 },
    }).toArray();

    const unitType = unitTypeDocs.length > 0 ? unitTypeDocs[0].type as string : "";

    if (unitType === "Finance") {
      if (!resolvedBudgetLineId) {
        throwError("Budget line is required when approving from a finance unit");
      }

      const prQuantity = (req.quantity as number) || 0;
      let unitPrice = 0;

      if (req.selectionType === "stuff" && (req.stuff as Record<string, unknown>)?._id) {
        const stuffObj = req.stuff as Record<string, unknown>;
        const stuffId = (stuffObj._id as Record<string, unknown>).toString();
        const stuffDocs = await stuff.aggregation({
          pipeline: [{ $match: { _id: new ObjectId(stuffId) } }],
          projection: { price: 1, hasAbsolutePrice: 1, pricePercentage: 1, ware: { _id: 1, price: 1 } },
        }).toArray();

        if (stuffDocs.length > 0) {
          const s = stuffDocs[0];
          if (s.hasAbsolutePrice) {
            unitPrice = (s.price as number) || 0;
          } else {
            const warePrice = ((s.ware as Record<string, unknown>)?.price as number) || 0;
            const percentage = (s.pricePercentage as number) || 0;
            unitPrice = Math.round(warePrice * (1 + percentage / 100) * 100) / 100;
          }
        }
      } else if (req.selectedTenderOfferId) {
        const offerDocs = await tenderOffer.aggregation({
          pipeline: [{ $match: { _id: new ObjectId(req.selectedTenderOfferId as string) } }],
          projection: { price: 1 },
        }).toArray();
        if (offerDocs.length > 0) {
          unitPrice = (offerDocs[0].price as number) || 0;
        }
      }

      const estimatedTotal = Math.round(unitPrice * prQuantity * 100) / 100;

      const blDocs = await budgetLine.aggregation({
        pipeline: [{ $match: { _id: new ObjectId(resolvedBudgetLineId) } }],
        projection: { _id: 1, code: 1, title: 1, remainingBudget: 1 },
      }).toArray();

      if (blDocs.length === 0) {
        throwError("Budget line not found");
      }

      const bl = blDocs[0];
      const remainingBudget = (bl.remainingBudget as number) || 0;

      if (remainingBudget < estimatedTotal) {
        throwError(
          `Insufficient budget: remaining (${remainingBudget}) is less than required (${estimatedTotal})`,
        );
      }

      resolvedBudgetLineDoc = {
        _id: bl._id.toString(),
        code: bl.code as string,
        title: bl.title as string,
      };

      // Create budget encumbrance to reserve funds
      if (estimatedTotal > 0) {
        await budgetEncumbrance.insertOne({
          doc: {
            amount: estimatedTotal,
            status: "reserved",
            referenceType: "purchasingRequest",
            referenceId: (purchasingRequestId as string),
            description: "Auto-reserved from Finance step approval",
          },
          projection: { _id: 1 },
          relations: {
            budgetLine: {
              _ids: new ObjectId(resolvedBudgetLineId),
              relatedRelations: { encumbrances: true },
            },
            createdBy: {
              _ids: user._id,
              relatedRelations: { budgetEncumbrances: true },
            },
          },
        });

        const blEnc = await budgetLine.findOne({
          filters: { _id: new ObjectId(resolvedBudgetLineId) },
          projection: { _id: 1, totalEncumbered: 1, totalAllocated: 1, totalSpent: 1 },
        }) as Record<string, unknown>;

        if (blEnc) {
          const currentEncumbered = (blEnc.totalEncumbered as number) || 0;
          const currentAllocated = (blEnc.totalAllocated as number) || 0;
          const currentSpent = (blEnc.totalSpent as number) || 0;
          await budgetLine.findOneAndUpdate({
            filter: { _id: new ObjectId(resolvedBudgetLineId) },
            update: {
              $inc: { totalEncumbered: estimatedTotal },
              $set: {
                remainingBudget: currentAllocated - (currentEncumbered + estimatedTotal) - currentSpent,
                updatedAt: now,
              },
            },
            projection: { _id: 1 },
          });
        }
      }
    }
  }

  const existingApprovals = await stepApproval.aggregation({
    pipeline: [
      {
        $match: {
          "purchasingRequest._id": prId,
          "processStep._id": psId,
          "unit._id": uId,
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

    if (resolvedBudgetLineDoc && resolvedBudgetLineId) {
      await stepApproval.addRelation({
        filters: { _id: approval._id },
        relations: {
          budgetLine: {
            _ids: new ObjectId(resolvedBudgetLineId),
            relatedRelations: {},
          },
        },
        projection: { _id: 1 },
        replace: true,
      });
    }
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
        ...(resolvedBudgetLineDoc && resolvedBudgetLineId
          ? {
            budgetLine: {
              _ids: new ObjectId(resolvedBudgetLineId),
              relatedRelations: {},
            },
          }
          : {}),
      },
    });
  }

  const allApprovals = await stepApproval.aggregation({
    pipeline: [
      {
        $match: {
          "purchasingRequest._id": prId,
          "processStep._id": psId,
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
            performed: {
              by: user._id.toString(),
              name: `${user.first_name} ${user.last_name}`,
              at: now,
              role: activeRole ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              } : { id: "", name: "" },
            },
            unit: { _id: unitId, name: step.name },
            details: {
              stepName: step.name,
              stepIndex,
              stepType,
              unitId,
              comment: comment || "",
              ...(resolvedBudgetLineDoc ? { budgetLine: resolvedBudgetLineDoc } : {}),
            },
          },
        },
      },
      projection: { _id: 1 },
    });

    if (resolvedBudgetLineDoc && resolvedBudgetLineId) {
      await purchasingRequest.addRelation({
        filters: { _id: prId },
        relations: {
          budgetLine: {
            _ids: new ObjectId(resolvedBudgetLineId),
            relatedRelations: { purchasingRequests: true },
          },
        },
        projection: { _id: 1 },
        replace: true,
      });
    }

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
            status: "PendingFinalization",
            updatedAt: now,
          },
          $push: {
            history: {
              action: "all_steps_approved",
              performed: {
                by: user._id.toString(),
                name: `${user.first_name} ${user.last_name}`,
                at: now,
                role: activeRole ? {
                  id: activeRole.roleId,
                  name: activeRole.name,
                  scopeType: activeRole.scopeType,
                  scopeId: activeRole.scopeId,
                } : { id: "", name: "" },
              },
              unit: { _id: unitId, name: step.name },
              details: {
                stepName: step.name,
                stepIndex,
                stepType,
                unitId,
                comment: comment || "",
                pendingFinalization: true,
                ...(resolvedBudgetLineDoc ? { budgetLine: resolvedBudgetLineDoc } : {}),
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
            performed: {
              by: user._id.toString(),
              name: `${user.first_name} ${user.last_name}`,
              at: now,
              role: activeRole ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              } : { id: "", name: "" },
            },
            unit: { _id: unitId, name: step.name },
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
