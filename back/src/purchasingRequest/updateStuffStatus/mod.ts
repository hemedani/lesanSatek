import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateStuffStatusFn } from "./updateStuffStatus.fn.ts";
import { updateStuffStatusValidator } from "./updateStuffStatus.val.ts";

export const updateStuffStatusSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: updateStuffStatusFn,
    actName: "updateStuffStatus",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["StoreHead"] },
      ]),
    ],
    validator: updateStuffStatusValidator(),
  });
