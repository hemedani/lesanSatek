import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { updateRelationsSetup } from "./updateRelations/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { countSetup } from "./count/mod.ts";
import { submitSetup } from "./submit/mod.ts";
import { warehouseCheckSetup } from "./warehouseCheck/mod.ts";

import { getHistorySetup } from "./getHistory/mod.ts";
import { assignStoreSetup } from "./assignStore/mod.ts";
import { checkStoreAvailabilitySetup } from "./checkStoreAvailability/mod.ts";

export const purchasingRequestSetup = () => {
  addSetup();
  updateSetup();
  updateRelationsSetup();
  getSetup();
  getsSetup();
  removeSetup();
  countSetup();
  submitSetup();
  warehouseCheckSetup();
  getHistorySetup();
  assignStoreSetup();
  checkStoreAvailabilitySetup();
};
