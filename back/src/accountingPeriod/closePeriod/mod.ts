import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { closePeriodFn } from "./closePeriod.fn.ts";
import { closePeriodValidator } from "./closePeriod.val.ts";

export const closePeriodSetup = () =>
  coreApp.acts.setAct({
    schema: "accountingPeriod",
    fn: closePeriodFn,
    actName: "closePeriod",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        {
          roles: ["UnitHead"],
          features: ["canCloseAccountingPeriod"],
        },
      ]),
    ],
    validator: closePeriodValidator(),
  });
