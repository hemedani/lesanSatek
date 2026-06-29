import { grantAccess, requireFeature, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { awardFn } from "./award.fn.ts";
import { awardValidator } from "./award.val.ts";

export const awardSetup = () =>
  coreApp.acts.setAct({
    schema: "tender",
    fn: awardFn,
    actName: "award",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canCreateTender"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canCreateTender"] },
      ]),
    ],
    validator: awardValidator(),
  });
