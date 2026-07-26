"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const deductDirect = async (
  data: Omit<ReqType["main"]["budgetLine"]["deductDirect"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["budgetLine"]["deductDirect"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "budgetLine",
      act: "deductDirect",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, totalAllocated: 1, remainingBudget: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در کسر مستقیم بودجه" },
    };
  }
};
