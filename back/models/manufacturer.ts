import { coreApp } from "../mod.ts";
import { optional, string } from "lesan";
import { createUpdateAt } from "@lib";

export const manufacturer_pure = {
  name: string(),
  enName: optional(string()),
  country: optional(string()),
  ...createUpdateAt,
};

export const manufacturer_relations = {};

export const manufacturers = () =>
  coreApp.odm.newModel("manufacturer", manufacturer_pure, manufacturer_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
