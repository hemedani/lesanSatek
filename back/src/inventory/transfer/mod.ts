import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { transferFn } from "./transfer.fn.ts";
import { transferValidator } from "./transfer.val.ts";

export const transferSetup = () =>
  coreApp.acts.setAct({
    schema: "inventory",
    fn: transferFn,
    actName: "transfer",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: transferValidator(),
  });
