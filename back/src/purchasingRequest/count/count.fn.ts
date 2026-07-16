import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { coreApp, purchasingRequest } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { status, processId, requesterId, storeId, wareId, wareTypeId, wareClassId, wareGroupId, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const filters: Document = {};

  if (activeRole.name === "Employee" || activeRole.name === "Ordinary") {
    filters["requester._id"] = user._id;
  } else if (activeRole.name === "UnitHead") {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      filters["requestingUnit._id"] = new ObjectId(activeRole.scopeId);
    }
  }

  status && (filters["status"] = status);
  processId && (filters["process._id"] = new ObjectId(processId as string));
  requesterId && (filters["requester._id"] = new ObjectId(requesterId as string));
  storeId && (filters["store._id"] = new ObjectId(storeId as string));
  wareId && (filters["ware._id"] = new ObjectId(wareId as string));
  wareTypeId && (filters["wareType._id"] = new ObjectId(wareTypeId as string));
  wareClassId && (filters["wareClass._id"] = new ObjectId(wareClassId as string));
  wareGroupId && (filters["wareGroup._id"] = new ObjectId(wareGroupId as string));

  const foundedItemsLength = await purchasingRequest.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
