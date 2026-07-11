import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { closeSetup } from "./close/mod.ts";
import { removeSetup } from "./remove/mod.ts";

export const fiscalYearSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
  updateSetup();
  closeSetup();
  removeSetup();
};
