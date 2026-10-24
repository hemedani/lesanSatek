import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateUserFn } from "./updateUser.fn.ts";
import { updateUserValidator } from "./updateUser.val.ts";
import { assertOrgHeadCanUpdateUser } from "../shared/userManagement.ts";

export const updateUserSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: updateUserFn,
    actName: "updateUser",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
      ]),
      assertOrgHeadCanUpdateUser,
    ],
    validator: updateUserValidator(),
    validationRunType: "create",
  });
