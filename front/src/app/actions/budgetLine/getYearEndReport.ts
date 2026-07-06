"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getYearEndReport = async (
  data: ReqType["main"]["budgetLine"]["getYearEndReport"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["budgetLine"]["getYearEndReport"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "budgetLine",
      act: "getYearEndReport",
      details: {
        set: data,
        get: getSelection || {},
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت گزارش پایان سال" },
    };
  }
};
