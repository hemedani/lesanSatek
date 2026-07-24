import { enums, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      wareModelId: optional(objectIdValidation),
      wareClassId: optional(objectIdValidation),
      wareGroupId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
      manufacturerId: optional(objectIdValidation),
      brand: optional(string()),
      priceMin: optional(number()),
      priceMax: optional(number()),
      irc: optional(string()),
      umdns: optional(number()),
      gtin: optional(number()),
      sortBy: optional(enums([
        "createdAt", "updatedAt", "name", "price", "brand",
      ])),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("ware", 2),
  });
};
