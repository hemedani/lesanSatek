import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { markPaidFn } from "./markPaid.fn.ts";
import { markPaidValidator } from "./markPaid.val.ts";

export const markPaidSetup = () =>
  coreApp.acts.setAct({
    schema: "paymentOrder",
    fn: markPaidFn,
    actName: "markPaid",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: markPaidValidator(),
  });
