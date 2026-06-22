import { coreApp } from "../../../mod.ts";
import { countFn } from "./count.fn.ts";
import { countValidator } from "./count.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const countSetup = () =>
  coreApp.acts.setAct({
    schema: "purchaseOrderItem",
    fn: countFn,
    actName: "count",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: countValidator(),
  });
