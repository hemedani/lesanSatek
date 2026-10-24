import { grantAccess, setTokens, setUser } from "@lib";
import { roleScope } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { getFn } from "./get.fn.ts";
import { getValidator } from "./get.val.ts";

export const getSetup = () =>
  coreApp.acts.setAct({
    schema: "inventory",
    fn: getFn,
    actName: "get",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], scope: roleScope() },
      ]),
    ],
    validator: getValidator(),
  });
