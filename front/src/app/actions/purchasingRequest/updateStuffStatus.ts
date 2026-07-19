"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const updateStuffStatus = async (
  data: ReqType["main"]["purchasingRequest"]["updateStuffStatus"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["updateStuffStatus"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "updateStuffStatus",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, stuffStatus: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی وضعیت کالا" },
    };
  }
};
