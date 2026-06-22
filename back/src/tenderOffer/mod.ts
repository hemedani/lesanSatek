import { submitSetup } from "./submit/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";

export const tenderOfferSetup = () => {
  submitSetup();
  getSetup();
  getsSetup();
};
