import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const removeFromPurchaseFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);
  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: { _id: 1, status: 1, stuffStatus: 1, stuff: { _id: 1 }, store: { _id: 1 } },
  }) as Record<string, unknown>;

  if (!pr) {
    throw new Error("Purchasing request not found");
  }

  if (!["Pending", "InProgress", "Approved"].includes(pr.status as string)) {
    throw new Error("Cannot remove items from a completed, rejected, or draft request");
  }

  if ((pr.stuffStatus as string) === "none") {
    throw new Error("No stuff is assigned to this purchasing request");
  }

  if ((pr.stuffStatus as string) === "cancelled") {
    throw new Error("Stuff assignment is already cancelled");
  }

  // Clear stuff assignment on PR
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: {
        stuffStatus: "cancelled",
        updatedAt: now,
      },
      $unset: {
        estimatedAmount: "",
      },
    },
    projection: { _id: 1 },
  });

  // Unlink stuff and store relations
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: { $unset: { stuff: "", store: "" } },
    projection: { _id: 1 },
  });

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "stuff_removed",
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
          details: {
            previousStuffId: (pr.stuff as Record<string, unknown>)?._id?.toString(),
            previousStoreId: (pr.store as Record<string, unknown>)?._id?.toString(),
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
