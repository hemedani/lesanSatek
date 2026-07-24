import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const removeTenderSelectionFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );
  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: { _id: 1, status: 1, selectionType: 1, selectedTenderOfferId: 1 },
  }) as Record<string, unknown>;

  if (!pr) { throw new Error("Purchasing request not found"); }

  if (pr.selectionType !== "tender") {
    throw new Error("No tender offer is currently selected");
  }

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: {
        selectionType: "none",
        updatedAt: now,
      },
      $unset: { selectedTenderOfferId: "" },
    },
    projection: { _id: 1 },
  });

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "tender_offer_removed",
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
            previousTenderOfferId: pr.selectedTenderOfferId,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({ filters: { _id: prId }, projection: get });
};
