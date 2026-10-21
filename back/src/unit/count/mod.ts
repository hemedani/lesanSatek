import { grantAccess, setTokens, setUser } from "@lib";
import { orgFromSet, unitFromSet } from "../../../utils/scopeResolvers.ts";
import { countFn } from "./count.fn.ts";
import { countValidator } from "./count.val.ts";
import { coreApp } from "../../../mod.ts";

export const countSetup = () =>
  coreApp.acts.setAct({
    schema: "unit",
    fn: countFn,
    actName: "count",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgFromSet("organizationId") },
        { roles: ["UnitHead"], scope: unitFromSet("_id") },
      ]),
    ],
    validator: countValidator(),
  });
