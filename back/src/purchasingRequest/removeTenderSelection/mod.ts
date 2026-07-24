import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeTenderSelectionFn } from "./removeTenderSelection.fn.ts";
import { removeTenderSelectionValidator } from "./removeTenderSelection.val.ts";

export const removeTenderSelectionSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: removeTenderSelectionFn,
    actName: "removeTenderSelection",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin", "OrgHead", "UnitHead"] },
      ]),
    ],
    validator: removeTenderSelectionValidator(),
  });
