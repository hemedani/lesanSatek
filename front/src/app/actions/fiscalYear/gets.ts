"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["fiscalYear"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["fiscalYear"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "fiscalYear",
      act: "gets",
      details: {
        set: data,
        get: getSelection || { _id: 1, name: 1, status: 1, startDate: 1, endDate: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست سال‌های مالی" },
    };
  }
};
