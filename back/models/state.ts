import { coreApp } from "../mod.ts";
import { optional, string } from "lesan";
import { createUpdateAt } from "@lib";

export const state_pure = {
  name: string(),
  enName: optional(string()),
  ...createUpdateAt,
};

export const state_relations = {};

export const states = () =>
  coreApp.odm.newModel("state", state_pure, state_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
