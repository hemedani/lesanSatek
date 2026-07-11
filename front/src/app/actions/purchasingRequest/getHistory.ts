"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getHistory = async (
  data: ReqType["main"]["purchasingRequest"]["getHistory"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["getHistory"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "getHistory",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, action: 1, performed: 1, unit: 1, details: 1 },
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
