import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getUserFn } from "./getUser.fn.ts";
import { getUserValidator } from "./getUser.val.ts";
import { role_array } from "@model";

export const getUserSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "getUser",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: role_array }]),
    ],
    validator: getUserValidator(),
    fn: getUserFn,
  });