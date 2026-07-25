import { type ActFn, type Document, ObjectId } from "lesan";
import { goodsReceipt, purchasingRequest, paymentOrder, processStep, stepApproval, budgetEncumbrance, budgetLine, unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { addStock } from "../../../utils/inventoryManager.ts";
import { evaluateStepStatus } from "../../../utils/stepEvaluator.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const {
    activeRoleId,
    purchasingRequestId,
    receivedById,
    receivingUnitId,
    ...rest
  } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const now = new Date();

  const relations: Record<string, unknown> = {};

  relations.purchasingRequest = {
    _ids: new ObjectId(purchasingRequestId as string),
    relatedRelations: {
      goodsReceipts: true,
    },
  };

  if (receivedById) {
    relations.receivedBy = {
      _ids: new ObjectId(receivedById as string),
      relatedRelations: {
        receivedGoods: true,
      },
    };
  }

  if (receivingUnitId) {
    relations.receivingUnit = {
      _ids: new ObjectId(receivingUnitId as string),
      relatedRelations: {
        goodsReceipts: true,
      },
    };
  }

  // Fetch PR for authorization check + data extraction
  let prDoc: Record<string, unknown> | null = null;
  let prStoreId: string | undefined;
  let prEstimatedAmount = 0;
  let prQuantity = 0;
  if (purchasingRequestId) {
    prDoc = await purchasingRequest.findOne({
      filters: { _id: new ObjectId(purchasingRequestId as string) },
      projection: {
        store: { _id: 1 }, estimatedAmount: 1, quantity: 1, stuffStatus: 1,
        requester: { _id: 1 }, requestingUnit: { _id: 1 },
      },
    }) as Record<string, unknown> | null;

    if (!prDoc) {
      throwError("Purchasing request not found");
      return;
    }
    const pr = prDoc as Record<string, unknown>;

    // Authorization: only the requester or a warehouse head can confirm goods delivery
    const isRequester = pr.requester &&
      (pr.requester as Record<string, unknown>)._id?.toString() === user._id.toString();

    let isWarehouseHead = false;
    if (!isRequester) {
      const warehouseUnits = await unit.aggregation({
        pipeline: [
          { $match: { type: "Warehouse", "head._id": user._id } },
          { $limit: 1 },
        ],
        projection: { _id: 1 },
      }).toArray();
      isWarehouseHead = warehouseUnits.length > 0;
    }

    if (!isRequester && !isWarehouseHead) {
      throwError("Only the requester or the central warehouse head can confirm goods delivery");
    }

    // Validate receivingUnitId matches the appropriate unit
    const prRequestingUnitId = (pr.requestingUnit as Record<string, unknown>)?._id?.toString();
    if (isRequester && receivingUnitId !== prRequestingUnitId) {
      throwError("As the requester, goods must be received into your requesting unit");
    }

    // Extract store/pricing data
    if (pr.store) {
      prStoreId = ((pr.store as Record<string, unknown>)._id as ObjectId).toString();
    }
    prEstimatedAmount = (pr.estimatedAmount as number) || 0;
    prQuantity = (pr.quantity as number) || 0;
  }

  const result = await goodsReceipt.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  if (!result) {
    throw new Error("Failed to create goods receipt");
  }

  const items = (rest.items as Array<{
    wareModelId: string;
    wareModelName?: string;
    wareId?: string;
    wareName?: string;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected: number;
  }>) || [];

  const userId = receivedById ? (receivedById as string) : `${user._id}`;

  // Calculate order total from PR's estimatedAmount (prorated by accepted quantity)
  let orderTotal = 0;
  let totalAccepted = 0;

  for (const item of items) {
    if (item.quantityAccepted > 0) {
      totalAccepted += item.quantityAccepted;

      // Add stock
      await addStock(
        receivingUnitId as string,
        item.wareModelId,
        item.quantityAccepted,
        "goods_receipt",
        userId,
        {
          wareId: item.wareId,
          wareName: item.wareName,
          referenceType: "goodsReceipt",
          referenceId: result._id?.toString(),
          description: `Goods receipt for ${item.wareModelName || item.wareModelId}`,
          storeId: prStoreId,
        },
      );
    }
  }

  // Compute prorated order total from PR's estimatedAmount
  if (totalAccepted > 0 && prQuantity > 0) {
    orderTotal = Math.round((prEstimatedAmount / prQuantity) * totalAccepted * 100) / 100;
  }

  // Update PR's stuffStatus to "received"
  if (purchasingRequestId && totalAccepted > 0) {
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(purchasingRequestId as string) },
      update: { $set: { stuffStatus: "received", updatedAt: now } },
      projection: { _id: 1 },
    });
  }

  // Push "goods_received" history on the purchasing request
  if (purchasingRequestId) {
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(purchasingRequestId as string) },
      update: {
        $push: {
          history: {
            action: "goods_received",
            performed: {
              by: userId,
              name: `${user.first_name} ${user.last_name}`,
              at: now,
              role: activeRole ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              } : { id: "", name: "" },
            },
            unit: receivingUnitId ? { _id: receivingUnitId, name: "" } : undefined,
            details: {
              goodsReceiptId: result._id?.toString(),
              itemCount: items.length,
              receivingUnitId,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  // Gap 2: Auto-advance workflow for Receipt/Delivery step types
  if (purchasingRequestId && receivingUnitId) {
    const prId = new ObjectId(purchasingRequestId as string);

    const requests = await purchasingRequest.aggregation({
      pipeline: [{ $match: { _id: prId } }],
      projection: { _id: 1, status: 1, currentStep: 1, process: { _id: 1 } },
    }).toArray();

    if (requests.length > 0) {
      const req = requests[0];
      if (["Pending", "InProgress"].includes(req.status)) {
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
        if (stepIndex < steps.length) {
          const step = steps[stepIndex];
          const stepType = step.stepType as string;

          if (stepType === "Receipt" || stepType === "Delivery") {
            const uId = new ObjectId(receivingUnitId as string);

            const allUnitIds = step.assigneeGroups.flatMap(
              (g: { unitIds: string[] }) => g.unitIds,
            );

            if (allUnitIds.includes(receivingUnitId)) {
              // Create auto-approved stepApproval
              await stepApproval.insertOne({
                doc: { status: "approved", comment: "Auto-approved via goods receipt", decidedAt: now },
                projection: { _id: 1 },
                relations: {
                  purchasingRequest: {
                    _ids: prId,
                    relatedRelations: { stepApprovals: true },
                  },
                  processStep: {
                    _ids: step._id,
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

              // Evaluate step status
              const allApprovals = await stepApproval.aggregation({
                pipeline: [{ $match: { "purchasingRequest._id": prId, "processStep._id": step._id } }],
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

              if (overallStatus === "approved") {
                const nextStepIndex = stepIndex + 1;

                await purchasingRequest.findOneAndUpdate({
                  filter: { _id: prId },
                  update: {
                    $push: {
                      history: {
                        action: "step_approved",
                        performed: {
                          by: userId,
                          name: `${user.first_name} ${user.last_name}`,
                          at: now,
                          role: activeRole ? {
                            id: activeRole.roleId,
                            name: activeRole.name,
                            scopeType: activeRole.scopeType,
                            scopeId: activeRole.scopeId,
                          } : { id: "", name: "" },
                        },
                        unit: { _id: receivingUnitId, name: step.name },
                        details: {
                          stepName: step.name,
                          stepIndex,
                          stepType,
                          unitId: receivingUnitId,
                          comment: "Auto-approved via goods receipt",
                          autoApproved: true,
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
                        purchasingRequest: { _ids: prId, relatedRelations: { stepApprovals: true } },
                        processStep: { _ids: nextStep._id, relatedRelations: { approvals: true } },
                        unit: { _ids: new ObjectId(nuId), relatedRelations: { stepApprovals: true } },
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
                      $set: { status: "Completed", completedAt: now, updatedAt: now },
                      $push: {
                        history: {
                          action: "step_approved",
                          performed: {
                            by: userId,
                            name: `${user.first_name} ${user.last_name}`,
                            at: now,
                            role: activeRole ? {
                              id: activeRole.roleId,
                              name: activeRole.name,
                              scopeType: activeRole.scopeType,
                              scopeId: activeRole.scopeId,
                            } : { id: "", name: "" },
                          },
                          unit: { _id: receivingUnitId, name: step.name },
                          details: { stepName: step.name, stepIndex, stepType, unitId: receivingUnitId, comment: "Auto-approved via goods receipt", completed: true, autoApproved: true },
                        },
                      },
                    },
                    projection: { _id: 1 },
                  });
                }
              } else if (overallStatus === "rejected") {
                await purchasingRequest.findOneAndUpdate({
                  filter: { _id: prId },
                  update: { $set: { status: "Rejected", updatedAt: now } },
                  projection: { _id: 1 },
                });
              }
            }
          }
        }
      }
    }
  }

  // Auto-create draft payment order from receipt items
  if (orderTotal > 0 && purchasingRequestId) {
    const poTitle = `Payment for goods receipt ${rest.receiptNumber || ""}`;

    const paymentRelations: Record<string, unknown> = {
      purchasingRequest: {
        _ids: new ObjectId(purchasingRequestId as string),
        relatedRelations: { paymentOrders: true },
      },
      issuedBy: {
        _ids: new ObjectId(userId),
        relatedRelations: { issuedPaymentOrders: true },
      },
    };

    if (prStoreId) {
      paymentRelations.payTo = {
        _ids: new ObjectId(prStoreId),
        relatedRelations: { paymentOrders: true },
      };
    }

    paymentRelations.financialUnit = {
      _ids: new ObjectId(receivingUnitId as string),
      relatedRelations: { paymentOrders: true },
    };

    await paymentOrder.insertOne({
      doc: {
        title: poTitle,
        amount: Math.round(orderTotal * 100) / 100,
        status: "draft",
        description: `Auto-created from goods receipt ${result._id?.toString()}`,
      },
      projection: { _id: 1 },
      relations: paymentRelations,
    });
  }

  // Gap 7: Auto-convert budget encumbrance to spend on goods receipt
  if (purchasingRequestId && orderTotal > 0) {
    const encumbrances = await budgetEncumbrance.aggregation({
      pipeline: [
        {
          $match: {
            referenceType: "purchasingRequest",
            referenceId: (purchasingRequestId as string),
            status: "reserved",
          },
        },
      ],
      projection: { _id: 1, amount: 1, budgetLine: 1 },
    }).toArray();

    for (const enc of encumbrances) {
      const encId = enc._id as ObjectId;
      const encAmount = enc.amount as number;
      const convertAmount = Math.min(encAmount, orderTotal);
      const blId = (enc.budgetLine as Record<string, unknown>)?._id as string;

      if (convertAmount >= encAmount) {
        // Full conversion
        await budgetEncumbrance.findOneAndUpdate({
          filter: { _id: encId },
          update: { $set: { status: "spent", updatedAt: now } },
          projection: { _id: 1 },
        });
      } else {
        // Partial conversion — keep remaining as reserved
        await budgetEncumbrance.findOneAndUpdate({
          filter: { _id: encId },
          update: { $inc: { amount: -convertAmount }, $set: { updatedAt: now } },
          projection: { _id: 1 },
        });
        // Create a new spent encumbrance for the converted portion
        if (blId) {
          await budgetEncumbrance.insertOne({
            doc: {
              amount: convertAmount,
              status: "spent",
              referenceType: "goodsReceipt",
              referenceId: result._id?.toString(),
              description: `Auto-converted from encumbrance ${encId.toString()} via goods receipt`,
            },
            projection: { _id: 1 },
            relations: {
              budgetLine: { _ids: new ObjectId(blId), relatedRelations: { encumbrances: true } },
              createdBy: { _ids: user._id, relatedRelations: { budgetEncumbrances: true } },
            },
          });
        }
      }

      // Update budgetLine totals
      if (blId) {
        const bl = await budgetLine.findOne({
          filters: { _id: new ObjectId(blId) },
          projection: { _id: 1, totalEncumbered: 1, totalSpent: 1, totalAllocated: 1 },
        }) as Record<string, unknown>;

        if (bl) {
          const currentEncumbered = (bl.totalEncumbered as number) || 0;
          const currentSpent = (bl.totalSpent as number) || 0;
          const currentAllocated = (bl.totalAllocated as number) || 0;
          const actualConvert = Math.min(convertAmount || encAmount, currentEncumbered);
          await budgetLine.findOneAndUpdate({
            filter: { _id: new ObjectId(blId) },
            update: {
              $inc: { totalEncumbered: -actualConvert, totalSpent: actualConvert },
              $set: {
                remainingBudget: currentAllocated - (currentEncumbered - actualConvert) - (currentSpent + actualConvert),
                updatedAt: now,
              },
            },
            projection: { _id: 1 },
          });
        }
      }
    }
  }

  return result;
};
