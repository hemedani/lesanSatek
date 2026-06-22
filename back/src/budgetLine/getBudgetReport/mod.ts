import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getBudgetReportFn } from "./getBudgetReport.fn.ts";
import { getBudgetReportValidator } from "./getBudgetReport.val.ts";

export const getBudgetReportSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetLine",
    fn: getBudgetReportFn,
    actName: "getBudgetReport",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: getBudgetReportValidator(),
  });
