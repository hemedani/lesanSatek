import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { convertToSpendFn } from "./convertToSpend.fn.ts";
import { convertToSpendValidator } from "./convertToSpend.val.ts";

export const convertToSpendSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetEncumbrance",
    fn: convertToSpendFn,
    actName: "convertToSpend",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
      ]),
    ],
    validator: convertToSpendValidator(),
  });
