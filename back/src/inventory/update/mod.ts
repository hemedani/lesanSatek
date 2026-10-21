import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";
import { assertUnitFieldInScope } from "../../../utils/writeScope.ts";
import {
  orgOfInventory,
  unitOfInventory,
} from "../../../utils/scopeResolvers.ts";

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
        { roles: ["UnitHead"], scope: unitOfInventory() },
        { roles: ["OrgHead"], scope: orgOfInventory() },
      ]),
      assertUnitFieldInScope("unitId"),
    ],
    validator: updateValidator(),
  });
