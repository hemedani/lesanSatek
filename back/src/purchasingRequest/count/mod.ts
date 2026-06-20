import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { countFn } from "./count.fn.ts";
import { countValidator } from "./count.val.ts";

export const countSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: countFn,
    actName: "count",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: countValidator(),
  });
