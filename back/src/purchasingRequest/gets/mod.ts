import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getsSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: getsFn,
    actName: "gets",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin", "OrgHead", "UnitHead", "Employee", "Ordinary"] }]),
    ],
    validator: getsValidator(),
  });
