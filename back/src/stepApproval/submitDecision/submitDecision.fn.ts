import { type ActFn, type Document, ObjectId } from "lesan";
import {
  stepApproval,
  purchasingRequest,
  processStep,
  unit,
  tender,
  tenderOffer,
  stuff,
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
                completed: true,
              },
            },
          },
        },
        projection: { _id: 1 },
      });

      // --- Deferred Tender Award ---
      // If the PR used the tender path and has a selected offer, award the tender now
      if (req.selectionType === "tender" && req.selectedTenderOfferId) {
        const selectedTenderOfferId = req.selectedTenderOfferId as string;
        const prQuantity = (req.quantity as number) || 0;
        const prWareModel = req.wareModel as Record<string, unknown> | undefined;
        const wareModelId = prWareModel?._id?.toString();

        const awardOfferDocs = await tenderOffer.aggregation({
          pipeline: [
            { $match: { _id: new ObjectId(selectedTenderOfferId) } },
            { $limit: 1 },
          ],
          projection: {
            _id: 1, price: 1,
            store: { _id: 1, name: 1 },
            tender: { _id: 1, title: 1, status: 1 },
          },
        }).toArray();

        if (
          awardOfferDocs.length > 0 &&
          (awardOfferDocs[0].tender as Record<string, unknown> | undefined)?.status === "closed"
        ) {
          const winningOffer = awardOfferDocs[0] as Record<string, unknown>;
          const tenderRef = winningOffer.tender as Record<string, unknown> | undefined;
          const tenderId = tenderRef?._id as ObjectId;
          const winningStoreId = (winningOffer.store as Record<string, unknown>)?._id?.toString();
          const offerPrice = (winningOffer.price as number) || 0;

          // Set tender status to "awarded"
          await tender.findOneAndUpdate({
            filter: { _id: tenderId },
            update: { $set: { status: "awarded", updatedAt: now } },
            projection: { _id: 1 },
          });

          // Accept winning offer
          await tenderOffer.findOneAndUpdate({
            filter: { _id: new ObjectId(selectedTenderOfferId) },
            update: { $set: { status: "accepted", updatedAt: now } },
            projection: { _id: 1 },
          });

          // Reject all other offers on this tender
          const otherOffers = await tenderOffer.aggregation({
            pipeline: [
              {
                $match: {
                  "tender._id": tenderId,
                  _id: { $ne: new ObjectId(selectedTenderOfferId) },
                },
              },
            ],
            projection: { _id: 1 },
          }).toArray();

          for (const o of otherOffers) {
            await tenderOffer.findOneAndUpdate({
              filter: { _id: o._id as ObjectId },
              update: { $set: { status: "rejected", updatedAt: now } },
              projection: { _id: 1 },
            });
          }

          // Find a Stuff matching winning store + PR's wareModel
          let stuffId: string | undefined;
          if (winningStoreId && wareModelId) {
            const stuffDocs = await stuff.aggregation({
              pipeline: [
                {
                  $match: {
                    "store._id": new ObjectId(winningStoreId),
                    "wareModel._id": new ObjectId(wareModelId),
                  },
                },
                { $limit: 1 },
              ],
              projection: { _id: 1 },
            }).toArray();
            if (stuffDocs.length > 0) {
              stuffId = stuffDocs[0]._id.toString();
            }
          }

          const awardEstimatedAmount = Math.round(offerPrice * prQuantity * 100) / 100;

          // Link stuff + store on the PR
          const prRel: Record<string, unknown> = {};
          if (stuffId) {
            prRel.stuff = {
              _ids: new ObjectId(stuffId),
              relatedRelations: { purchasingRequests: true },
            };
          }
          if (winningStoreId) {
            prRel.store = {
              _ids: new ObjectId(winningStoreId),
              relatedRelations: { purchasingRequests: true },
            };
          }
          if (Object.keys(prRel).length > 0) {
            await purchasingRequest.addRelation({
              filters: { _id: prId },
              relations: prRel,
              projection: { _id: 1 },
              replace: true,
            });
          }

          await purchasingRequest.findOneAndUpdate({
            filter: { _id: prId },
            update: {
              $set: {
                stuffStatus: "assigned",
                estimatedAmount: awardEstimatedAmount,
                updatedAt: now,
              },
              $push: {
                history: {
                  action: "tender_awarded",
                  performed: {
                    by: user._id.toString(),
                    name: `${user.first_name} ${user.last_name}`,
                    at: now,
                    role: activeRole
                      ? {
                        id: activeRole.roleId,
                        name: activeRole.name,
                        scopeType: activeRole.scopeType,
                        scopeId: activeRole.scopeId,
                      }
                      : { id: "", name: "" },
                  },
                  details: {
                    tenderId: tenderId.toString(),
                    tenderOfferId: selectedTenderOfferId,
                    offerPrice,
                    storeId: winningStoreId,
                    stuffId,
                    wareModelId,
                    quantity: prQuantity,
                    estimatedAmount: awardEstimatedAmount,
                  },
                },
              },
            },
            projection: { _id: 1 },
          });
        }
      }
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
