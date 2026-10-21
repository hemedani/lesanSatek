import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfProcessStep } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";

export const updateSetup = () =>
  coreApp.acts.setAct({
    schema: "processStep",
    fn: updateFn,
    actName: "update",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfProcessStep() },
      ]),
    ],
    validator: updateValidator(),
  });
