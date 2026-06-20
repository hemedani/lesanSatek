import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeFn } from "./remove.fn.ts";
import { removeValidator } from "./remove.val.ts";

export const removeSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    actName: "remove",
    fn: removeFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: removeValidator(),
  });
