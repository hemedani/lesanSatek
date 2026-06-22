import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getYearEndReportFn } from "./getYearEndReport.fn.ts";
import { getYearEndReportValidator } from "./getYearEndReport.val.ts";

export const getYearEndReportSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetLine",
    fn: getYearEndReportFn,
    actName: "getYearEndReport",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: getYearEndReportValidator(),
  });
