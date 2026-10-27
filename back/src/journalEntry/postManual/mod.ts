import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { postManualFn } from "./postManual.fn.ts";
import { postManualValidator } from "./postManual.val.ts";

export const postManualSetup = () =>
  coreApp.acts.setAct({
    schema: "journalEntry",
    fn: postManualFn,
    actName: "postManual",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
        {
          roles: ["UnitHead", "Employee"],
          features: ["canPostManualJournalEntry"],
        },
      ]),
    ],
    validator: postManualValidator(),
    validationRunType: "create",
  });
