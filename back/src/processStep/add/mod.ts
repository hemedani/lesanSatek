import { grantAccess, setTokens, setUser } from "@lib";
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
        { roles: ["OrgHead"], getScope: (b) => ({
          scopeType: "organization",
          scopeId: b?.details?.set?.organizationId || b?.details?.set?._id,
        })},
      ]),
    ],
    validator: addValidator(),
    validationRunType: "create",
  });
