import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { convertItemsFn } from "./convertItems.fn.ts";
import { convertItemsValidator } from "./convertItems.val.ts";

export const convertItemsSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: convertItemsFn,
    actName: "convertItems",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead", "UnitHead", "Employee"] },
      ]),
    ],
    validator: convertItemsValidator(),
  });
