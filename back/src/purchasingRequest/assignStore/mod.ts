import { grantAccess, requireFeature, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { assignStoreFn } from "./assignStore.fn.ts";
import { assignStoreValidator } from "./assignStore.val.ts";

export const assignStoreSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: assignStoreFn,
    actName: "assignStore",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canAssignItemsToOrder"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canAssignItemsToOrder"] },
      ]),
    ],
    validator: assignStoreValidator(),
  });
