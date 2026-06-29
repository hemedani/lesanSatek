import { grantAccess, requireFeature, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "tender",
    fn: addFn,
    actName: "add",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"], features: ["canCreateTender"] },
        { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canCreateTender"] },
      ]),
    ],
    validator: addValidator(),
    validationRunType: "create",
  });
