import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfUnit, unitFromSet } from "../../../utils/scopeResolvers.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { coreApp } from "../../../mod.ts";

export const updateSetup = () =>
  coreApp.acts.setAct({
    schema: "unit",
    fn: updateFn,
    actName: "update",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfUnit() },
        { roles: ["UnitHead"], scope: unitFromSet("_id") },
      ]),
    ],
    validator: updateValidator(),
  });
