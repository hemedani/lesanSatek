import { grantAccess, requireFeature, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";

export const updateRelationsSetup = () =>
  coreApp.acts.setAct({
    schema: "purchaseOrderItem",
    fn: updateRelationsFn,
    actName: "updateRelations",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canAssignItemsToOrder"] },
      ]),
    ],
    validator: updateRelationsValidator(),
    validationRunType: "create",
  });
