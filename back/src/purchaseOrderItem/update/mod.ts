import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { grantAccess, requireFeature, setTokens, setUser } from "@lib";

export const updateSetup = () =>
  coreApp.acts.setAct({
    schema: "purchaseOrderItem",
    fn: updateFn,
    actName: "update",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canAssignItemsToOrder"] },
      ]),
    ],
    validator: updateValidator(),
  });
