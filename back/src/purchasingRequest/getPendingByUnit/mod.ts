import { coreApp } from "../../../mod.ts";
import { getPendingByUnitFn } from "./getPendingByUnit.fn.ts";
import { getPendingByUnitValidator } from "./getPendingByUnit.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getPendingByUnitSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: getPendingByUnitFn,
    actName: "getPendingByUnit",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin", "OrgHead", "UnitHead", "StoreHead", "Employee", "Ordinary"] }]),
    ],
    validator: getPendingByUnitValidator(),
  });
