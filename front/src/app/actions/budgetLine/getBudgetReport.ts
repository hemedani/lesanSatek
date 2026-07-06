"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getBudgetReport = async (
  data: ReqType["main"]["budgetLine"]["getBudgetReport"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["budgetLine"]["getBudgetReport"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "budgetLine",
      act: "getBudgetReport",
      details: {
        set: data,
        get: getSelection || {},
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت گزارش بودجه" },
    };
  }
};
