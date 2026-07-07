import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { countUsersFn } from "./countUsers.fn.ts";
import { countUsersValidator } from "./countUsers.val.ts";

export const countUsersSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: countUsersFn,
    actName: "countUsers",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager"] }]),
    ],
    validator: countUsersValidator(),
  });
