import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getUserFn } from "./getUser.fn.ts";
import { getUserValidator } from "./getUser.val.ts";
import { role_array } from "@model";
import type { RoleName } from "../../../utils/authzPolicy.ts";

const allowedRoles = role_array as RoleName[];

export const getUserSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "getUser",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: allowedRoles }]),
    ],
    validator: getUserValidator(),
    fn: getUserFn,
  });
