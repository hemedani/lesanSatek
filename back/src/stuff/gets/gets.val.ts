import { boolean, coerce, date, enums, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

const monthEnum = enums([
  "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "eighteen", "twentyFour",
]);

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      wareModelId: optional(objectIdValidation),
      wareId: optional(objectIdValidation),
      storeId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
      wareClassId: optional(objectIdValidation),
      wareGroupId: optional(objectIdValidation),
      priceMin: optional(number()),
      priceMax: optional(number()),
      quantityMin: optional(number()),
      hasAbsolutePrice: optional(boolean()),
      hasLongPayment: optional(boolean()),
      availableLongPayment: optional(string()),
      minLongPaymentMonth: optional(monthEnum),
      expirationBefore: optional(coerce(date(), string(), (value) => new Date(value))),
      expirationAfter: optional(coerce(date(), string(), (value) => new Date(value))),
      isExpirationNear: optional(boolean()),
      barcode: optional(number()),
      sortBy: optional(enums([
        "createdAt", "updatedAt", "name", "price", "quantity",
        "expiration", "barcode", "twoMonth", "twelveMonth", "twentyFourMonth",
      ])),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("stuff", 2),
  });
};
