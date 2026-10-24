import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getUsersFn } from "./getUsers.fn.ts";
import { getUsersValidator } from "./getUsers.val.ts";
import { role_array } from "@model";
import type { RoleName } from "../../../utils/authzPolicy.ts";

const allowedRoles = role_array as RoleName[];

export const getUsersSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: getUsersFn,
    actName: "getUsers",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: allowedRoles }]),
    ],
    validator: getUsersValidator(),
  });
