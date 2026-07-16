import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const updateSetup = () =>
  coreApp.acts.setAct({
    schema: "inventory",
    fn: updateFn,
    actName: "update",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["UnitHead"], getScope: (b) => ({
          scopeType: "unit",
          scopeId: b?.details?.set?.unitId,
        })},
        { roles: ["OrgHead"] },
      ]),
    ],
    validator: updateValidator(),
  });
