import { type ActFn, type Document, ObjectId } from "lesan";
import { goodsReceipt, purchasingRequest, paymentOrder, purchaseOrderItem, processStep, stepApproval, budgetEncumbrance, budgetLine, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
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

  const result = await goodsReceipt.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  if (!result) {
    throw { error: "Failed to create goods receipt" };
  }

  const items = (rest.items as Array<{
    purchaseOrderItemId: string;
    wareModelId: string;
    wareModelName?: string;
    wareId?: string;
    wareName?: string;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected: number;
  }>) || [];

  const userId = receivedById ? (receivedById as string) : `${user._id}`;

  // Gaps 4 & 6: Update PO item status + collect pricing for auto-payment
  let orderTotal = 0;

  for (const item of items) {
    if (item.quantityAccepted > 0) {
      // Add stock
      await addStock(
        receivingUnitId as string,
        item.wareModelId,
        item.wareModelName || item.wareModelId,
        item.quantityAccepted,
        "goods_receipt",
        userId,
        {
          wareId: item.wareId,
          wareName: item.wareName,
          referenceType: "goodsReceipt",
          referenceId: result._id?.toString(),
          description: `Goods receipt for ${item.wareModelName || item.wareModelId}`,
        },
      );

      // Gap 4: Update purchaseOrderItem status to "received"
      if (item.purchaseOrderItemId) {
        const poItem = await purchaseOrderItem.findOne({
          filters: { _id: new ObjectId(item.purchaseOrderItemId) },
          projection: { _id: 1, unitPrice: 1, totalPrice: 1, quantity: 1 },
        }) as Record<string, unknown>;

        if (poItem) {
          await purchaseOrderItem.findOneAndUpdate({
            filter: { _id: new ObjectId(item.purchaseOrderItemId) },
            update: { $set: { status: "received", updatedAt: now } },
            projection: { _id: 1 },
          });

          // Gap 6: Calculate order total from PO item pricing
          const itemTotal = (poItem.totalPrice as number) ||
            ((poItem.unitPrice as number || 0) * item.quantityAccepted);
          orderTotal += itemTotal;
        }
      }
    }
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
                pipeline: [{ $match: { purchasingRequest: prId, processStep: step._id } }],
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

  // Gap 6: Auto-create draft payment order from receipt items
  if (orderTotal > 0 && purchasingRequestId) {
    const poTitle = `Payment for goods receipt ${rest.receiptNumber || ""}`;

    await paymentOrder.insertOne({
      doc: {
        title: poTitle,
        amount: Math.round(orderTotal * 100) / 100,
        status: "draft",
        description: `Auto-created from goods receipt ${result._id?.toString()}`,
      },
      projection: { _id: 1 },
      relations: {
        purchasingRequest: {
          _ids: new ObjectId(purchasingRequestId as string),
          relatedRelations: { paymentOrders: true },
        },
        issuedBy: {
          _ids: new ObjectId(userId),
          relatedRelations: { issuedPaymentOrders: true },
        },
      },
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
