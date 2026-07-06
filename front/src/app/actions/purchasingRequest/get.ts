"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["purchasingRequest"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "get",
      details: {
        set: data,
        get: getSelection || { _id: 1, title: 1, status: 1, estimatedAmount: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت درخواست خرید" },
    };
  }
};
