import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateUserRelationsFn } from "./updateUserRelations.fn.ts";
import { updateUserRelationsValidator } from "./updateUserRelations.val.ts";
import { checkGhostUser } from "../addUser/mod.ts";

export const updateUserRelationsSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: updateUserRelationsFn,
    actName: "updateUserRelations",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], getScope: (b) => ({
          scopeType: "organization",
          scopeId: b?.details?.set?.organization,
        })},
      ]),
      checkGhostUser,
    ],
    validator: updateUserRelationsValidator(),
    validationRunType: "create",
  });