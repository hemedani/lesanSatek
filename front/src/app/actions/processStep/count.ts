"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const count = async (
  data: ReqType["main"]["processStep"]["count"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["processStep"]["count"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "processStep",
      act: "count",
      details: {
        set: data,
        get: getSelection || { qty: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در شمارش گام‌های فرآیند" },
    };
  }
};
