import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { warehouseCheckFn } from "./warehouseCheck.fn.ts";
import { warehouseCheckValidator } from "./warehouseCheck.val.ts";

export const warehouseCheckSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: warehouseCheckFn,
    actName: "warehouseCheck",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: warehouseCheckValidator(),
  });
