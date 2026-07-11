import { addSetup } from "./add/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { releaseSetup } from "./release/mod.ts";
import { convertToSpendSetup } from "./convertToSpend/mod.ts";
import { removeSetup } from "./remove/mod.ts";

export const budgetEncumbranceSetup = () => {
  addSetup();
  getsSetup();
  releaseSetup();
  convertToSpendSetup();
  removeSetup();
};
