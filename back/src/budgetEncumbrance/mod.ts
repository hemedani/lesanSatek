import { addSetup } from "./add/mod.ts";
import { releaseSetup } from "./release/mod.ts";
import { convertToSpendSetup } from "./convertToSpend/mod.ts";

export const budgetEncumbranceSetup = () => {
  addSetup();
  releaseSetup();
  convertToSpendSetup();
};
