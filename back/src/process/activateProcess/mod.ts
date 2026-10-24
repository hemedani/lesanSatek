import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfProcess } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { activateProcessFn } from "./activateProcess.fn.ts";
import { activateProcessValidator } from "./activateProcess.val.ts";

export const activateProcessSetup = () =>
  coreApp.acts.setAct({
    schema: "process",
    fn: activateProcessFn,
    actName: "activateProcess",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfProcess() },
      ]),
    ],
    validator: activateProcessValidator(),
  });
