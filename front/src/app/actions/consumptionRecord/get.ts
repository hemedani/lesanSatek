"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["consumptionRecord"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["consumptionRecord"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "consumptionRecord",
      act: "get",
      details: {
        set: data,
        get: getSelection || { _id: 1, quantity: 1, consumedAt: 1, reason: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت مصرف" },
    };
  }
};
