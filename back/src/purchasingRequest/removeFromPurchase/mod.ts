import { grantAccess, requireFeature, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeFromPurchaseFn } from "./removeFromPurchase.fn.ts";
import { removeFromPurchaseValidator } from "./removeFromPurchase.val.ts";

export const removeFromPurchaseSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: removeFromPurchaseFn,
    actName: "removeFromPurchase",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canAssignItemsToOrder"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canAssignItemsToOrder"] },
      ]),
    ],
    validator: removeFromPurchaseValidator(),
  });
