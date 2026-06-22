import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { duplicateProcessFn } from "./duplicateProcess.fn.ts";
import { duplicateProcessValidator } from "./duplicateProcess.val.ts";

export const duplicateProcessSetup = () =>
  coreApp.acts.setAct({
    schema: "process",
    fn: duplicateProcessFn,
    actName: "duplicateProcess",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
      ]),
    ],
    validator: duplicateProcessValidator(),
  });
