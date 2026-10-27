import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { countSetup } from "./count/mod.ts";
import { postManualSetup } from "./postManual/mod.ts";
import { getTrialBalanceSetup } from "./getTrialBalance/mod.ts";
import { getGeneralLedgerSetup } from "./getGeneralLedger/mod.ts";
import { getIncomeStatementSetup } from "./getIncomeStatement/mod.ts";

export const journalEntrySetup = () => {
  getSetup();
  getsSetup();
  countSetup();
  postManualSetup();
  getTrialBalanceSetup();
  getGeneralLedgerSetup();
  getIncomeStatementSetup();
};
