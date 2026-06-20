import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";

export const updateSetup = () =>
  coreApp.acts.setAct({
    schema: "file",
    fn: updateFn,
    actName: "update",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin", "OrgHead", "UnitHead", "Employee", "Ordinary"] }]),
    ],
    validator: updateValidator(),
  });
