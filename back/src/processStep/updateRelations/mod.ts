import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfProcessStep } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";

export const updateRelationsSetup = () =>
  coreApp.acts.setAct({
    schema: "processStep",
    fn: updateRelationsFn,
    actName: "updateRelations",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfProcessStep() },
      ]),
    ],
    validator: updateRelationsValidator(),
    validationRunType: "create",
  });
