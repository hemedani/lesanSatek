import { coreApp } from "../../../mod.ts";
import { removeFn } from "./remove.fn.ts";
import { removeValidator } from "./remove.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const removeSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetAllocation",
    fn: removeFn,
    actName: "remove",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: removeValidator(),
  });
