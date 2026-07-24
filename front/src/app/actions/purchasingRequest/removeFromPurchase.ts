"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const removeFromPurchase = async (
  data: Omit<ReqType["main"]["purchasingRequest"]["removeFromPurchase"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["removeFromPurchase"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "removeFromPurchase",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, stuffStatus: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در حذف کالا" },
    };
  }
};
