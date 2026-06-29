/**
 * Manufacturer — Product manufacturer or producer.
 *
 * Represents a company that produces wares. Used in the Ware model to identify
 * the original producer. Has no relations defined here; the reverse (manufacturer.wares)
 * is auto-created by Lesan from ware.ts where ware defines manufacturer with
 * relatedRelations.
 *
 * Pure fields: name, enName, country
 * Relations: (none defined — reverse "wares" is auto-generated from ware.manufacturer)
 *
 * @example
 * // A medical equipment manufacturer
 * {
 *   _id: ObjectId("..."),
 *   name: "شرکت زیست شیمی",
 *   enName: "ZistShimi Co.",
 *   country: "Iran",
 *   createdAt: ISODate("2024-01-01T00:00:00Z"),
 *   updatedAt: ISODate("2024-01-01T00:00:00Z")
 * }
 */
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
