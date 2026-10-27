import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getIncomeStatementFn } from "./getIncomeStatement.fn.ts";
import { getIncomeStatementValidator } from "./getIncomeStatement.val.ts";

export const getIncomeStatementSetup = () =>
  coreApp.acts.setAct({
    schema: "journalEntry",
    fn: getIncomeStatementFn,
    actName: "getIncomeStatement",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        { roles: ["UnitHead", "Employee"], features: ["canViewAccounting"] },
      ]),
    ],
    validator: getIncomeStatementValidator(),
    validationRunType: "create",
  });
