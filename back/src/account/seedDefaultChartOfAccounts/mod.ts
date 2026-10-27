import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { seedDefaultChartOfAccountsFn } from "./seedDefaultChartOfAccounts.fn.ts";
import { seedDefaultChartOfAccountsValidator } from "./seedDefaultChartOfAccounts.val.ts";

export const seedDefaultChartOfAccountsSetup = () =>
  coreApp.acts.setAct({
    schema: "account",
    fn: seedDefaultChartOfAccountsFn,
    actName: "seedDefaultChartOfAccounts",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        { roles: ["UnitHead"], features: ["canManageAccounting"] },
      ]),
    ],
    validator: seedDefaultChartOfAccountsValidator(),
  });
