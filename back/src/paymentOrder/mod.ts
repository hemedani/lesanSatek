import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { markPaidSetup } from "./markPaid/mod.ts";

export const paymentOrderSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
  updateSetup();
  markPaidSetup();
};
