import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { deductDirectFn } from "./deductDirect.fn.ts";
import { deductDirectValidator } from "./deductDirect.val.ts";

export const deductDirectSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetLine",
    fn: deductDirectFn,
    actName: "deductDirect",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        { roles: ["UnitHead"], features: ["canIssuePaymentOrder"] },
      ]),
    ],
    validator: deductDirectValidator(),
  });
