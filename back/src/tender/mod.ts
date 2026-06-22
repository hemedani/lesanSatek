import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { updateRelationsSetup } from "./updateRelations/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { countSetup } from "./count/mod.ts";
import { closeSetup } from "./close/mod.ts";
import { awardSetup } from "./award/mod.ts";

export const tenderSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
  updateSetup();
  updateRelationsSetup();
  removeSetup();
  countSetup();
  closeSetup();
  awardSetup();
};
