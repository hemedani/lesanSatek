import { coreApp } from "../mod.ts";
import { optional, string } from "lesan";
import { createUpdateAt } from "@lib";

export const wareType_pure = {
  name: string(),
  enName: optional(string()),
  ...createUpdateAt,
};

export const wareType_relations = {};

export const wareTypes = () =>
  coreApp.odm.newModel("wareType", wareType_pure, wareType_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
