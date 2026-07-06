"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getHistory = async (
  data: ReqType["main"]["purchasingRequest"]["getHistory"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["getHistory"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "getHistory",
      details: {
        set: data,
        get: getSelection || { _id: 1, action: 1, performer: 1, createdAt: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت تاریخچه درخواست خرید" },
    };
  }
};
