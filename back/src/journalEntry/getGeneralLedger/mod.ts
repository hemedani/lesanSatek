import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getGeneralLedgerFn } from "./getGeneralLedger.fn.ts";
import { getGeneralLedgerValidator } from "./getGeneralLedger.val.ts";

export const getGeneralLedgerSetup = () =>
  coreApp.acts.setAct({
    schema: "journalEntry",
    fn: getGeneralLedgerFn,
    actName: "getGeneralLedger",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        { roles: ["UnitHead", "Employee"], features: ["canViewAccounting"] },
      ]),
    ],
    validator: getGeneralLedgerValidator(),
    validationRunType: "create",
  });
