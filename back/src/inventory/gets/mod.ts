import { grantAccess, setTokens, setUser } from "@lib";
import { roleScope } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";

export const getsSetup = () =>
  coreApp.acts.setAct({
    schema: "inventory",
    fn: getsFn,
    actName: "gets",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], scope: roleScope() },
      ]),
    ],
    validator: getsValidator(),
  });
