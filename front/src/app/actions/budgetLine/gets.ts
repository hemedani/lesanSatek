"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["budgetLine"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["budgetLine"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "budgetLine",
      act: "gets",
      details: {
        set: data,
        get: getSelection || { _id: 1, code: 1, title: 1, totalAllocated: 1, remainingBudget: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست ردیف‌های بودجه" },
    };
  }
};
