import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { checkStoreAvailabilityFn } from "./checkStoreAvailability.fn.ts";
import { checkStoreAvailabilityValidator } from "./checkStoreAvailability.val.ts";

export const checkStoreAvailabilitySetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: checkStoreAvailabilityFn,
    actName: "checkStoreAvailability",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee", "Ordinary"] },
      ]),
    ],
    validator: checkStoreAvailabilityValidator(),
  });
