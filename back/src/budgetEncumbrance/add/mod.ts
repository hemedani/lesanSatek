import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetEncumbrance",
    fn: addFn,
    actName: "add",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
      ]),
    ],
    validator: addValidator(),
    validationRunType: "create",
  });
