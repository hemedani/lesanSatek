import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getTrialBalanceFn } from "./getTrialBalance.fn.ts";
import { getTrialBalanceValidator } from "./getTrialBalance.val.ts";

export const getTrialBalanceSetup = () =>
  coreApp.acts.setAct({
    schema: "journalEntry",
    fn: getTrialBalanceFn,
    actName: "getTrialBalance",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        { roles: ["UnitHead", "Employee"], features: ["canViewAccounting"] },
      ]),
    ],
    validator: getTrialBalanceValidator(),
    validationRunType: "create",
  });
