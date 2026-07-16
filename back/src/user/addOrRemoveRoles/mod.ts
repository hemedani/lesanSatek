import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addOrRemoveRolesFn } from "./addOrRemoveRoles.fn.ts";
import { addOrRemoveRolesValidator } from "./addOrRemoveRoles.val.ts";

export const addOrRemoveRolesSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: addOrRemoveRolesFn,
    actName: "addOrRemoveRoles",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], getScope: (b) => ({
          scopeType: "organization",
          scopeId: b?.details?.set?._id,
        })},
      ]),
    ],
    validator: addOrRemoveRolesValidator(),
  });
