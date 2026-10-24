import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfUnit, unitFromSet } from "../../../utils/scopeResolvers.ts";
import {
  assertOrgFieldInScope,
  assertParentUnitInScope,
} from "../../../utils/writeScope.ts";
import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";

export const updateRelationsSetup = () =>
  coreApp.acts.setAct({
    schema: "unit",
    fn: updateRelationsFn,
    actName: "updateRelations",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfUnit() },
        { roles: ["UnitHead"], scope: unitFromSet("_id") },
      ]),
      assertOrgFieldInScope("organizationId"),
      assertParentUnitInScope("parentUnitId"),
    ],
    validator: updateRelationsValidator(),
    validationRunType: "create",
  });
