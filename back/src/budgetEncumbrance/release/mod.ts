import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { releaseFn } from "./release.fn.ts";
import { releaseValidator } from "./release.val.ts";

export const releaseSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetEncumbrance",
    fn: releaseFn,
    actName: "release",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
      ]),
    ],
    validator: releaseValidator(),
  });
