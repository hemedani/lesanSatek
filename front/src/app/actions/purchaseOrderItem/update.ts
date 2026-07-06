"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const update = async (
  data: ReqType["main"]["purchaseOrderItem"]["update"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchaseOrderItem"]["update"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchaseOrderItem",
      act: "update",
      details: {
        set: data,
        get: getSelection || { _id: 1, quantity: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی آیتم سفارش خرید" },
    };
  }
};
