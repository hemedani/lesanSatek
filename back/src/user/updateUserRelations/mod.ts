import { grantAccess, setTokens, setUser } from "@lib";
import { userTargetScope } from "../shared/assignRoles.ts";
import { coreApp } from "../../../mod.ts";
import { updateUserRelationsFn } from "./updateUserRelations.fn.ts";
import { updateUserRelationsValidator } from "./updateUserRelations.val.ts";

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
        { roles: ["OrgHead"], scope: userTargetScope() },
      ]),
    ],
    validator: updateUserRelationsValidator(),
    validationRunType: "create",
  });
