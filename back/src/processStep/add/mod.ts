import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfProcessInSet } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "processStep",
    fn: addFn,
    actName: "add",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], scope: orgOfProcessInSet("processId") },
      ]),
    ],
    validator: addValidator(),
    validationRunType: "create",
  });
