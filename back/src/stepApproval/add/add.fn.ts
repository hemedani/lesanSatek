import { type ActFn, ObjectId } from "lesan";
import { stepApproval, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const { activeRoleId, purchasingRequestId, processStepId, unitId, ...rest } = set;

  return await stepApproval.insertOne({
    doc: { ...rest, decidedAt: new Date() },
    relations: {
      purchasingRequest: {
        _ids: new ObjectId(purchasingRequestId as string),
        relatedRelations: {
          stepApprovals: true,
        },
      },
      processStep: {
        _ids: new ObjectId(processStepId as string),
        relatedRelations: {
          approvals: true,
        },
      },
      unit: {
        _ids: new ObjectId(unitId as string),
        relatedRelations: {
          stepApprovals: true,
        },
      },
      decidedBy: {
        _ids: user._id,
        relatedRelations: {
          stepDecisions: true,
        },
      },
    },
    projection: get,
  });
};
