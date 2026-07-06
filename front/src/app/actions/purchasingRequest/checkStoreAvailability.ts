"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const checkStoreAvailability = async (
  data: ReqType["main"]["purchasingRequest"]["checkStoreAvailability"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["checkStoreAvailability"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "checkStoreAvailability",
      details: {
        set: data,
        get: getSelection || { _id: 1, price: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در بررسی موجودی فروشگاه" },
    };
  }
};
