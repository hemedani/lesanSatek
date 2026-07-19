import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addStuffFn } from "./addStuff.fn.ts";
import { addStuffValidator } from "./addStuff.val.ts";

export const addStuffSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: addStuffFn,
    actName: "addStuff",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canAssignItemsToOrder"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canAssignItemsToOrder"] },
      ]),
    ],
    validator: addStuffValidator(),
  });
