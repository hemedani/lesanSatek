import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfNewUnit, unitFromSet } from "../../../utils/scopeResolvers.ts";
import {
  assertOrgFieldInScope,
  assertParentUnitInScope,
} from "../../../utils/writeScope.ts";
import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "unit",
    fn: addFn,
    actName: "add",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfNewUnit() },
        { roles: ["UnitHead"], scope: unitFromSet("parentUnitId") },
      ]),
      assertOrgFieldInScope("organizationId"),
      assertParentUnitInScope("parentUnitId"),
    ],
    validator: addValidator(),
    validationRunType: "create",
  });
