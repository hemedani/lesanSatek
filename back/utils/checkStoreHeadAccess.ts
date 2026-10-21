import { ObjectId } from "lesan";
import { coreApp, stuff } from "../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "./throwError.ts";

type CheckMode = "add" | "update" | "remove";

export const checkStoreHeadAccess = (mode: CheckMode) => {
  const check = async () => {
    const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
    const body = (coreApp.contextFns.getContextModel() as any)?.body;
    const set = body?.details?.set ?? {};
    const activeRoleId = set.activeRoleId;

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

    const managedStoreId = String(activeRole.scopeId);

    if (mode === "add") {
      const targetStoreId = set.storeId;
      if (!targetStoreId) {
        throwError("storeId is required");
        return;
      }
      if (String(targetStoreId) !== managedStoreId) {
        throwError("You cant do this");
        return;
      }
      return;
    }

    const _id = set._id;
    if (!_id) {
      throwError("_id is required");
      return;
    }

    const doc = await stuff.findOne({
      filters: { _id: new ObjectId(String(_id)) },
      projection: { store: { _id: 1 } },
    });

    if (!doc) {
      throwError("Stuff not found");
      return;
    }

    const docStoreId = (doc.store as Record<string, unknown>)?._id?.toString();
    if (docStoreId !== managedStoreId) {
      throwError("You cant do this");
      return;
    }

    if (mode === "update" && set.storeId !== undefined) {
      if (String(set.storeId) !== managedStoreId) {
        throwError("You cant do this");
        return;
      }
    }
  };

  return check;
};
