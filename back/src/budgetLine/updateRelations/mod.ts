import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const updateRelationsSetup = () =>
  coreApp.acts.setAct({
    schema: "budgetLine",
    fn: updateRelationsFn,
    actName: "updateRelations",
    preAct: [setTokens, setUser, grantAccess([{ roles: ["Manager", "Admin"] }])],
    validator: updateRelationsValidator(),
  });
