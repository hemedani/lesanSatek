import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getUsersFn } from "./getUsers.fn.ts";
import { getUsersValidator } from "./getUsers.val.ts";
import { role_array } from "@model";

export const getUsersSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: getUsersFn,
    actName: "getUsers",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: role_array }]),
    ],
    validator: getUsersValidator(),
  });