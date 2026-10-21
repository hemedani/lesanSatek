import { grantAccess, setTokens, setUser } from "@lib";
import { assertUnitFieldInScope } from "../../../utils/writeScope.ts";
import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "inventory",
    fn: addFn,
    actName: "add",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
      assertUnitFieldInScope("unitId"),
    ],
    validator: addValidator(),
    validationRunType: "create",
  });
