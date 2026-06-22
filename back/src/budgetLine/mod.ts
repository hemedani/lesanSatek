import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { countSetup } from "./count/mod.ts";

import { getBudgetReportSetup } from "./getBudgetReport/mod.ts";
import { getYearEndReportSetup } from "./getYearEndReport/mod.ts";

export const budgetLineSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
  updateSetup();
  countSetup();
  getBudgetReportSetup();
  getYearEndReportSetup();
};
