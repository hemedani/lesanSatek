import { grantAccess, setTokens, setUser } from "@lib";
import { countFn } from "./count.fn.ts";
import { countValidator } from "./count.val.ts";
import { coreApp } from "../../../mod.ts";

export const countSetup = () =>
  coreApp.acts.setAct({
    schema: "unit",
    fn: countFn,
    actName: "count",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"], getScope: (b) => ({
          scopeType: "organization",
          scopeId: b?.details?.set?.organizationId,
        })},
        { roles: ["UnitHead"], getScope: (b) => ({
          scopeType: "unit",
          scopeId: b?.details?.set?._id,
        })},
      ]),
    ],
    validator: countValidator(),
  });
