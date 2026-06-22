import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";

export const budgetAllocationSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
};
