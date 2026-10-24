import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfProcess } from "../../../utils/scopeResolvers.ts";
import {
  assertOrgFieldInScope,
  assertUnitFieldInScope,
} from "../../../utils/writeScope.ts";
import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";

export const updateRelationsSetup = () =>
  coreApp.acts.setAct({
    schema: "process",
    fn: updateRelationsFn,
    actName: "updateRelations",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfProcess() },
      ]),
      assertOrgFieldInScope("organizationId"),
      assertUnitFieldInScope("unitId"),
    ],
    validator: updateRelationsValidator(),
    validationRunType: "create",
  });
