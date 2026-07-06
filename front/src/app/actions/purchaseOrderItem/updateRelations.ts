"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const updateRelations = async (
  data: ReqType["main"]["purchaseOrderItem"]["updateRelations"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchaseOrderItem"]["updateRelations"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchaseOrderItem",
      act: "updateRelations",
      details: {
        set: data,
        get: getSelection || { _id: 1, quantity: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی روابط آیتم سفارش خرید" },
    };
  }
};
