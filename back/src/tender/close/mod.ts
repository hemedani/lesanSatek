import { grantAccess, requireFeature, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { closeFn } from "./close.fn.ts";
import { closeValidator } from "./close.val.ts";

export const closeSetup = () =>
  coreApp.acts.setAct({
    schema: "tender",
    fn: closeFn,
    actName: "close",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canCreateTender"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canCreateTender"] },
      ]),
    ],
    validator: closeValidator(),
  });
