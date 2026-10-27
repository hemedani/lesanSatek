import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeFn } from "./remove.fn.ts";
import { removeValidator } from "./remove.val.ts";

export const removeSetup = () =>
  coreApp.acts.setAct({
    schema: "costCenter",
    fn: removeFn,
    actName: "remove",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        { roles: ["UnitHead"], features: ["canManageAccounting"] },
      ]),
    ],
    validator: removeValidator(),
  });
