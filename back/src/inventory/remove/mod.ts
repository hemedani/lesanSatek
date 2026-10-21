import { coreApp } from "../../../mod.ts";
import { removeFn } from "./remove.fn.ts";
import { removeValidator } from "./remove.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";
import { assertUnitFieldInScope } from "../../../utils/writeScope.ts";

export const removeSetup = () =>
  coreApp.acts.setAct({
    schema: "inventory",
    fn: removeFn,
    actName: "remove",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
      assertUnitFieldInScope("unitId"),
    ],
    validator: removeValidator(),
  });
