/**
 * State — Geographic state or province.
 *
 * Top-level geographic region used for locating stores, cities, and delivery zones.
 * Has no relations defined here; the reverse relation (state.cities) is auto-created
 * by Lesan from city.ts where city defines state with relatedRelations.
 *
 * Pure fields: name, enName
 * Relations: (none defined — reverse "cities" is auto-generated from city.state)
 *
 * @example
 * // An Iranian province
 * {
 *   _id: ObjectId("..."),
 *   name: "تهران",
 *   enName: "Tehran",
 *   createdAt: ISODate("2024-01-01T00:00:00Z"),
 *   updatedAt: ISODate("2024-01-01T00:00:00Z")
 * }
 */
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
