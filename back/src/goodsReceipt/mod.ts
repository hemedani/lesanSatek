import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";

export const goodsReceiptSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
  updateSetup();
};
