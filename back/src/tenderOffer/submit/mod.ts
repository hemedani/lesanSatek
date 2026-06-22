import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { submitFn } from "./submit.fn.ts";
import { submitValidator } from "./submit.val.ts";

export const submitSetup = () =>
  coreApp.acts.setAct({
    schema: "tenderOffer",
    fn: submitFn,
    actName: "submit",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
        { roles: ["Ordinary"] },
      ]),
    ],
    validator: submitValidator(),
    validationRunType: "create",
  });
