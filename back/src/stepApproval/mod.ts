import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { submitDecisionSetup } from "./submitDecision/mod.ts";
import { removeSetup } from "./remove/mod.ts";

export const stepApprovalSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
  submitDecisionSetup();
  removeSetup();
};
