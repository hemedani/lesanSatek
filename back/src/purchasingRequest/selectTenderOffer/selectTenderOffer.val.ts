import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const selectTenderOfferValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      tenderOfferId: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
