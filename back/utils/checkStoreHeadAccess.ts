import { ObjectId } from "lesan";
import { coreApp, stuff } from "../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "./throwError.ts";

type CheckMode = "add" | "update" | "remove";

export const checkStoreHeadAccess = (mode: CheckMode) => {
  const check = async () => {
    const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
    const body = (coreApp.contextFns.getContextModel() as any)?.body;
    const activeRoleId = body?.details?.set?.activeRoleId;

    if (!activeRoleId) {
      throwError("activeRoleId is required");
      return;
    }

    const activeRole = user.roles?.find((r) => r.roleId === activeRoleId);
    if (!activeRole) {
      throwError("Active role not found");
      return;
    }

    if (activeRole.name !== "StoreHead") return;

    if (activeRole.scopeType !== "store" || !activeRole.scopeId) {
      throwError("StoreHead role must have a store scope");
      return;
    }

    const managedStoreId = activeRole.scopeId;

    if (mode === "add") {
      const targetStoreId = body?.details?.set?.storeId;
      if (!targetStoreId) {
        throwError("storeId is required");
        return;
      }
      if (targetStoreId !== managedStoreId) {
        throwError("You can only add items to your own store");
        return;
      }
      return;
    }

    const _id = body?.details?.set?._id;
    if (!_id) {
      throwError("_id is required");
      return;
    }

    const doc = await stuff.findOne({
      filters: { _id: new ObjectId(_id) },
      projection: { store: { _id: 1 } },
    });

    if (!doc) {
      throwError("Stuff not found");
      return;
    }

    const docStoreId = (doc.store as Record<string, unknown>)?._id?.toString();
    if (docStoreId !== managedStoreId) {
      throwError("You can only manage stuff belonging to your own store");
      return;
    }
  };

  return check;
};
