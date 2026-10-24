import { grantAccess, setTokens, setUser } from "@lib";
import { roleScope } from "../../../utils/scopeResolvers.ts";
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
        { roles: ["OrgHead"], scope: roleScope() },
        { roles: ["UnitHead"], scope: roleScope() },
        { roles: ["Employee", "Ordinary"] },
      ]),
    ],
    validator: countValidator(),
  });
