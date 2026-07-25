import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { finalizeFn } from "./finalize.fn.ts";
import { finalizeValidator } from "./finalize.val.ts";

export const finalizeSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: finalizeFn,
    actName: "finalize",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin", "OrgHead"] }]),
    ],
    validator: finalizeValidator(),
    validationRunType: "create",
  });
