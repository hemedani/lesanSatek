import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { selectTenderOfferFn } from "./selectTenderOffer.fn.ts";
import { selectTenderOfferValidator } from "./selectTenderOffer.val.ts";

export const selectTenderOfferSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: selectTenderOfferFn,
    actName: "selectTenderOffer",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin", "OrgHead", "UnitHead"] },
      ]),
    ],
    validator: selectTenderOfferValidator(),
  });
